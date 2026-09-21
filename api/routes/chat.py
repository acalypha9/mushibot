import uuid
import sys
import json
import re
import asyncio
import traceback
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import User, Conversation, Message
from auth import get_current_user, require_admin, require_admin_or_internal
from config import NEXTJS_URL
from chat import run_chat, get_active_chat_llm, generate_conversation_title, normalize_model_name
from schemas import (
    CreateConversationRequest, ConversationResponse, ConversationListResponse,
    MessageResponse, SendMessageRequest, ChatResponse, UpdateConversationRequest,
    ChannelQueryRequest,
)

from datetime import datetime, timezone

router = APIRouter(prefix="/api/chat", tags=["chat"])



@router.get("/provider-status")
def get_provider_status(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Check if an active Chat Model Provider with an API Key is set up."""
    try:
        get_active_chat_llm(db)
        return {"configured": True}
    except ValueError as err:
        return {"configured": False, "message": str(err)}


def normalize_whatsapp_message(text: str) -> str:
    if not text:
        return ""
    res = re.sub(r'\*\*(.*?)\*\*', r'*\1*', text)
    res = re.sub(r'^#{1,6}\s+(.+)$', r'*\1*', res, flags=re.MULTILINE)
    lines = res.split('\n')
    processed = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped.startswith('|') and stripped.endswith('|'):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith('|') and lines[i].strip().endswith('|'):
                table_lines.append(lines[i].strip())
                i += 1

            rows = []
            for tl in table_lines:
                if re.match(r'^\|[\s\-:|]+\|$', tl):
                    continue
                parts = [c.strip() for c in tl.split('|')]
                cells = parts[1:-1]
                if cells:
                    rows.append(cells)

            if rows:
                headers = []
                data_rows = rows
                if len(rows) > 1:
                    first_row_clean = [re.sub(r'[*_]', '', c).strip().lower() for c in rows[0]]
                    if any(h in first_row_clean for h in ['detail', 'field', 'key', 'property', 'attribute', 'item', 'kolom', 'fitur', 'nama', 'name', 'no', 'id', 'produk', 'product', 'kategori']):
                        headers = [c.strip() for c in rows[0]]
                        data_rows = rows[1:]

                for row in data_rows:
                    if len(row) == 2:
                        k, v = row[0], row[1]
                        k_clean = k.strip('*_ ')
                        processed.append(f"• *{k_clean}*: {v}")
                    elif len(row) > 2:
                        item_title = row[0].strip('*_ ')
                        processed.append(f"*{item_title}*")
                        for idx in range(1, len(row)):
                            val = row[idx]
                            hdr = headers[idx] if idx < len(headers) else None
                            if hdr:
                                hdr_clean = hdr.strip('*_ ')
                                processed.append(f"  • *{hdr_clean}*: {val}")
                            else:
                                processed.append(f"  • {val}")
                        processed.append("")
                    elif len(row) == 1:
                        processed.append(f"• {row[0]}")
            continue
        else:
            processed.append(line)
            i += 1

    res = '\n'.join(processed)
    res = re.sub(r'\n{3,}', '\n\n', res)
    return res.strip()


async def push_to_whatsapp(jid: str, text: str):
    """Directly push LLM turn message to WhatsApp via Next.js backend API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"{NEXTJS_URL}/api/channel/whatsapp",
                json={
                    "action": "send_direct",
                    "jid": jid,
                    "text": text,
                }
            )
            print(f"[DIRECT WHATSAPP PUSH SUCCESS] To {jid}: {text[:40]}...", file=sys.stderr, flush=True)
    except Exception as err:
        print(f"[DIRECT WHATSAPP PUSH ERROR] {err}", file=sys.stderr, flush=True)


class ChannelContext:
    """Prepared context for channel chat endpoints."""
    def __init__(self, conv, history, user_id, channel_type, phone_formatted, title_str, target_jid):
        self.conv = conv
        self.history = history
        self.user_id = user_id
        self.channel_type = channel_type
        self.phone_formatted = phone_formatted
        self.title_str = title_str
        self.target_jid = target_jid


