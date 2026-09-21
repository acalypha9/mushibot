import asyncio
import sys
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

from chat_context import current_chat_recipient_var, get_enabled_tools
from chat_messages import (
    _log_raw_request,
    _log_raw_response,
    build_effective_system_prompt,
    prepare_chat_messages,
)
from chat_models import extract_provider_message, get_active_chat_llm, normalize_model_name
from chat_tools import execute_tool_call, format_tool_results_summary, synthesize_kb_fallback
from guardrails import sanitize_emojis, validate_input_guardrail, validate_output_guardrail
from langchain_openai import ChatOpenAI
from sqlalchemy.orm import Session


async def handle_invoke_error(
    err: Exception,
    turn: int,
    max_turns: int,
    messages: list,
    enabled_tools: list,
    active_llm: Any,
    current_model: str,
    override_timeout: Optional[float],
) -> Tuple[Optional[Any], Optional[Dict[str, str]]]:
    err_msg = str(err)
    timeout_sec = int(override_timeout) if (override_timeout and float(override_timeout) > 30) else int(getattr(active_llm, "request_timeout", 120) or 120)
    if timeout_sec <= 30:
        timeout_sec = 120

    is_timeout = (
        isinstance(err, (asyncio.TimeoutError, TimeoutError))
        or "timeout" in err_msg.lower()
        or "timed out" in err_msg.lower()
        or "deadline" in err_msg.lower()
    )
    if is_timeout:
        print(f"[LLM INVOKE ERROR] Request timed out after {timeout_sec} seconds.", file=sys.stderr, flush=True)
        clean_err = f"[LLM INVOKE ERROR] Request timed out after {timeout_sec} seconds. The AI model took longer than the configured response timeout of {timeout_sec}s to reply."
        return None, {"error": clean_err}

    print(f"[LLM INVOKE ERROR] {err_msg}", file=sys.stderr, flush=True)

    if "temperature" in err_msg.lower() and ("must be" in err_msg.lower() or "invalid_request_error" in err_msg.lower()):
        print("[LLM RETRY] Retrying invocation with temperature=1.0 due to model restriction...", file=sys.stderr, flush=True)
        try:
            retry_llm = ChatOpenAI(
                model=getattr(active_llm, "model_name", getattr(active_llm, "model", current_model)),
                openai_api_key=active_llm.openai_api_key,
                openai_api_base=active_llm.openai_api_base,
                temperature=1.0,
                streaming=False,
                request_timeout=active_llm.request_timeout,
            )
            if turn >= max_turns:
                full_message = await retry_llm.ainvoke(messages)
            else:
                if enabled_tools:
                    retry_with_tools = retry_llm.bind_tools(enabled_tools)
                    full_message = await retry_with_tools.ainvoke(messages)
                else:
                    full_message = await retry_llm.ainvoke(messages)
            return full_message, None
        except Exception as retry_err:
            retry_msg = str(retry_err)
            is_retry_timeout = (
                isinstance(retry_err, (asyncio.TimeoutError, TimeoutError))
                or "timeout" in retry_msg.lower()
                or "timed out" in retry_msg.lower()
            )
            if is_retry_timeout:
                clean_err = f"[LLM INVOKE ERROR] Request timed out after {timeout_sec} seconds."
            else:
                clean_err = f"Model provider connection error: {retry_msg}"
            print(f"[LLM RETRY ERROR] {retry_msg}", file=sys.stderr, flush=True)
            return None, {"error": clean_err}

    detail = extract_provider_message(err_msg)
    if "401" in err_msg or "Unauthorized" in err_msg or "Authentication" in err_msg or "auth" in err_msg.lower():
        clean_err = f"Model provider authentication failed (401 Unauthorized): {detail}" if detail else "Model provider authentication failed (401 Unauthorized). Please check your API key in Dashboard > Providers."
    elif "404" in err_msg or "not found" in err_msg.lower():
        clean_err = f"Model provider endpoint or model not found (404 Not Found): {detail}" if detail else "Model provider endpoint or model not found. Please check your provider settings in Dashboard > Providers."
    elif "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg.lower():
        clean_err = f"The AI model provider is currently experiencing high demand (503 Service Unavailable): {detail}" if detail else "The AI model provider is currently experiencing high demand (503 Service Unavailable). Please try again in a few moments."
    elif "429" in err_msg or "rate limit" in err_msg.lower() or "quota" in err_msg.lower():
        clean_err = f"Model provider rate limit reached (429 Too Many Requests): {detail}" if detail else "Model provider rate limit reached (429 Too Many Requests). Please wait a moment before trying again."
    else:
        clean_err = f"Model provider connection error: {detail}" if detail else f"Model provider connection error: {err_msg}"

    return None, {"error": clean_err}


