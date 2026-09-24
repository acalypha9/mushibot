import asyncio
import json
import os
import sys
from typing import List, Optional, Tuple

import httpx
from chat_context import (
    DEFAULT_PERSONA,
    SYSTEM_RULES,
    WHATSAPP_FORMAT_RULES,
    get_current_time_str,
)
from config import NEXTJS_URL
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage


def message_to_raw_dict(msg) -> dict:
    """Convert a LangChain message object into pure raw OpenAI-compatible API JSON dict."""
    cls_name = msg.__class__.__name__
    content = getattr(msg, "content", "")

    if cls_name == "SystemMessage":
        return {"role": "system", "content": content}
    elif cls_name == "HumanMessage":
        return {"role": "user", "content": content}
    elif cls_name in ("AIMessage", "AIMessageChunk"):
        item = {"role": "assistant", "content": content}
        tool_calls = getattr(msg, "tool_calls", None)
        if tool_calls:
            item["tool_calls"] = [
                {
                    "id": tc.get("id"),
                    "type": "function",
                    "function": {
                        "name": tc.get("name"),
                        "arguments": json.dumps(tc.get("args")) if isinstance(tc.get("args"), dict) else str(tc.get("args", "")),
                    },
                }
                for tc in tool_calls
            ]
        return item
    elif cls_name == "ToolMessage":
        item = {"role": "tool", "content": content}
        name = getattr(msg, "name", None)
        tool_call_id = getattr(msg, "tool_call_id", None)
        if name:
            item["name"] = name
        if tool_call_id:
            item["tool_call_id"] = tool_call_id
        return item
    return {"role": "unknown", "content": str(content)}


def message_to_full_raw_dict(msg) -> dict:
    """Serialize complete raw LangChain AIMessage response object into JSON dict."""
    if not msg:
        return {}
    if hasattr(msg, "model_dump"):
        try:
            dumped = msg.model_dump()
            return json.loads(json.dumps(dumped, default=str))
        except Exception:
            pass
    if hasattr(msg, "dict"):
        try:
            dumped = msg.dict()
            return json.loads(json.dumps(dumped, default=str))
        except Exception:
            pass
    return message_to_raw_dict(msg)