def _prepare_channel_context(data: ChannelQueryRequest, db: Session) -> ChannelContext:
    """
    Shared logic for all channel-query endpoints:
    validates provider, finds/creates conversation, saves customer message, builds history.
    Raises ValueError if provider not configured, or HTTPException if no admin user.
    """
    admin_user = db.query(User).filter(User.role == "ADMIN").first() or db.query(User).first()
    if not admin_user:
        raise HTTPException(status_code=500, detail="No user account found in database.")

    user_id = admin_user.id
    channel_type = (data.channel or "WHATSAPP").upper()
    session_timeout_sec = data.session_timeout or 300

    sender_raw = (data.sender_id or data.remote_jid or "").split("@")[0].strip().lstrip("+")
    is_group = (
        (data.sender_id or "").endswith("@g.us")
        or (data.remote_jid or "").endswith("@g.us")
        or len(re.sub(r'[^\d]', '', sender_raw)) > 15
        or sender_raw.startswith("120363")
    )

    digits_only = re.sub(r'[^\d]', '', sender_raw)
    is_valid_phone = not is_group and (8 <= len(digits_only) <= 14)

    if is_group:
        phone_formatted = sender_raw  # Strictly without '+' prefix for group IDs
        group_name = None
        try:
            import httpx, os
            nextjs_url = os.getenv("NEXTJS_URL", "http://web:3000")
            resp = httpx.get(f"{nextjs_url}/api/channel/whatsapp?action=groups", timeout=2.0)
            if resp.status_code == 200:
                for g in resp.json().get("groups", []):
                    clean_gid = g.get("id", "").replace("@g.us", "").replace("+", "").strip()
                    if clean_gid == sender_raw:
                        group_name = g.get("subject")
                        break
        except Exception:
            pass

        resolved_group = (group_name or "").strip() or "Group"
        grp_prefix = "Whatsapp Group" if channel_type == "WHATSAPP" else f"{channel_type.capitalize()} Group"
        title_str = f"{grp_prefix} - {resolved_group}"
        participant_name = data.push_name.strip() if (data.push_name and data.push_name.strip()) else "Member"
        participant_phone = (data.participant_phone or "").strip() or None
        if participant_phone:
            p_digits = re.sub(r'[^\d]', '', participant_phone)
            if len(p_digits) >= 8:
                participant_phone = f"+{p_digits}"
    elif is_valid_phone:
        phone_formatted = f"+{digits_only}"
        display_name = data.push_name.strip() if (data.push_name and data.push_name.strip()) else phone_formatted
        title_str = f"Whatsapp - {display_name}" if channel_type == "WHATSAPP" else f"{channel_type.capitalize()} - {display_name}"
        participant_name = display_name
        participant_phone = phone_formatted
    else:
        phone_formatted = sender_raw
        display_name = data.push_name.strip() if (data.push_name and data.push_name.strip()) else (phone_formatted or 'Guest')
        title_str = f"Whatsapp - {display_name}" if channel_type == "WHATSAPP" else f"{channel_type.capitalize()} - {display_name}"
        participant_name = display_name
        participant_phone = (data.participant_phone or "").strip() or (phone_formatted if phone_formatted else None)

    conv = None
    target_id_for_conv = phone_formatted if phone_formatted else None
    if target_id_for_conv:
        conv = (
            db.query(Conversation)
            .filter(
                Conversation.channel == channel_type,
                Conversation.customer_phone == target_id_for_conv,
                Conversation.status == "OPEN",
            )
            .order_by(Conversation.updated_at.desc())
            .first()
        )
        if conv and conv.updated_at:
            now_utc = datetime.now(timezone.utc)
            updated_at_utc = conv.updated_at.replace(tzinfo=timezone.utc) if conv.updated_at.tzinfo is None else conv.updated_at
            if (now_utc - updated_at_utc).total_seconds() > session_timeout_sec:
                conv.status = "RESOLVED"
                db.commit()
                conv = None
            else:
                updated_fields = False
                if conv.title != title_str:
                    conv.title = title_str
                    updated_fields = True
                if phone_formatted and conv.customer_phone != phone_formatted:
                    conv.customer_phone = phone_formatted
                    updated_fields = True
                if participant_name and conv.customer_name != participant_name:
                    conv.customer_name = participant_name
                    updated_fields = True
                if participant_phone and (not conv.participant_phone or conv.participant_phone != participant_phone):
                    conv.participant_phone = participant_phone
                    updated_fields = True
                if updated_fields:
                    db.commit()

    if not conv:
        conv = Conversation(
            id=uuid.uuid4(),
            customer_id=user_id,
            status="OPEN",
            channel=channel_type,
            title=title_str,
            customer_name=participant_name,
            customer_phone=phone_formatted if phone_formatted else None,
            participant_phone=participant_phone if participant_phone else None,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    cust_msg = Message(
        id=uuid.uuid4(),
        conversation_id=conv.id,
        sender_type="CUSTOMER",
        content=data.message,
        metadata_json={
            "sender_name": participant_name,
            "sender_phone": participant_phone,
        }
    )
    db.add(cust_msg)
    db.commit()

    db_msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    history = [(m.sender_type, m.content) for m in db_msgs]

    return ChannelContext(
        conv=conv,
        history=history,
        user_id=user_id,
        channel_type=channel_type,
        phone_formatted=phone_formatted,
        title_str=title_str,
        target_jid=data.remote_jid or (f"{digits_only}@s.whatsapp.net" if is_valid_phone else (data.sender_id if data.sender_id and "@" in data.sender_id else None)),
    )


@router.post("/channel-query-async")
async def channel_query_async(
    data: ChannelQueryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_admin_or_internal),
):
    """Async channel query endpoint: Pushes each LLM turn message immediately to WhatsApp as it completes."""
    try:
        get_active_chat_llm(db, requested_model=data.model, override_timeout=data.response_timeout)
    except ValueError as err:
        print(f"[CHANNEL-QUERY-ASYNC ERROR] {err}", file=sys.stderr, flush=True)
        if data.remote_jid:
            background_tasks.add_task(push_to_whatsapp, data.remote_jid, "Maaf, saat ini layanan sedang tidak dapat digunakan.")
        return {"status": "ok", "error": str(err)}

    try:
        ctx = _prepare_channel_context(data, db)
    except HTTPException as err:
        print(f"[CHANNEL-QUERY-ASYNC ERROR] {err.detail}", file=sys.stderr, flush=True)
        if data.remote_jid:
            background_tasks.add_task(push_to_whatsapp, data.remote_jid, "Maaf, layanan AI sedang dalam pemeliharaan.")
        return {"status": "ok", "error": "No admin user"}

    conv_id = ctx.conv.id
    target_jid = ctx.target_jid

    async def process_chat_turns():
        from database import SessionLocal
        chat_gen = run_chat(
            ctx.history,
            db=db,
            requested_model=data.model,
            override_timeout=data.response_timeout,
            system_prompt=data.system_prompt,
            channel=ctx.channel_type,
            current_recipient=ctx.target_jid or ctx.phone_formatted or data.remote_jid or data.sender_id,
        )
        try:
            while True:
                event = await anext(chat_gen)
                if event.get("error"):
                    print(f"[CHANNEL-QUERY-ASYNC ERROR] {event.get('error')}", file=sys.stderr, flush=True)
                    if target_jid:
                        await push_to_whatsapp(target_jid, "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi.")
                    break
                elif event.get("turn_done"):
                    content = event.get("content", "").strip()
                    has_more = event.get("has_more", False)
                    if content:
                        resp_formatted = normalize_whatsapp_message(content) if ctx.channel_type == "WHATSAPP" else content
                        usage_meta = event.get("usage_metadata") or {}
                        p_tokens = usage_meta.get("input_tokens") or 0
                        c_tokens = usage_meta.get("output_tokens") or 0
                        r_tokens = usage_meta.get("reasoning_tokens") or 0
                        t_tokens = usage_meta.get("total_tokens") or (p_tokens + c_tokens)

                        inner_db = SessionLocal()
                        try:
                            model_name_used = normalize_model_name(usage_meta.get("model_name") or data.model or ctx.conv.model_name, inner_db)
                            ai_msg = Message(
                                id=uuid.uuid4(),
                                conversation_id=conv_id,
                                sender_type="AI",
                                content=resp_formatted,
                                metadata_json=usage_meta,
                                prompt_tokens=p_tokens,
                                completion_tokens=c_tokens,
                                reasoning_tokens=r_tokens,
                                total_tokens=t_tokens,
                                model_name=model_name_used,
                            )
                            inner_db.add(ai_msg)
                            inner_db.commit()
                        finally:
                            inner_db.close()

                        if target_jid:
                            await push_to_whatsapp(target_jid, content)
                    if not has_more:
                        break
                elif event.get("done"):
                    break
        except StopAsyncIteration:
            pass
        except Exception as exc:
            print(f"LLM error in channel_query_async: {exc}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            if target_jid:
                await push_to_whatsapp(target_jid, "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi.")

    background_tasks.add_task(process_chat_turns)
    return {"status": "processing"}


@router.post("/channel-query-stream")
async def channel_query_stream(
    data: ChannelQueryRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_admin_or_internal),
):
    """Streaming query endpoint for channel integrations like WhatsApp & Telegram."""
    try:
        get_active_chat_llm(db, requested_model=data.model, override_timeout=data.response_timeout)
    except ValueError as err:
        print(f"[CHANNEL-QUERY-STREAM ERROR] {err}", file=sys.stderr, flush=True)
        async def err_gen():
            yield json.dumps({"text": "Maaf, saat ini layanan sedang tidak dapat digunakan."}) + "\n"
        return StreamingResponse(err_gen(), media_type="application/x-ndjson")

    try:
        ctx = _prepare_channel_context(data, db)
    except HTTPException as err:
        print(f"[CHANNEL-QUERY-STREAM ERROR] {err.detail}", file=sys.stderr, flush=True)
        async def err_gen():
            yield json.dumps({"text": "Maaf, layanan AI sedang dalam pemeliharaan."}) + "\n"
        return StreamingResponse(err_gen(), media_type="application/x-ndjson")

    chat_gen = run_chat(
        ctx.history,
        db=db,
        requested_model=data.model,
        override_timeout=data.response_timeout if (data.response_timeout and data.response_timeout > 30) else 120.0,
        system_prompt=data.system_prompt,
        channel=ctx.channel_type,
        current_recipient=ctx.target_jid or ctx.phone_formatted or data.remote_jid or data.sender_id,
    )

    conv_id = ctx.conv.id

    async def stream_generator():
        try:
            while True:
                event = await anext(chat_gen)
                if event.get("error"):
                    print(f"[CHANNEL-QUERY-STREAM ERROR] {event.get('error')}", file=sys.stderr, flush=True)
                    yield json.dumps({"text": "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi."}) + "\n"
                    break
                elif event.get("turn_done"):
                    content = event.get("content", "").strip()
                    has_more = event.get("has_more", False)
                    if content:
                        resp_formatted = normalize_whatsapp_message(content) if ctx.channel_type == "WHATSAPP" else content
                        usage_meta = event.get("usage_metadata") or {}
                        model_name_used = normalize_model_name(usage_meta.get("model_name") or data.model or ctx.conv.model_name, db)
                        p_tokens = usage_meta.get("input_tokens") or 0
                        c_tokens = usage_meta.get("output_tokens") or 0
                        r_tokens = usage_meta.get("reasoning_tokens") or 0
                        t_tokens = usage_meta.get("total_tokens") or (p_tokens + c_tokens)

                        ai_msg = Message(
                            id=uuid.uuid4(),
                            conversation_id=conv_id,
                            sender_type="AI",
                            content=resp_formatted,
                            metadata_json=usage_meta,
                            prompt_tokens=p_tokens,
                            completion_tokens=c_tokens,
                            reasoning_tokens=r_tokens,
                            total_tokens=t_tokens,
                            model_name=model_name_used,
                        )
                        db.add(ai_msg)
                        db.commit()
                        yield json.dumps({"text": content}) + "\n"
                        await asyncio.sleep(0.05)
                    if not has_more:
                        break
                elif event.get("done"):
                    break
        except StopAsyncIteration:
            pass
        except Exception as exc:
            print(f"LLM error in channel_query_stream: {exc}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            yield json.dumps({"text": "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi."}) + "\n"

    return StreamingResponse(stream_generator(), media_type="application/x-ndjson")


# WARNING: In-memory state — breaks with multiple Uvicorn workers.
# For multi-worker deployment, replace with Redis-backed session store.
_active_chat_sessions = {}


@router.post("/channel-query")
async def channel_query(
    data: ChannelQueryRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_admin_or_internal),
):
    """Public query endpoint for channel integrations like WhatsApp & Telegram."""
    try:
        get_active_chat_llm(db, requested_model=data.model, override_timeout=data.response_timeout)
    except ValueError as err:
        print(f"[CHANNEL-QUERY ERROR] {err}", file=sys.stderr, flush=True)
        return {"response": "Maaf, saat ini layanan sedang tidak dapat digunakan.", "responses": [], "has_more": False}

    try:
        ctx = _prepare_channel_context(data, db)
    except HTTPException as err:
        print(f"[CHANNEL-QUERY ERROR] {err.detail}", file=sys.stderr, flush=True)
        return {"response": "Maaf, layanan AI sedang dalam pemeliharaan.", "responses": [], "has_more": False}

    chat_gen = run_chat(
        ctx.history,
        db=db,
        requested_model=data.model,
        override_timeout=data.response_timeout if (data.response_timeout and data.response_timeout > 30) else 120.0,
        system_prompt=data.system_prompt,
        channel=ctx.channel_type,
        current_recipient=ctx.target_jid or ctx.phone_formatted or data.remote_jid or data.sender_id,
    )

    all_turn_contents = []
    final_content = ""

    try:
        async for event in chat_gen:
            print(f"[CHANNEL-QUERY] Received event: {event}", file=sys.stderr, flush=True)
            if event.get("error"):
                print(f"[CHANNEL-QUERY ERROR] {event.get('error')}", file=sys.stderr, flush=True)
                final_content = "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi."
                break
            elif event.get("turn_done"):
                content = event.get("content", "").strip()
                if content:
                    resp_formatted = normalize_whatsapp_message(content) if ctx.channel_type == "WHATSAPP" else content
                    usage_meta = event.get("usage_metadata") or {}
                    model_name_used = normalize_model_name(usage_meta.get("model_name") or data.model or ctx.conv.model_name, db)
                    p_tokens = usage_meta.get("input_tokens") or 0
                    c_tokens = usage_meta.get("output_tokens") or 0
                    r_tokens = usage_meta.get("reasoning_tokens") or 0
                    t_tokens = usage_meta.get("total_tokens") or (p_tokens + c_tokens)

                    ai_msg = Message(
                        id=uuid.uuid4(),
                        conversation_id=ctx.conv.id,
                        sender_type="AI",
                        content=resp_formatted,
                        metadata_json=usage_meta,
                        prompt_tokens=p_tokens,
                        completion_tokens=c_tokens,
                        reasoning_tokens=r_tokens,
                        total_tokens=t_tokens,
                        model_name=model_name_used,
                    )
                    db.add(ai_msg)
                    db.commit()
                    all_turn_contents.append(resp_formatted)
                    final_content = resp_formatted
            elif event.get("done"):
                break
    except Exception as exc:
        print(f"LLM error in channel_query: {exc}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        final_content = "Maaf, terjadi kendala saat memproses pesan Anda. Silakan coba beberapa saat lagi."

    combined_response = "\n\n".join(all_turn_contents) if all_turn_contents else final_content

    return {
        "response": combined_response,
        "responses": all_turn_contents,
        "has_more": False
    }


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
def create_conversation(
    data: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = Conversation(
        id=uuid.uuid4(),
        customer_id=current_user.id,
        status="OPEN",
        channel=data.channel,
        model_name=data.model_name,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    # Return with empty messages list
    result = ConversationResponse.model_validate(conv)
    result.messages = []
    return result


@router.get("/conversations", response_model=ConversationListResponse)
def list_conversations(
    limit: int = 50,
    offset: int = 0,
    all_users: bool = False,
    channel: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Conversation)
    if channel:
        query = query.filter(Conversation.channel == channel)
    if not all_users or current_user.role == "CUSTOMER":
        query = query.filter(Conversation.customer_id == current_user.id)

    # Only list conversations that have messages
    query = query.filter(
        db.query(Message).filter(Message.conversation_id == Conversation.id).exists()
    )

    total = query.count()
    conversations = query.order_by(Conversation.is_pinned.desc(), Conversation.created_at.desc()).offset(offset).limit(limit).all()

    customer_ids = {c.customer_id for c in conversations if c.customer_id}
    users_map = {}
    if customer_ids:
        users = db.query(User).filter(User.id.in_(customer_ids)).all()
        users_map = {u.id: u for u in users}

    items = []
    for conv in conversations:
        msgs = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.asc())
            .all()
        )
        clean_msgs = [m for m in msgs if not (m.content and m.content.startswith("[Tool Context:"))]
        resp = ConversationResponse.model_validate(conv)
        user_obj = users_map.get(conv.customer_id)
        if (conv.channel or "").upper() == "WEB" and user_obj:
            resp.customer_name = user_obj.full_name
            resp.customer_email = user_obj.email
        elif conv.customer_name:
            resp.customer_name = conv.customer_name
        resp.participant_phone = conv.participant_phone
        resp.messages = [MessageResponse.model_validate(m) for m in clean_msgs]
        items.append(resp)

    return ConversationListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Conversation).filter(Conversation.id == conversation_id)
    if current_user.role == "CUSTOMER":
        query = query.filter(Conversation.customer_id == current_user.id)

    conv = query.first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    clean_msgs = [m for m in msgs if not (m.content and m.content.startswith("[Tool Context:"))]
    resp = ConversationResponse.model_validate(conv)
    user_obj = db.query(User).filter(User.id == conv.customer_id).first()
    if (conv.channel or "").upper() == "WEB" and user_obj:
        resp.customer_name = user_obj.full_name
        resp.customer_email = user_obj.email
    elif conv.customer_name:
        resp.customer_name = conv.customer_name
    resp.participant_phone = conv.participant_phone
    resp.messages = [MessageResponse.model_validate(m) for m in clean_msgs]
    return resp


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: uuid.UUID,
    data: UpdateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("ADMIN", "CUSTOMER"):
        raise HTTPException(status_code=403, detail="Permission denied")

    query = db.query(Conversation).filter(Conversation.id == conversation_id)
    if current_user.role == "CUSTOMER":
        query = query.filter(Conversation.customer_id == current_user.id)

    conv = query.first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if data.title is not None:
        conv.title = data.title
    if data.summary is not None:
        conv.summary = data.summary
    if data.is_pinned is not None:
        conv.is_pinned = data.is_pinned
    if data.status is not None:
        conv.status = data.status
    if data.model_name is not None:
        conv.model_name = data.model_name

    db.commit()
    db.refresh(conv)

    msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    resp = ConversationResponse.model_validate(conv)
    resp.messages = [MessageResponse.model_validate(m) for m in msgs]
    return resp


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("ADMIN", "CUSTOMER"):
        raise HTTPException(status_code=403, detail="Permission denied")

    query = db.query(Conversation).filter(Conversation.id == conversation_id)
    if current_user.role == "CUSTOMER":
        query = query.filter(Conversation.customer_id == current_user.id)

    conv = query.first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return None