def extract_usage_metadata(
    full_message: Any,
    current_model: str,
    requested_model: Optional[str],
    db: Session,
) -> dict:
    resolved_model_name = normalize_model_name(current_model or requested_model, db)
    usage_metadata = {
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "reasoning_tokens": 0,
        "model_name": resolved_model_name,
    }
    if hasattr(full_message, "usage_metadata") and full_message.usage_metadata:
        um = full_message.usage_metadata
        if isinstance(um, dict):
            usage_metadata["input_tokens"] = um.get("input_tokens", 0) or 0
            usage_metadata["output_tokens"] = um.get("output_tokens", 0) or 0
            usage_metadata["total_tokens"] = um.get("total_tokens", 0) or 0
            out_details = um.get("output_token_details")
            if isinstance(out_details, dict):
                usage_metadata["reasoning_tokens"] = out_details.get("reasoning", 0) or 0

    if hasattr(full_message, "response_metadata") and full_message.response_metadata:
        rm = full_message.response_metadata
        if isinstance(rm, dict) and "token_usage" in rm:
            tu = rm["token_usage"]
            if isinstance(tu, dict):
                if not usage_metadata["input_tokens"]:
                    usage_metadata["input_tokens"] = tu.get("prompt_tokens", 0) or 0
                if not usage_metadata["output_tokens"]:
                    usage_metadata["output_tokens"] = tu.get("completion_tokens", 0) or 0
                if not usage_metadata["total_tokens"]:
                    usage_metadata["total_tokens"] = tu.get("total_tokens", 0) or 0
                comp_details = tu.get("completion_tokens_details")
                if isinstance(comp_details, dict) and not usage_metadata["reasoning_tokens"]:
                    usage_metadata["reasoning_tokens"] = comp_details.get("reasoning_tokens", 0) or 0
        if isinstance(rm, dict) and rm.get("model_name"):
            raw_m = str(rm.get("model_name")).strip()
            if raw_m and raw_m.lower() not in ["default", "gemini-default"]:
                usage_metadata["model_name"] = normalize_model_name(raw_m, db)

    return usage_metadata


def _resolve_active_llm(db: Session, requested_model: Optional[str], override_timeout: Optional[float]):
    chat_mod = sys.modules.get("chat")
    if chat_mod and hasattr(chat_mod, "get_active_chat_llm") and chat_mod.get_active_chat_llm is not get_active_chat_llm:
        return chat_mod.get_active_chat_llm(db, requested_model=requested_model, override_timeout=override_timeout)
    return get_active_chat_llm(db, requested_model=requested_model, override_timeout=override_timeout)


def _resolve_enabled_tools(db: Session) -> list:
    chat_mod = sys.modules.get("chat")
    if chat_mod and hasattr(chat_mod, "get_enabled_tools") and chat_mod.get_enabled_tools is not get_enabled_tools:
        return chat_mod.get_enabled_tools(db)
    return get_enabled_tools(db)


async def run_chat(
    history: list,
    db: Session,
    max_history_messages: int = 10,
    requested_model: Optional[str] = None,
    override_timeout: Optional[float] = None,
    system_prompt: Optional[str] = None,
    channel: Optional[str] = "WEB",
    current_recipient: Optional[str] = None,
) -> AsyncGenerator[dict, None]:
    current_chat_recipient_var.set(current_recipient)
    enabled_tools = _resolve_enabled_tools(db)
    enabled_tool_names = {t.name for t in enabled_tools}

    try:
        active_llm = _resolve_active_llm(db, requested_model=requested_model, override_timeout=override_timeout)
        llm_with_tools = active_llm.bind_tools(enabled_tools) if enabled_tools else active_llm
    except ValueError as err:
        print(f"[CHAT PROVIDER ERROR] {err}", file=sys.stderr, flush=True)
        if channel and str(channel).upper() != "WEB":
            yield {"turn_done": True, "turn": 1, "content": "Maaf, saat ini layanan sedang tidak dapat digunakan."}
        else:
            yield {"turn_done": True, "turn": 1, "content": f"⚠️ Cannot chat: {str(err)}"}
        yield {"done": True}
        return

    if history:
        last_sender, last_content = history[-1]
        if last_sender == "CUSTOMER":
            is_valid, refusal_msg = validate_input_guardrail(last_content)
            if not is_valid:
                print(f"[GUARDRAIL BLOCKED] Out of scope input detected: '{last_content}'", file=sys.stderr, flush=True)
                yield {"turn_done": True, "turn": 1, "content": refusal_msg}
                yield {"done": True}
                return

    effective_system_prompt = await build_effective_system_prompt(system_prompt, channel, current_recipient, enabled_tools)
    messages = prepare_chat_messages(history, max_history_messages, effective_system_prompt)

    turn = 1
    max_turns = 8
    current_model = getattr(active_llm, "model_name", getattr(active_llm, "model", ""))
    last_tool_results: List[Dict[str, Any]] = []
    any_content_yielded = False

    while True:
        _log_raw_request(turn, messages, model_name=current_model, tools=enabled_tools if turn < max_turns else None)

        try:
            full_message = await active_llm.ainvoke(messages) if turn >= max_turns else await llm_with_tools.ainvoke(messages)
        except Exception as err:
            retry_msg, err_dict = await handle_invoke_error(
                err, turn, max_turns, messages, enabled_tools, active_llm, current_model, override_timeout
            )
            if err_dict:
                yield err_dict
                return
            full_message = retry_msg

        _log_raw_response(turn, full_message, model_name=current_model)
        if not full_message:
            yield {"done": True}
            break

        usage_metadata = extract_usage_metadata(full_message, current_model, requested_model, db)
        turn_text = str(full_message.content).strip() if full_message.content else ""
        has_more = bool(full_message.tool_calls)

        if not turn_text and not has_more and last_tool_results:
            turn_text, full_message = await synthesize_kb_fallback(
                last_tool_results, messages, effective_system_prompt, active_llm, current_model, turn
            )

        if full_message and full_message.tool_calls:
            messages.append(full_message)
            for tc in full_message.tool_calls:
                await execute_tool_call(tc, enabled_tool_names, enabled_tools, messages, last_tool_results)

        if turn_text:
            sanitized = sanitize_emojis(validate_output_guardrail(turn_text))
            yield {"turn_done": True, "turn": turn, "content": sanitized, "has_more": has_more, "usage_metadata": usage_metadata}
            any_content_yielded = True

        if has_more:
            turn += 1
            continue

        if not any_content_yielded and last_tool_results:
            fallback = format_tool_results_summary(last_tool_results)
            if fallback:
                yield {"turn_done": True, "turn": turn, "content": fallback, "has_more": False}
                any_content_yielded = True

        yield {"done": True}
        break
