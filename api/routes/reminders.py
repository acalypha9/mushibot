"""Reminders routing and backward-compatible facade module."""

from routes.reminders_delivery import execute_reminder_delivery
from routes.reminders_routes import (
    create_reminder,
    delete_reminder,
    get_reminder,
    list_available_channels,
    list_reminders,
    router,
    toggle_reminder_status,
    trigger_reminder_now,
    update_reminder,
)
from routes.reminders_scheduler import (
    DEFAULT_TIMEZONE,
    calculate_next_run,
    get_tz,
)

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
