import json
import sys
import uuid
from pathlib import Path
from typing import List, Optional

from croniter import croniter
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import CronReminder, User
from routes.reminders_delivery import execute_reminder_delivery
from routes.reminders_scheduler import (
    DEFAULT_TIMEZONE,
    calculate_next_run,
    get_tz,
)
from schemas import (
    CronReminderCreate,
    CronReminderResponse,
    CronReminderTriggerResponse,
    CronReminderUpdate,
)

router = APIRouter(prefix="/api/reminders", tags=["Cron Reminders"])


@router.get("/channels")
def list_available_channels(
    current_user: User = Depends(require_admin),
):
    channels = []
    try:
        base_dir = Path(__file__).resolve().parent.parent.parent
        channels_file = base_dir / "auth" / "channels.json"
        if channels_file.exists():
            with open(channels_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for c in data:
                        channels.append(
                            {
                                "id": c.get("id", "default"),
                                "name": c.get("name", "Channel"),
                                "type": c.get("type", "WHATSAPP"),
                                "boundPhone": c.get("boundPhone"),
                                "autoReplyEnabled": c.get("autoReplyEnabled", True),
                            }
                        )
    except Exception as err:
        print(f"[Channels List Error] {err}", file=sys.stderr)

    return {"channels": channels}


@router.get("", response_model=List[CronReminderResponse])
def list_reminders(
    search: Optional[str] = Query(
        None, description="Search by title, description or message"
    ),
    channel: Optional[str] = Query(
        None, description="Filter by channel type (WHATSAPP, TELEGRAM, WEB)"
    ),
    status_filter: Optional[str] = Query(
        None, description="Filter by status (active, inactive)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(CronReminder)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (CronReminder.title.ilike(term))
            | (CronReminder.description.ilike(term))
            | (CronReminder.message.ilike(term))
            | (CronReminder.target_recipients.ilike(term))
            | (CronReminder.channel_type.ilike(term))
        )

    if channel and channel.strip() and channel.upper() != "ALL":
        query = query.filter(CronReminder.channel_type == channel.upper())

    if status_filter:
        if status_filter.lower() == "active":
            query = query.filter(CronReminder.is_active == True)
        elif status_filter.lower() == "inactive":
            query = query.filter(CronReminder.is_active == False)

    return query.order_by(CronReminder.created_at.asc()).all()


@router.post(
    "", response_model=CronReminderResponse, status_code=status.HTTP_201_CREATED
)
def create_reminder(
    data: CronReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cron_expr = data.cron_expression.strip()
    if not croniter.is_valid(cron_expr):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid cron expression: '{cron_expr}'. Please provide a standard 5-field cron syntax.",
        )

    tz_name = data.timezone or DEFAULT_TIMEZONE
    next_run = (
        calculate_next_run(cron_expr, tz_name, cmetadata=data.cmetadata)
        if data.is_active
        else None
    )

    reminder = CronReminder(
        id=uuid.uuid4(),
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        message=data.message.strip(),
        cron_expression=cron_expr,
        timezone=tz_name,
        channel_type=(data.channel_type or "WHATSAPP").upper(),
        channel_id=data.channel_id or "default",
        target_recipients=data.target_recipients.strip()
        if data.target_recipients
        else None,
        is_active=data.is_active,
        next_run_at=next_run,
        cmetadata=data.cmetadata,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.get("/{reminder_id}", response_model=CronReminderResponse)
def get_reminder(
    reminder_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reminder = db.query(CronReminder).filter(CronReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Cron reminder not found")
    return reminder


@router.put("/{reminder_id}", response_model=CronReminderResponse)
def update_reminder(
    reminder_id: uuid.UUID,
    data: CronReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reminder = db.query(CronReminder).filter(CronReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Cron reminder not found")

    if data.title is not None:
        reminder.title = data.title.strip()
    if data.description is not None:
        reminder.description = data.description.strip() if data.description else None
    if data.message is not None:
        reminder.message = data.message.strip()
    if data.timezone is not None:
        reminder.timezone = data.timezone
    if data.channel_type is not None:
        reminder.channel_type = data.channel_type.upper()
    if data.channel_id is not None:
        reminder.channel_id = data.channel_id
    if data.target_recipients is not None:
        reminder.target_recipients = (
            data.target_recipients.strip() if data.target_recipients else None
        )
    if data.cmetadata is not None:
        reminder.cmetadata = data.cmetadata

    if data.cron_expression is not None:
        clean_expr = data.cron_expression.strip()
        if not croniter.is_valid(clean_expr):
            raise HTTPException(
                status_code=400, detail=f"Invalid cron expression: '{clean_expr}'"
            )
        reminder.cron_expression = clean_expr

    if data.is_active is not None:
        reminder.is_active = data.is_active

    if reminder.is_active:
        reminder.next_run_at = calculate_next_run(
            reminder.cron_expression,
            reminder.timezone,
            cmetadata=reminder.cmetadata,
        )
    else:
        reminder.next_run_at = None

    db.commit()
    db.refresh(reminder)
    return reminder


@router.patch("/{reminder_id}/toggle", response_model=CronReminderResponse)
def toggle_reminder_status(
    reminder_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reminder = db.query(CronReminder).filter(CronReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Cron reminder not found")

    reminder.is_active = not reminder.is_active
    if reminder.is_active:
        reminder.next_run_at = calculate_next_run(
            reminder.cron_expression,
            reminder.timezone,
            cmetadata=reminder.cmetadata,
        )
    else:
        reminder.next_run_at = None

    db.commit()
    db.refresh(reminder)
    return reminder


@router.post("/{reminder_id}/trigger", response_model=CronReminderTriggerResponse)
async def trigger_reminder_now(
    reminder_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reminder = db.query(CronReminder).filter(CronReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Cron reminder not found")

    res = await execute_reminder_delivery(reminder)

    return CronReminderTriggerResponse(
        success=res["success"],
        message=f"Test reminder '{reminder.title}': {res['detail']}",
        details=res,
    )


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reminder = db.query(CronReminder).filter(CronReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Cron reminder not found")

    db.delete(reminder)
    db.commit()
    return None


__all__ = [
    "router",
    "calculate_next_run",
    "execute_reminder_delivery",
    "get_tz",
    "DEFAULT_TIMEZONE",
    "list_available_channels",
    "list_reminders",
    "create_reminder",
    "get_reminder",
    "update_reminder",
    "toggle_reminder_status",
    "trigger_reminder_now",
    "delete_reminder",
]