def _log_raw_request(turn: int, messages: list, model_name: str = "", tools: list = None) -> None:
    """Print pure raw JSON request payload sent to LLM API in console."""
    if os.getenv("LOG_RAW_MODEL_IO", "false").lower() not in ("true", "1", "yes"):
        return
    model_str = f" [Model: {model_name}]" if model_name else ""
    header_title = f" [RAW JSON REQUEST (Turn {turn}){model_str}] "
    side_len = max(0, (80 - len(header_title)) // 2)
    border = "=" * side_len

    raw_messages = [message_to_raw_dict(m) for m in messages]
    raw_payload = {
        "model": model_name,
        "messages": raw_messages,
    }

    if tools:
        from langchain_core.utils.function_calling import convert_to_openai_tool

        raw_tools = []
        for t in tools:
            try:
                raw_tools.append(convert_to_openai_tool(t))
            except Exception:
                name = getattr(t, "name", str(t))
                desc = getattr(t, "description", "") or ""
                args = getattr(t, "args", {})
                raw_tools.append(
                    {
                        "type": "function",
                        "function": {
                            "name": name,
                            "description": desc,
                            "parameters": {
                                "type": "object",
                                "properties": args if isinstance(args, dict) else {},
                            },
                        },
                    }
                )
        raw_payload["tools"] = raw_tools

    print(f"\n{border}{header_title}{border}", file=sys.stderr, flush=True)
    if model_name:
        print(f"Target Model: {model_name}", file=sys.stderr, flush=True)
    print(json.dumps(raw_payload, indent=2, ensure_ascii=False), file=sys.stderr, flush=True)
    print("=" * 80 + "\n", file=sys.stderr, flush=True)


def _log_raw_response(turn: int, full_message, model_name: str = "") -> None:
    """Print pure raw JSON response received from LLM API in console."""
    if os.getenv("LOG_RAW_MODEL_IO", "false").lower() not in ("true", "1", "yes"):
        return
    model_str = f" [Model: {model_name}]" if model_name else ""
    header_title = f" [RAW JSON RESPONSE (Turn {turn}){model_str}] "
    side_len = max(0, (80 - len(header_title)) // 2)
    border = "=" * side_len

    raw_resp = message_to_full_raw_dict(full_message)

    print(f"\n{border}{header_title}{border}", file=sys.stderr, flush=True)
    if model_name:
        print(f"Model Used: {model_name}", file=sys.stderr, flush=True)
    print(json.dumps(raw_resp, indent=2, ensure_ascii=False), file=sys.stderr, flush=True)
    print("=" * 80 + "\n", file=sys.stderr, flush=True)


async def build_effective_system_prompt(
    system_prompt: Optional[str],
    channel: Optional[str],
    current_recipient: Optional[str],
    enabled_tools: list,
    channel_id: Optional[str] = None,
) -> str:
    persona = system_prompt.strip() if (system_prompt and system_prompt.strip()) else DEFAULT_PERSONA
    rules = SYSTEM_RULES
    if channel and str(channel).upper() == "WHATSAPP":
        rules = f"{SYSTEM_RULES}\n{WHATSAPP_FORMAT_RULES}"

    kb_collections_prompt = ""
    if any(t.name == "knowledge_base" for t in enabled_tools):
        try:
            from knowledge import get_collections_info

            col_info = get_collections_info()
            kb_collections_prompt = f"\n\nAvailable Knowledge Collections & Topics:\n{col_info}"
        except Exception as err:
            print(f"[WARN] Failed to fetch collections for system prompt: {err}", file=sys.stderr, flush=True)

    wa_groups_prompt = ""
    if channel and str(channel).upper() == "WHATSAPP":
        try:
            from reminder_service import fetch_whatsapp_groups_cached

            active_chan = (channel_id or "default").strip()
            raw_groups = await asyncio.to_thread(fetch_whatsapp_groups_cached, active_chan)
            if raw_groups:
                valid_groups = [
                    {"name": str(g.get("subject")).strip(), "id": str(g.get("id")).strip()}
                    for g in raw_groups
                    if g.get("id") and str(g.get("id")).strip().endswith("@g.us") and g.get("subject")
                ]
                if valid_groups:
                    wa_groups_prompt = (
                        f"\n\nAvailable WhatsApp Groups (Name -> JID):\n"
                        f"```json\n{json.dumps(valid_groups, ensure_ascii=False, indent=2)}\n```\n"
                        "CRITICAL INSTRUCTION FOR REMINDERS & MESSAGES: When creating, setting, or scheduling a reminder for a specific WhatsApp group, you MUST provide the group's exact canonical '@g.us' JID (from the 'id' field above, e.g. '120363xxx@g.us') as the recipient parameter. NEVER pass a raw group name as the recipient to reminder tools."
                    )
        except Exception as err:
            print(f"[WARN] Failed to fetch WhatsApp groups for system prompt: {err}", file=sys.stderr, flush=True)

    recipient_prompt = ""
    if current_recipient and str(current_recipient).strip():
        clean_curr_rec = str(current_recipient).strip()
        recipient_prompt = (
            f"\n\nCurrent Conversation Recipient / User Phone: '{clean_curr_rec}'\n"
            f"When creating or updating a reminder for the user without an explicitly mentioned group, always use '{clean_curr_rec}' as the recipient."
        )

    time_info = f"\nCurrent Time: {get_current_time_str()}"

    return f"{persona}\n{time_info}\n\n{rules}{kb_collections_prompt}{wa_groups_prompt}{recipient_prompt}"


def prepare_chat_messages(
    history: List[Tuple[str, str]],
    max_history_messages: int,
    effective_system_prompt: str,
) -> List[BaseMessage]:
    messages: List[BaseMessage] = [SystemMessage(content=effective_system_prompt)]

    recent_history = history[-max_history_messages:] if len(history) > max_history_messages else history

    filtered_history: List[Tuple[str, str]] = []
    for sender_type, content in recent_history:
        if sender_type == "CUSTOMER":
            if filtered_history and filtered_history[-1][0] == "CUSTOMER":
                filtered_history[-1] = (sender_type, content)
            else:
                filtered_history.append((sender_type, content))
        elif sender_type == "AI":
            filtered_history.append((sender_type, content))

    for sender_type, content in filtered_history:
        if sender_type == "CUSTOMER":
            messages.append(HumanMessage(content=content))
        elif sender_type == "AI":
            messages.append(AIMessage(content=content))

    return messages
