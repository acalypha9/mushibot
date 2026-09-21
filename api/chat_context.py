import sys
from contextvars import ContextVar
from datetime import datetime
from typing import Optional

try:
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None

from sqlalchemy.orm import Session
from tools import all_tools

DEFAULT_PERSONA = "You are a helpful AI assistant."


def get_current_time_str() -> str:
    """Return formatted current time information dynamically fetched from the host system."""
    try:
        import os
        host_tz = os.getenv("HOST_TIMEZONE") or os.getenv("TZ")
        if host_tz and ZoneInfo:
            try:
                return datetime.now(ZoneInfo(host_tz.strip())).strftime("%A, %d/%m/%Y %H:%M:%S")
            except Exception:
                pass

        # Dynamically fetch local time with host system's timezone
        return datetime.now().astimezone().strftime("%A, %d/%m/%Y %H:%M:%S")
    except Exception:
        return datetime.now().strftime("%A, %d/%m/%Y %H:%M:%S")


SYSTEM_RULES = (
    "RULES:\n"
    "1. TOOLS & RETRIEVAL: Use relevant tools when data lookup, knowledge retrieval, or specific actions are needed.\n"
    "2. NATURAL RESPONSES: Never mention internal documents, files, databases, or retrieval sources. Speak naturally as an assistant.\n"
    "3. UNAVAILABLE INFORMATION: When requested information is not available, clearly state that you do not have that information, and offer what topics you can help with as a list.\n"
    "4. RESPONSE FORMAT: Provide direct, clear answers in the user's language without unnecessary preambles or code blocks.\n"
    "5. TOOL ARGUMENTS: Always populate all required tool arguments when invoking tools.\n"
)

WHATSAPP_FORMAT_RULES = (
    "STRICT: You MUST strictly adhere to this format for all responses\n"
    "- Italic: _text_\n"
    "- Bold: *text*\n"
    "- Strikethrough: ~text~\n"
    "- Monospace: ```text```\n"
    "- Bulleted list: * text or - text\n"
    "- Numbered list: 1. text\n"
    "- Quote: > text\n"
    "- Inline code: `text`\n"
    "- For Tables using the existing formatting rules\n"
)

SYSTEM_PROMPT = f"{DEFAULT_PERSONA}\n\nCurrent Time: {get_current_time_str()}\n\n{SYSTEM_RULES}"

_tool_map = {t.name: t for t in all_tools}

current_chat_recipient_var: ContextVar[Optional[str]] = ContextVar("current_chat_recipient_var", default=None)


def get_enabled_tools(db: Session) -> list:
    try:
        from models import FunctionTool
        from routes.tools import sync_tools_from_file
        from mcp_executor import get_active_mcp_tools

        sync_tools_from_file(db)

        enabled_records = db.query(FunctionTool).filter(FunctionTool.is_enabled == True).all()
        enabled_names = {t.name for t in enabled_records}

        builtin_tools = [t for t in all_tools if t.name in enabled_names]
        mcp_tools = get_active_mcp_tools(db)

        return builtin_tools + mcp_tools
    except Exception as err:
        print(f"[GET ENABLED TOOLS WARNING] {err}", file=sys.stderr, flush=True)
        return []
