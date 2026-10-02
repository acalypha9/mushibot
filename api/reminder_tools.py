import json
import re
import uuid
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
from langchain_core.tools import tool

from reminder_service import (
    build_reminder_signature,
    format_reminder_dict,
    prepare_reminder_preflight,
    resolve_reminder_recipient,
)


class ReminderBatchItem(BaseModel):
    message: str
    time: str
    title: Optional[str] = None
    recipient: Optional[Union[str, List[str]]] = None
    channel_type: Optional[str] = "WHATSAPP"
    is_recurring: Optional[bool] = False
    message_limit: Optional[int] = None
    variables: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None


@tool
def set_reminder(
    message: Optional[str] = None,
    time: Optional[str] = None,
    title: Optional[str] = None,
    recipient: Optional[Union[str, List[str]]] = None,
    channel_type: Optional[str] = "WHATSAPP",
    is_recurring: Optional[bool] = False,
    message_limit: Optional[int] = None,
    variables: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None,
    reminders: Optional[List[ReminderBatchItem]] = None,
) -> str:
    """Create or schedule a reminder, alert, or automated message broadcast. Supports single reminder or a batch list of reminders.

    Args:
        message: The reminder message content (required for single reminder).
        time: Schedule trigger time, date, time window, interval, or cron expression (required for single reminder).
        title: Optional title or summary for the reminder.
        recipient: Target recipient phone number, group ID, group name, list of recipients, or 'ALL'.
        channel_type: Delivery channel (WHATSAPP, TELEGRAM, or WEB).
        is_recurring: Set to True for recurring schedules, or False for a one-time reminder.
        message_limit: Optional maximum number of messages per schedule interval.
        variables: Optional list of variable configurations for message placeholders.
        reminders: Optional list of reminder items to create in a single atomic batch transaction.
    """
    is_batch = reminders is not None
    if is_batch:
        if not reminders:
            return json.dumps({"status": "error", "error": "reminders list cannot be empty"})
        raw_items = reminders
    else:
        if not message or not message.strip():
            return json.dumps({"status": "error", "error": "message parameter is required"})
        if not time or not time.strip():
            return json.dumps({"status": "error", "error": "time parameter is required"})
        raw_items = [
            ReminderBatchItem(
                message=message,
                time=time,
                title=title,
                recipient=recipient,
                channel_type=channel_type,
                is_recurring=is_recurring,
                message_limit=message_limit,
                variables=variables,
            )
        ]

    validated_items: List[ReminderBatchItem] = []
    for idx, item in enumerate(raw_items):
        if isinstance(item, ReminderBatchItem):
            validated_items.append(item)
        elif isinstance(item, dict):
            try:
                validated_items.append(ReminderBatchItem(**item))
            except Exception as err:
                return json.dumps({"status": "error", "error": f"Invalid reminder item at index {idx}: {str(err)}"})
        else:
            return json.dumps({"status": "error", "error": f"Invalid reminder item at index {idx}"})

    active_channel_id = "default"
    try:
        from chat_context import current_chat_channel_id_var
        active_channel_id = current_chat_channel_id_var.get() or "default"
    except Exception:
        pass

    from database import SessionLocal
    from models import CronReminder

    tz_name = "Asia/Jakarta"
    preflight_items = []
    for item in validated_items:
        p, err_msg = prepare_reminder_preflight(item, active_channel_id, tz_name=tz_name)
        if err_msg or not p:
            return json.dumps({"status": "error", "error": err_msg or "Failed to prepare reminder"})
        preflight_items.append(p)

    db = SessionLocal()
    try:
        active_candidates: List[CronReminder] = []
        if hasattr(db, "query"):
            active_candidates = db.query(CronReminder).filter(CronReminder.is_active == True).all()

        existing_by_sig: Dict[tuple, CronReminder] = {}
        for cand in active_candidates:
            cand_chan = cand.channel_type or "WHATSAPP"
            cand_chan_id = cand.channel_id or "default"
            resolved_cand_rec = resolve_reminder_recipient(cand.target_recipients, cand_chan, channel_id=cand_chan_id)
            sig = build_reminder_signature(cand_chan, cand_chan_id, resolved_cand_rec, cand.next_run_at, cand.message)
            if sig not in existing_by_sig:
                existing_by_sig[sig] = cand

        item_actions: List[Dict[str, Any]] = []
        in_batch_seen: Dict[tuple, CronReminder] = {}
        to_create: List[CronReminder] = []
        created_count = 0
        skipped_count = 0

        for p in preflight_items:
            sig = build_reminder_signature(
                p["clean_channel"],
                p["channel_id"],
                p["clean_recipient"],
                p["next_run_at"],
                p["clean_msg"],
            )

            if sig in existing_by_sig:
                item_actions.append({"type": "existing", "record": existing_by_sig[sig], "preflight": p})
                skipped_count += 1
            elif sig in in_batch_seen:
                item_actions.append({"type": "intra_batch_dup", "record": in_batch_seen[sig], "preflight": p})
                skipped_count += 1
            else:
                new_rem = CronReminder(
                    id=uuid.uuid4(),
                    title=p["title"],
                    description=p["parsed"].get("description"),
                    message=p["clean_msg"],
                    cron_expression=p["parsed"]["cron_expression"],
                    timezone=p["tz_name"],
                    channel_type=p["clean_channel"],
                    channel_id=p["channel_id"],
                    target_recipients=p["clean_recipient"],
                    is_active=True,
                    next_run_at=p["next_run_at"],
                    cmetadata=p["custom_meta"],
                )
                in_batch_seen[sig] = new_rem
                to_create.append(new_rem)
                item_actions.append({"type": "novel", "record": new_rem, "preflight": p})
                created_count += 1

        if to_create:
            for new_rem in to_create:
                db.add(new_rem)
            db.commit()
            for new_rem in to_create:
                db.refresh(new_rem)

        batch_result = [
            format_reminder_dict(action["record"], action["preflight"], action["type"] in ("existing", "intra_batch_dup"))
            for action in item_actions
        ]

        if is_batch:
            return json.dumps({
                "status": "success",
                "message": (
                    f"Successfully created {created_count} reminders."
                    if skipped_count == 0
                    else f"Successfully created {created_count} reminders ({skipped_count} already scheduled)."
                ),
                "count": created_count,
                "created_count": created_count,
                "skipped_count": skipped_count,
                "reminders": batch_result,
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "status": "success",
                "message": "Reminder already scheduled." if (item_actions and item_actions[0]["type"] in ("existing", "intra_batch_dup")) else "Reminder created successfully.",
                "reminder": batch_result[0] if batch_result else {},
            }, ensure_ascii=False)
    except Exception as err:
        if hasattr(db, "rollback"):
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