@router.post("/channel-reset")
def channel_reset(
    channel: Optional[str] = "WHATSAPP",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Reset all active channel sessions by resolving open conversations without deleting conversation history."""
    global _active_chat_sessions
    _active_chat_sessions.clear()

    channel_type = (channel or "WHATSAPP").upper()
    open_conversations = db.query(Conversation).filter(
        Conversation.channel == channel_type,
        Conversation.status == "OPEN"
    ).all()
    count = len(open_conversations)
    for conv in open_conversations:
        conv.status = "RESOLVED"
    db.commit()

    return {
        "status": "success",
        "total_sessions": count,
        "count": count,
        "message": f"{count} session(s) reset"
    }


@router.delete("/conversations", status_code=200)
def reset_all_conversations(
    channel: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Reset all active sessions for current user / channel by resolving open conversations without deleting history."""
    global _active_chat_sessions
    _active_chat_sessions.clear()

    query = db.query(Conversation).filter(Conversation.status == "OPEN")
    if channel:
        query = query.filter(Conversation.channel == channel.upper())
    conversations = query.all()
    count = len(conversations)
    for conv in conversations:
        conv.status = "RESOLVED"
    db.commit()

    return {
        "status": "success",
        "total_sessions": count,
        "count": count,
        "message": f"{count} session(s) reset"
    }


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify active chat provider exists and has an API Key
    try:
        get_active_chat_llm(db)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.role == "CUSTOMER" and conv.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if conv.status == "RESOLVED":
        raise HTTPException(status_code=400, detail="Conversation is resolved")

    # Handle edit or new message
    if data.edit_message_id:
        try:
            target_uuid = uuid.UUID(data.edit_message_id)
            target_msg = db.query(Message).filter(
                Message.id == target_uuid,
                Message.conversation_id == conversation_id
            ).first()
            if target_msg:
                # Delete all subsequent messages in this conversation created after the edited message
                db.query(Message).filter(
                    Message.conversation_id == conversation_id,
                    Message.created_at > target_msg.created_at
                ).delete(synchronize_session=False)

                target_msg.content = data.content
                db.commit()
                db.refresh(target_msg)
                cust_msg = target_msg
            else:
                cust_msg = Message(
                    id=uuid.uuid4(),
                    conversation_id=conversation_id,
                    sender_type="CUSTOMER",
                    content=data.content,
                )
                db.add(cust_msg)
                db.commit()
                db.refresh(cust_msg)
        except ValueError:
            cust_msg = Message(
                id=uuid.uuid4(),
                conversation_id=conversation_id,
                sender_type="CUSTOMER",
                content=data.content,
            )
            db.add(cust_msg)
            db.commit()
            db.refresh(cust_msg)
    else:
        cust_msg = Message(
            id=uuid.uuid4(),
            conversation_id=conversation_id,
            sender_type="CUSTOMER",
            content=data.content,
        )
        db.add(cust_msg)
        db.commit()
        db.refresh(cust_msg)

    # Auto-generate conversation title if not set (using non-blocking timeout fallback)
    if not conv.title or conv.title.strip() == "":
        clean_first = data.content.strip().replace("\n", " ")
        if len(clean_first) > 35:
            clean_first = clean_first[:32] + "..."
        conv.title = clean_first.title() if clean_first else "New Conversation"
        db.commit()

        try:
            generated_title = await asyncio.wait_for(generate_conversation_title(data.content, db=db), timeout=4.0)
            if generated_title:
                conv.title = generated_title
                db.commit()
                db.refresh(conv)
        except Exception:
            pass

    # Build history for LangChain
    db_msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    history = [(m.sender_type, m.content) for m in db_msgs]

    # --- Two-phase approach ---
    # Phase 1: Get the FIRST turn and return it immediately
    # Phase 2: If there are more turns (tool calls), process them in the background
    chat_gen = run_chat(history, db=db, requested_model=data.model or data.provider_id)
    first_turn = None
    has_more = False

    try:
        while True:
            event = await anext(chat_gen)
            if event.get("error"):
                raise HTTPException(status_code=400, detail=event["error"])
            if event.get("turn_done"):
                tool_results = event.get("tool_results") or []
                for tr in tool_results:
                    t_name = tr.get("name", "tool")
                    t_res = tr.get("result", "")
                    if t_res:
                        tool_msg = Message(
                            id=uuid.uuid4(),
                            conversation_id=conversation_id,
                            sender_type="AI",
                            content=f"[Tool Context: {t_name}]\n{t_res[:3000]}"
                        )
                        db.add(tool_msg)

                usage_meta = event.get("usage_metadata") or {}
                ai_msg_id = uuid.uuid4()
                ai_msg = Message(
                    id=ai_msg_id,
                    conversation_id=conversation_id,
                    sender_type="AI",
                    content=event["content"],
                    metadata_json=usage_meta,
                    prompt_tokens=usage_meta.get("input_tokens", 0),
                    completion_tokens=usage_meta.get("output_tokens", 0),
                    reasoning_tokens=usage_meta.get("reasoning_tokens", 0),
                    total_tokens=usage_meta.get("total_tokens", 0),
                    model_name=usage_meta.get("model_name"),
                )
                db.add(ai_msg)
                db.commit()
                first_turn = {
                    "message_id": str(ai_msg_id),
                    "content": event["content"],
                }
                has_more = event.get("has_more", False)
                break
            elif event.get("done"):
                break
    except StopAsyncIteration:
        pass
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        print(f"LLM error (Turn 1): {exc}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=400, detail=f"Model provider connection error: {str(exc)}")

    # Only schedule background processing if there are more turns (tool calls)
    if has_more:
        async def _process_remaining():
            from config import SessionLocal
            bg_db = SessionLocal()
            try:
                while True:
                    event = await anext(chat_gen)
                    if event.get("turn_done"):
                        tool_results = event.get("tool_results") or []
                        for tr in tool_results:
                            t_name = tr.get("name", "tool")
                            t_res = tr.get("result", "")
                            if t_res:
                                tool_msg = Message(
                                    id=uuid.uuid4(),
                                    conversation_id=conversation_id,
                                    sender_type="AI",
                                    content=f"[Tool Context: {t_name}]\n{t_res[:3000]}"
                                )
                                bg_db.add(tool_msg)

                        usage_meta = event.get("usage_metadata") or {}
                        ai_msg_id = uuid.uuid4()
                        ai_msg = Message(
                            id=ai_msg_id,
                            conversation_id=conversation_id,
                            sender_type="AI",
                            content=event["content"],
                            metadata_json=usage_meta,
                            prompt_tokens=usage_meta.get("input_tokens", 0),
                            completion_tokens=usage_meta.get("output_tokens", 0),
                            reasoning_tokens=usage_meta.get("reasoning_tokens", 0),
                            total_tokens=usage_meta.get("total_tokens", 0),
                            model_name=usage_meta.get("model_name"),
                        )
                        bg_db.add(ai_msg)
                        bg_db.commit()
                    elif event.get("done"):
                        break
            except StopAsyncIteration:
                pass
            except Exception as exc:
                print(f"LLM error (background): {exc}", file=sys.stderr)
                traceback.print_exc(file=sys.stderr)
                error_msg = "Sorry, I'm having trouble right now. Please try again later."
                ai_msg_id = uuid.uuid4()
                ai_msg = Message(
                    id=ai_msg_id,
                    conversation_id=conversation_id,
                    sender_type="AI",
                    content=error_msg,
                )
                bg_db.add(ai_msg)
                bg_db.commit()
            finally:
                bg_db.close()

        asyncio.create_task(_process_remaining())

    return {
        "turns": [first_turn] if first_turn else [],
        "processing": has_more,
        "title": conv.title,
        "conversation_id": str(conv.id),
    }
