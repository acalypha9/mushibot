"""Chat module facade.

Provides backward-compatible public exports for chat execution,
model resolution, title generation, and serialization helpers.
"""

from chat_context import (
    DEFAULT_PERSONA,
    SYSTEM_PROMPT,
    SYSTEM_RULES,
    WHATSAPP_FORMAT_RULES,
    _tool_map,
    current_chat_recipient_var,
    current_chat_channel_id_var,
    get_current_time_str,
    get_enabled_tools,
)
from chat_messages import (
    _log_raw_request,
    _log_raw_response,
    build_effective_system_prompt,
    message_to_full_raw_dict,
    message_to_raw_dict,
    prepare_chat_messages,
)
from chat_models import (
    extract_provider_message,
    get_active_chat_llm,
    normalize_model_name,
)
from chat_runner import (
    extract_usage_metadata,
    handle_invoke_error,
    run_chat,
)
from chat_title import generate_conversation_title
from chat_tools import (
    execute_tool_call,
    format_tool_results_summary,
    synthesize_kb_fallback,
)

__all__ = [
    "DEFAULT_PERSONA",
    "SYSTEM_RULES",
    "WHATSAPP_FORMAT_RULES",
    "SYSTEM_PROMPT",
    "get_current_time_str",
    "_tool_map",
    "current_chat_recipient_var",
    "current_chat_channel_id_var",
    "get_enabled_tools",
    "normalize_model_name",
    "get_active_chat_llm",
    "extract_provider_message",
    "message_to_raw_dict",
    "message_to_full_raw_dict",
    "_log_raw_request",
    "_log_raw_response",
    "build_effective_system_prompt",
    "prepare_chat_messages",
    "extract_usage_metadata",
    "handle_invoke_error",
    "execute_tool_call",
    "synthesize_kb_fallback",
    "format_tool_results_summary",
    "run_chat",
    "generate_conversation_title",
]
