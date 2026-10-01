from typing import Any, Dict, List, Optional, Set
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

# Closed explicit mapping of legacy and provider-emitted aliases to canonical tool names.
# Arbitrary namespacing or dynamic stripping of colon prefixes is strictly forbidden.
TOOL_ALIASES: Dict[str, str] = {
    "send_messages": "send_message",
    "set_reminders": "set_reminder",
    "batch_reminders": "set_reminder",
    "get_reminders": "list_reminders",
    "reminder:set_reminder": "set_reminder",
    "reminder:set_reminders": "set_reminder",
    "reminder:batch_reminders": "set_reminder",
    "reminder:get_reminders": "list_reminders",
    "reminder:list_reminders": "list_reminders",
    "reminder:edit_reminder": "edit_reminder",
    "reminder:cancel_reminder": "cancel_reminder",
}

TOOLS_BY_NAME: Dict[str, BaseTool] = {tool.name: tool for tool in all_tools}
for _alias, _canonical in TOOL_ALIASES.items():
    if _canonical in TOOLS_BY_NAME and _alias not in TOOLS_BY_NAME:
        TOOLS_BY_NAME[_alias] = TOOLS_BY_NAME[_canonical]


def resolve_canonical_tool_name(
    name: str,
    enabled_tool_names: Optional[Set[str]] = None,
) -> str:
    """Resolve an alias to its canonical tool name.

    If enabled_tool_names is provided, only resolves if the canonical tool
    is enabled in that set. If canonical tool is disabled or name is unknown,
    returns the original name unchanged.
    If enabled_tool_names is None, returns the mapped canonical name or original name.
    """
    canonical = TOOL_ALIASES.get(name, name)
    if enabled_tool_names is not None:
        if name in enabled_tool_names:
            return name
        if canonical in enabled_tool_names:
            return canonical
        return name
    return canonical


def get_all_tools() -> List[BaseTool]:
    """Return all registered tools in their canonical execution order."""
    return list(all_tools)


def get_tool_by_name(name: str) -> Optional[BaseTool]:
    """Lookup registered tool by exact name."""
    return TOOLS_BY_NAME.get(name)


def get_all_tool_names() -> List[str]:
    """Return list of canonical tool names."""
    return [t.name for t in all_tools]
