import json
import re
import uuid
from typing import Any, Dict, List, Optional, Union
from langchain_core.tools import tool

from reminder_service import (
    _parse_natural_schedule,
    normalize_reminder_variables,
    resolve_reminder_recipient,
)


@tool
def set_reminder(
    message: str,
    time: str,
    title: Optional[str] = None,
    recipient: Optional[str] = None,
    channel_type: Optional[str] = "WHATSAPP",
    is_recurring: Optional[bool] = False,
    message_limit: Optional[int] = None,
    variables: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None,
) -> str:
    """Create or schedule a reminder, alert, or automated message broadcast.

    Args:
        message: The reminder message content.
        time: Schedule trigger time, time window, interval, or cron expression.
        title: Optional title or summary for the reminder.
        recipient: Target recipient phone number, group ID, or all.
        channel_type: Delivery channel (WHATSAPP, TELEGRAM, or WEB).
        is_recurring: Set to True for recurring schedules, or False for a one-time reminder.
        message_limit: Optional maximum number of messages per schedule interval.
        variables: Optional list of variable configurations for message placeholders.
    """
    if not message or not message.strip():
        return json.dumps({"status": "error", "error": "message parameter is required"})
    if not time or not time.strip():
        return json.dumps({"status": "error", "error": "time parameter is required"})

    clean_msg = message.strip()
    if not title or not title.strip():
        first_line = clean_msg.split("\n")[0]
        clean_first_line = re.sub(r'[*_~`#]', '', first_line).strip()
        if clean_first_line and len(clean_first_line) > 3:
            final_title = clean_first_line[:50].strip()
        else:
            final_title = f"Reminder ({time.strip()})"
    else:
        final_title = title.strip()

    from database import SessionLocal
    from models import CronReminder

    tz_name = "Asia/Jakarta"
    parsed = _parse_natural_schedule(time, is_recurring=bool(is_recurring), tz_name=tz_name, message_limit=message_limit)

    active_channel_id = "default"
    try:
        from chat_context import current_chat_channel_id_var
        active_channel_id = current_chat_channel_id_var.get() or "default"
    except Exception:
        pass

    clean_channel = (channel_type or "WHATSAPP").upper()
    clean_recipient = resolve_reminder_recipient(recipient, clean_channel, channel_id=active_channel_id)
    clean_msg, vars_list = normalize_reminder_variables(clean_msg, variables=variables)

    custom_meta = {k: v for k, v in dict(parsed.get("cmetadata", {})).items() if k not in ("title",)}
    custom_meta["is_recurring"] = parsed.get("is_recurring", False)
    if vars_list:
        custom_meta["_variables"] = vars_list
        for v in vars_list:
            custom_meta[v["key"]] = {"type": v["type"], "value": v["value"]}

    db = SessionLocal()
    try:
        reminder_id = uuid.uuid4()
        new_rem = CronReminder(
            id=reminder_id,
            title=final_title,
            description=parsed.get("description"),
            message=clean_msg,
            cron_expression=parsed["cron_expression"],
            timezone=tz_name,
            channel_type=clean_channel,
            channel_id=active_channel_id,
            target_recipients=clean_recipient,
            is_active=True,
            next_run_at=parsed["next_run_at"],
            cmetadata=custom_meta,
        )
        db.add(new_rem)
        db.commit()
        db.refresh(new_rem)

        return json.dumps({
            "status": "success",
            "message": "Reminder created successfully.",
            "reminder": {
                "id": str(new_rem.id),
                "title": new_rem.title,
                "message": new_rem.message,
                "schedule": parsed.get("description"),
                "next_run_at": new_rem.next_run_at.strftime("%d:%m:%Y %H:%M:%S UTC") if new_rem.next_run_at else None,
                "timezone": tz_name,
                "channel": new_rem.channel_type,
                "recipient": new_rem.target_recipients or "Current / Default recipient",
                "is_recurring": parsed.get("is_recurring", False),
                "variables": {v["key"]: v["value"] for v in vars_list} if vars_list else {}
            }
        }, ensure_ascii=False)
    except Exception as err:
        db.rollback()
        return json.dumps({"status": "error", "error": f"Failed to create reminder: {str(err)}"})
    finally:
        db.close()


@tool
def list_reminders(status_filter: Optional[str] = "active") -> str:
    """List scheduled reminders and broadcasts. Call this tool when the user asks to see what reminders are currently scheduled, active, or upcoming.

    Args:
        status_filter: Filter reminders by status ('active', 'all', or 'inactive'). Default is 'active'.
    """
    from database import SessionLocal
    from models import CronReminder

    db = SessionLocal()
    try:
        query = db.query(CronReminder)
        if status_filter and status_filter.lower() == "active":
            query = query.filter(CronReminder.is_active == True)
        elif status_filter and status_filter.lower() == "inactive":
            query = query.filter(CronReminder.is_active == False)

        reminders = query.order_by(CronReminder.created_at.asc()).all()
        result_list = []
        for r in reminders:
            result_list.append({
                "id": str(r.id),
                "title": r.title,
                "message": r.message,
                "cron_expression": r.cron_expression,
                "schedule": r.description or r.cron_expression,
                "next_run_at": r.next_run_at.strftime("%d:%m:%Y %H:%M:%S UTC") if r.next_run_at else None,
                "is_active": r.is_active,
                "channel": r.channel_type,
                "recipient": r.target_recipients or "All channel members"
            })

        return json.dumps({
            "status": "success",
            "count": len(result_list),
            "reminders": result_list
        }, ensure_ascii=False)
    except Exception as err:
        return json.dumps({"status": "error", "error": f"Failed to list reminders: {str(err)}"})
    finally:
        db.close()
