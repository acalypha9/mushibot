import json
import uuid
from typing import Any, Dict, List, Optional, Union
from langchain_core.tools import tool

from reminder_service import (
    _parse_natural_schedule,
    normalize_reminder_variables,
    resolve_reminder_recipient,
)


@tool
def cancel_reminder(reminder_id_or_title: str) -> str:
    """Cancel, delete, or deactivate a scheduled reminder. Call this tool when the user asks to remove, cancel, or stop an existing reminder.

    Args:
        reminder_id_or_title: The ID (UUID) or title keyword of the reminder to cancel.
    """
    if not reminder_id_or_title or not reminder_id_or_title.strip():
        return json.dumps({"status": "error", "error": "reminder_id_or_title parameter is required"})

    from database import SessionLocal
    from models import CronReminder

    search_key = reminder_id_or_title.strip()
    db = SessionLocal()
    try:
        rem = None
        try:
            rem = db.query(CronReminder).filter(CronReminder.id == uuid.UUID(search_key)).first()
        except (ValueError, AttributeError, TypeError):
            pass

        if not rem:
            rem = db.query(CronReminder).filter(
                (CronReminder.title.ilike(f"%{search_key}%")) |
                (CronReminder.message.ilike(f"%{search_key}%"))
            ).first()

        if not rem:
            return json.dumps({
                "status": "error",
                "error": f"No reminder found matching '{search_key}'."
            })

        title = rem.title
        rem.is_active = False
        rem.next_run_at = None
        db.delete(rem)
        db.commit()

        return json.dumps({
            "status": "success",
            "message": f"Reminder '{title}' has been successfully cancelled and removed."
        }, ensure_ascii=False)
    except Exception as err:
        db.rollback()
        return json.dumps({"status": "error", "error": f"Failed to cancel reminder: {str(err)}"})
    finally:
        db.close()


@tool
def edit_reminder(
    reminder_id_or_title: str,
    time: Optional[str] = None,
    message: Optional[str] = None,
    title: Optional[str] = None,
    recipient: Optional[str] = None,
    channel_type: Optional[str] = None,
    is_recurring: Optional[bool] = None,
    message_limit: Optional[int] = None,
    variables: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None,
) -> str:
    """Edit, reschedule, or update an existing reminder. Call this tool when the user asks to modify, change, edit, or reschedule an existing reminder.

    Args:
        reminder_id_or_title: The ID or title keyword of the existing reminder to update.
        time: Optional new schedule trigger time, time window, interval, or cron expression.
        message: Optional updated message content.
        title: Optional updated title for the reminder.
        recipient: Optional new recipient phone number, group ID, or all.
        channel_type: Delivery channel (WHATSAPP, TELEGRAM, or WEB).
        is_recurring: Set to True for recurring schedules, or False for a one-time reminder.
        message_limit: Optional maximum number of messages per schedule interval.
        variables: Optional updated variable definitions for message placeholders.
    """
    if not reminder_id_or_title or not reminder_id_or_title.strip():
        return json.dumps({"status": "error", "error": "reminder_id_or_title parameter is required"})

    from database import SessionLocal
    from models import CronReminder

    search_key = reminder_id_or_title.strip()
    db = SessionLocal()
    try:
        rem = None
        try:
            rem = db.query(CronReminder).filter(CronReminder.id == uuid.UUID(search_key)).first()
        except (ValueError, AttributeError, TypeError):
            pass

        if not rem:
            rem = db.query(CronReminder).filter(
                (CronReminder.title.ilike(f"%{search_key}%")) |
                (CronReminder.message.ilike(f"%{search_key}%"))
            ).first()

        if not rem:
            all_active = db.query(CronReminder).filter(CronReminder.is_active == True).all()
            if len(all_active) == 1:
                rem = all_active[0]

        if not rem:
            return json.dumps({
                "status": "error",
                "error": f"No reminder found matching '{search_key}'."
            })

        tz_name = rem.timezone or "Asia/Jakarta"

        if title and title.strip():
            rem.title = title.strip()

        if channel_type and channel_type.strip():
            rem.channel_type = channel_type.strip().upper()

        if recipient and recipient.strip():
            rem.target_recipients = resolve_reminder_recipient(recipient, rem.channel_type)

        custom_meta = dict(rem.cmetadata) if isinstance(rem.cmetadata, dict) else {}
        if time and time.strip():
            recur_flag = is_recurring if is_recurring is not None else True
            parsed = _parse_natural_schedule(time, is_recurring=recur_flag, tz_name=tz_name, message_limit=message_limit)
            rem.cron_expression = parsed["cron_expression"]
            rem.description = parsed.get("description")
            rem.next_run_at = parsed["next_run_at"]
            if "_schedule" in parsed.get("cmetadata", {}):
                custom_meta["_schedule"] = parsed["cmetadata"]["_schedule"]
        elif message_limit and message_limit > 0:
            if "_schedule" in custom_meta and isinstance(custom_meta["_schedule"], dict):
                custom_meta["_schedule"]["max_runs"] = message_limit
            custom_meta["max_runs"] = message_limit

        current_msg = message.strip() if (message and message.strip()) else rem.message
        current_vars = list(custom_meta.get("_variables", [])) if isinstance(custom_meta.get("_variables"), list) else []
        norm_msg, vars_list = normalize_reminder_variables(current_msg, variables=variables, existing_vars=current_vars)

        rem.message = norm_msg
        custom_meta["_variables"] = vars_list
        custom_meta = {k: v for k, v in custom_meta.items() if k not in ("title",)}
        if is_recurring is not None:
            custom_meta["is_recurring"] = is_recurring
        rem.cmetadata = custom_meta

        db.commit()
        db.refresh(rem)

        return json.dumps({
            "status": "success",
            "message": f"Reminder '{rem.title}' has been successfully updated.",
            "reminder": {
                "id": str(rem.id),
                "title": rem.title,
                "message": rem.message,
                "schedule": rem.description or rem.cron_expression,
                "next_run_at": rem.next_run_at.strftime("%d:%m:%Y %H:%M:%S UTC") if rem.next_run_at else None,
                "timezone": tz_name,
                "channel": rem.channel_type,
                "recipient": rem.target_recipients or "Default",
                "is_active": rem.is_active,
                "variables": {v["key"]: v["value"] for v in vars_list} if vars_list else {}
            }
        }, ensure_ascii=False)
    except Exception as err:
        db.rollback()
        return json.dumps({"status": "error", "error": f"Failed to edit reminder: {str(err)}"})
    finally:
        db.close()
