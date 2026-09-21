from typing import Any, Dict, List, Optional
from langchain_core.tools import BaseTool

from messaging_tools import send_message
from reminder_mutations import cancel_reminder, edit_reminder
from reminder_tools import list_reminders, set_reminder
from tools_builtin import (
    BLOCKED_SHELL_COMMANDS,
    ENABLE_SHELL_TOOL,
    check_product,
    execute_shell,
    knowledge_base,
    read_files,
    write_file,
)

all_tools: List[BaseTool] = [
    knowledge_base,
    check_product,
    execute_shell,
    write_file,
    read_files,
    set_reminder,
    edit_reminder,
    list_reminders,
    cancel_reminder,
    send_message,
]

TOOLS_BY_NAME: Dict[str, BaseTool] = {tool.name: tool for tool in all_tools}
TOOLS_BY_NAME["send_messages"] = send_message


def get_all_tools() -> List[BaseTool]:
    """Return all registered tools in their canonical execution order."""
    return list(all_tools)


def get_tool_by_name(name: str) -> Optional[BaseTool]:
    """Lookup registered tool by exact name."""
    return TOOLS_BY_NAME.get(name)


def get_all_tool_names() -> List[str]:
    """Return list of canonical tool names."""
    return [t.name for t in all_tools]
