# noqa: SIZE_OK - Single dashboard overview projection with one legacy route alias
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from auth import require_admin
from models import (
    User,
    Conversation,
    Message,
    KnowledgeDocument,
    KnowledgeCollection,
    FunctionTool,
    McpServer,
    ModelProvider,
)

from chat import normalize_model_name

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _get_whatsapp_channel_status(db: Session) -> Dict[str, Any]:
    try:
        from routes.chat import whatsapp_session
        if whatsapp_session and whatsapp_session.get("connected"):
            return {
                "status": "CONNECTED",
                "phone_number": whatsapp_session.get("phone_number", ""),
                "connected_at": whatsapp_session.get("connected_at", ""),
            }
    except Exception:
        pass
    return {
        "status": "DISCONNECTED",
        "phone_number": "",
        "connected_at": None,
    }


@router.get("/overview")
def get_dashboard_overview(
    time_range: str = Query("day", description="Time window for token statistics: 'hour', 'day', or 'week'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    now = datetime.now(timezone.utc)
    range_str = (time_range or "day").strip().lower()

    if range_str == "hour":
        since_time = now - timedelta(hours=2)
        msg_in_window = db.query(func.count(Message.id)).filter(Message.created_at >= since_time).scalar() or 0
        if msg_in_window == 0:
            since_time = now - timedelta(hours=24)
        buckets = [(now - timedelta(hours=23 - i)).strftime("%H:00") for i in range(24)]
    elif range_str == "week":
        since_time = now - timedelta(weeks=12)
        buckets = []
        for i in range(12):
            w_start = (now - timedelta(weeks=11 - i))
            w_start = w_start - timedelta(days=w_start.weekday())
            buckets.append(w_start.strftime("%Y-%m-%d"))
    elif range_str == "all":
        since_time = datetime(2000, 1, 1, tzinfo=timezone.utc)
        buckets = [(now - timedelta(days=29 - i)).strftime("%Y-%m-%d") for i in range(30)]
    else:  # 'day' / default 30d
        since_time = now - timedelta(days=7)
        msg_in_window = db.query(func.count(Message.id)).filter(Message.created_at >= since_time).scalar() or 0
        if msg_in_window == 0:
            since_time = now - timedelta(days=30)
        buckets = [(now - timedelta(days=29 - i)).strftime("%Y-%m-%d") for i in range(30)]

    # 1. Conversations metrics
    total_convs = db.query(func.count(Conversation.id)).scalar() or 0
    open_convs = db.query(func.count(Conversation.id)).filter(Conversation.status == "OPEN").scalar() or 0
    resolved_convs = db.query(func.count(Conversation.id)).filter(Conversation.status == "RESOLVED").scalar() or 0
    web_convs = db.query(func.count(Conversation.id)).filter(Conversation.channel == "WEB").scalar() or 0
    wa_convs = db.query(func.count(Conversation.id)).filter(Conversation.channel == "WHATSAPP").scalar() or 0

    total_msgs = db.query(func.count(Message.id)).scalar() or 0
    ai_msgs_count = db.query(func.count(Message.id)).filter(Message.sender_type == "AI").scalar() or 0
    cust_msgs_count = db.query(func.count(Message.id)).filter(Message.sender_type == "CUSTOMER").scalar() or 0

    # Recent active conversations
    recent_conv_rows = db.query(Conversation).order_by(Conversation.updated_at.desc()).limit(5).all()
    recent_convs = []
    for c in recent_conv_rows:
        cust = db.query(User).filter(User.id == c.customer_id).first() if c.customer_id else None
        recent_convs.append({
            "id": str(c.id),
            "title": c.title or f"Conversation #{str(c.id)[:8]}",
            "channel": c.channel,
            "status": c.status,
            "customer_name": cust.full_name if cust else "Guest",
            "customer_email": cust.email if cust else None,
            "customer_phone": c.customer_phone,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        })

    # 2. Token Analytics (filtered by time window)
    sum_prompt = db.query(func.coalesce(func.sum(Message.prompt_tokens), 0)).filter(Message.sender_type == "AI", Message.created_at >= since_time).scalar() or 0
    sum_completion = db.query(func.coalesce(func.sum(Message.completion_tokens), 0)).filter(Message.sender_type == "AI", Message.created_at >= since_time).scalar() or 0
    sum_reasoning = db.query(func.coalesce(func.sum(Message.reasoning_tokens), 0)).filter(Message.sender_type == "AI", Message.created_at >= since_time).scalar() or 0
    sum_total = sum_prompt + sum_completion + sum_reasoning

    # Active accounts count (within time window)
    active_accounts_count = (
        db.query(func.count(func.distinct(Conversation.customer_id)))
        .join(Message, Message.conversation_id == Conversation.id)
        .filter(Message.created_at >= since_time)
        .scalar() or 0
    )

    model_name_col = func.coalesce(Message.model_name, "gemini-3.5-flash-low").label("model_name")

    # Models used count (within time window)
    models_used_rows = (
        db.query(func.distinct(model_name_col))
        .filter(Message.sender_type == "AI", Message.created_at >= since_time)
        .all()
    )
    models_used_count = len(models_used_rows)

    # Model Breakdown table telemetry
    model_breakdown_rows = (
        db.query(
            model_name_col,
            func.count(Message.id).label("requests"),
            func.coalesce(func.sum(Message.prompt_tokens), 0).label("input_tokens"),
            func.coalesce(func.sum(Message.completion_tokens), 0).label("output_tokens"),
            func.coalesce(func.sum(Message.reasoning_tokens), 0).label("cached_tokens"),
        )
        .filter(Message.sender_type == "AI", Message.created_at >= since_time)
        .group_by(model_name_col)
        .all()
    )

    model_map = {}
    for row in model_breakdown_rows:
        m_name = normalize_model_name(row.model_name, db)

        inp = int(row.input_tokens)
        out = int(row.output_tokens)
        cch = int(row.cached_tokens)
        tot = inp + out + cch
        req = int(row.requests)

        if m_name not in model_map:
            model_map[m_name] = {
                "model_name": m_name,
                "requests": 0,
                "input_tokens": 0,
                "output_tokens": 0,
                "cached_tokens": 0,
                "total_tokens": 0,
            }
        model_map[m_name]["requests"] += req
        model_map[m_name]["input_tokens"] += inp
        model_map[m_name]["output_tokens"] += out
        model_map[m_name]["cached_tokens"] += cch
        model_map[m_name]["total_tokens"] += tot

    parsed_breakdown = list(model_map.values())
    total_table_tokens = sum(item["total_tokens"] for item in parsed_breakdown)
    denom = max(total_table_tokens, 1)

    model_breakdown = []
    for item in parsed_breakdown:
        pct = round((item["total_tokens"] / denom) * 100, 1)
        item["percentage"] = pct
        model_breakdown.append(item)
    model_breakdown = sorted(model_breakdown, key=lambda x: x["total_tokens"], reverse=True)

    # Account Breakdown (by user/customer)
    account_breakdown_rows = (
        db.query(
            User.full_name,
            User.email,
            func.coalesce(func.sum(Message.prompt_tokens + Message.completion_tokens + Message.reasoning_tokens), 0)
        )
        .join(Conversation, Conversation.customer_id == User.id)
        .join(Message, Message.conversation_id == Conversation.id)
        .filter(Message.created_at >= since_time)
        .group_by(User.id, User.full_name, User.email)
        .limit(5)
        .all()
    )
    account_breakdown = []
    for name, email, tokens in account_breakdown_rows:
        t_num = int(tokens)
        pct = round((t_num / denom) * 100, 1)
        account_breakdown.append({
            "name": name or email or "User",
            "email": email or "",
            "total_tokens": t_num,
            "percentage": pct,
        })

    # Token History (Time-series aggregated dynamically by range_str: hour, day, week)
    ai_msg_rows = (
        db.query(
            Message.created_at,
            model_name_col,
            func.coalesce(Message.prompt_tokens, 0).label("prompt"),
            func.coalesce(Message.completion_tokens, 0).label("completion"),
            func.coalesce(Message.reasoning_tokens, 0).label("reasoning"),
        )
        .filter(Message.sender_type == "AI", Message.created_at >= since_time)
        .order_by(Message.created_at.asc())
        .all()
    )

    daily_history_dict = {}
    model_series_dict = {}

    for row in ai_msg_rows:
        c_at = row.created_at
        if not c_at:
            continue

        if c_at.tzinfo is None:
            c_at_local = c_at.replace(tzinfo=timezone.utc).astimezone()
        else:
            c_at_local = c_at.astimezone()

        if range_str == "hour":
            date_key = c_at_local.strftime("%H:00")
        elif range_str == "week":
            start_of_week = c_at_local - timedelta(days=c_at_local.weekday())
            date_key = start_of_week.strftime("%Y-%m-%d")
        else:  # 'day'
            date_key = c_at_local.strftime("%Y-%m-%d")

        p_tok = int(row.prompt)
        c_tok = int(row.completion)
        r_tok = int(row.reasoning)
        tot_tok = p_tok + c_tok + r_tok

        # Aggregate daily_history
        if date_key not in daily_history_dict:
            daily_history_dict[date_key] = {
                "date": date_key,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "reasoning_tokens": 0,
                "total_tokens": 0,
                "requests": 0,
            }
        daily_history_dict[date_key]["prompt_tokens"] += p_tok
        daily_history_dict[date_key]["completion_tokens"] += c_tok
        daily_history_dict[date_key]["reasoning_tokens"] += r_tok
        daily_history_dict[date_key]["total_tokens"] += tot_tok
        daily_history_dict[date_key]["requests"] += 1

        # Aggregate model_series
        m_name = normalize_model_name(row.model_name, db)

        if m_name not in model_series_dict:
            model_series_dict[m_name] = {}
        if date_key not in model_series_dict[m_name]:
            model_series_dict[m_name][date_key] = 0
        model_series_dict[m_name][date_key] += tot_tok

    daily_history = list(daily_history_dict.values())
    model_series = {
        m_name: [{"date": d, "total_tokens": t} for d, t in dates.items()]
        for m_name, dates in model_series_dict.items()
    }

    # 3. Knowledge Base Metrics
    total_docs = db.query(func.count(KnowledgeDocument.id)).scalar() or 0
    active_docs = db.query(func.count(KnowledgeDocument.id)).filter(KnowledgeDocument.status == "ACTIVE").scalar() or 0
    total_collections = db.query(func.count(KnowledgeCollection.id)).scalar() or 0
    total_chunks = db.query(func.coalesce(func.sum(KnowledgeDocument.chunk_count), 0)).scalar() or 0

    # 4. Channel Status
    wa_info = _get_whatsapp_channel_status(db)

    # 5. Function Tools & MCP
    total_tools = db.query(func.count(FunctionTool.id)).scalar() or 0
    enabled_tools = db.query(func.count(FunctionTool.id)).filter(FunctionTool.is_enabled == True).scalar() or 0
    mcp_servers = db.query(func.count(McpServer.id)).scalar() or 0
    active_mcp = db.query(func.count(McpServer.id)).filter(McpServer.is_enabled == True).scalar() or 0

    # 6. Model Providers
    total_providers = db.query(func.count(ModelProvider.id)).scalar() or 0
    active_providers = db.query(func.count(ModelProvider.id)).filter(ModelProvider.is_active == True).scalar() or 0
    default_p = db.query(ModelProvider).filter(ModelProvider.is_active == True, ModelProvider.is_default == True).first()
    if not default_p:
        default_p = db.query(ModelProvider).filter(ModelProvider.is_active == True).first()
    default_model_name = default_p.name if default_p else "None Configured"

    # 7. Personnel Records / Users
    total_users = db.query(func.count(User.id)).scalar() or 0
    admins = db.query(func.count(User.id)).filter(User.role == "ADMIN").scalar() or 0
    agents = db.query(func.count(User.id)).filter(User.role == "CS_AGENT").scalar() or 0
    customers = db.query(func.count(User.id)).filter(User.role == "CUSTOMER").scalar() or 0

    return {
        "time_range": range_str,
        "conversations": {
            "total": total_convs,
            "open": open_convs,
            "resolved": resolved_convs,
            "web_count": web_convs,
            "whatsapp_count": wa_convs,
            "total_messages": total_msgs,
            "ai_messages": ai_msgs_count,
            "customer_messages": cust_msgs_count,
            "recent": recent_convs,
        },
        "token_analytics": {
            "total_prompt_tokens": int(sum_prompt),
            "total_completion_tokens": int(sum_completion),
            "total_reasoning_tokens": int(sum_reasoning),
            "cached_tokens": int(sum_reasoning),
            "total_tokens": int(sum_total),
            "active_accounts_count": active_accounts_count,
            "models_used_count": models_used_count,
            "model_breakdown": model_breakdown,
            "account_breakdown": account_breakdown,
            "daily_history": daily_history,
            "model_series": model_series,
        },
        "knowledge": {
            "total_documents": total_docs,
            "active_documents": active_docs,
            "total_collections": total_collections,
            "total_chunks": int(total_chunks),
        },
        "channel": {
            "whatsapp_status": wa_info["status"],
            "whatsapp_phone": wa_info["phone_number"],
            "active_channels": (1 if wa_info["status"] == "CONNECTED" else 0) + (1 if total_convs > 0 else 0),
        },
        "tools": {
            "total_tools": total_tools,
            "enabled_tools": enabled_tools,
            "mcp_servers": mcp_servers,
            "active_mcp_servers": active_mcp,
        },
        "providers": {
            "total_providers": total_providers,
            "active_providers": active_providers,
            "default_model": default_model_name,
        },
        "users": {
            "total_users": total_users,
            "admins": admins,
            "agents": agents,
            "customers": customers,
        },
    }


# Backward compatibility route for legacy reports endpoint
@router.get("/reports/overview", include_in_schema=False)
def get_reports_overview_legacy(
    time_range: str = Query("day"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return get_dashboard_overview(time_range=time_range, db=db, current_user=current_user)
