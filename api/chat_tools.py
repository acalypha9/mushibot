import asyncio
import json
import sys
from typing import Any, Dict, List, Optional, Set, Tuple

from chat_context import _tool_map
from chat_messages import _log_raw_response
from guardrails import sanitize_emojis, validate_output_guardrail
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage


async def execute_tool_call(
    tc: dict,
    enabled_tool_names: Set[str],
    enabled_tools: list,
    messages: List[BaseMessage],
    last_tool_results: List[Dict[str, Any]],
) -> None:
    tool_name = tc.get("name", "")
    if tool_name == "send_messages" and "send_messages" not in enabled_tool_names and "send_message" in enabled_tool_names:
        tc["name"] = "send_message"

    if tc["name"] not in enabled_tool_names:
        print(f"\n<<< [TOOL BLOCKED] Function: {tc['name']} is disabled in database.", file=sys.stderr, flush=True)
        messages.append(
            ToolMessage(
                content=f"Error: Function tool '{tc['name']}' is currently disabled.",
                tool_call_id=tc["id"],
                name=tc["name"],
            )
        )
        return

    tool_fn = _tool_map.get(tc["name"])
    if not tool_fn:
        tool_fn = next((t for t in enabled_tools if t.name == tc["name"]), None)

    tool_args = tc.get("args") or {}
    if isinstance(tool_args, str):
        try:
            tool_args = json.loads(tool_args)
        except Exception:
            tool_args = {}

    if tc["name"] == "knowledge_base":
        if not tool_args.get("query"):
            latest_user_msg = next((m.content for m in reversed(messages) if isinstance(m, HumanMessage) and isinstance(m.content, str)), "")
            if latest_user_msg:
                tool_args["query"] = latest_user_msg
        if not tool_args.get("collection_name"):
            from knowledge import get_collections_info

            col_info = get_collections_info()
            if col_info:
                try:
                    col_list = json.loads(col_info)
                    if isinstance(col_list, list) and len(col_list) > 0:
                        tool_args["collection_name"] = col_list[0].get("collection_name") or col_list[0].get("name", "User Manual")
                except Exception:
                    pass

    print(f"\n>>> [TOOL EXECUTION] Function: {tc['name']} | Args: {tool_args}", file=sys.stderr, flush=True)
    if tool_fn:
        try:
            result = await asyncio.to_thread(tool_fn.invoke, tool_args)
            print(f"<<< [TOOL RESULT] Function: {tc['name']} | Result: {str(result)}", file=sys.stderr, flush=True)
            result_str = str(result)
            messages.append(
                ToolMessage(
                    content=result_str,
                    tool_call_id=tc["id"],
                    name=tc["name"],
                )
            )
            last_tool_results.append({"name": tc["name"], "args": tool_args, "result": result_str})
        except Exception as tool_err:
            print(f"<<< [TOOL ERROR] Function: {tc['name']} | Error: {tool_err}", file=sys.stderr, flush=True)
            messages.append(
                ToolMessage(
                    content=f"Error running tool: {tool_err}",
                    tool_call_id=tc["id"],
                    name=tc["name"],
                )
            )


async def synthesize_kb_fallback(
    last_tool_results: List[Dict[str, Any]],
    messages: List[BaseMessage],
    effective_system_prompt: str,
    active_llm: Any,
    current_model: str,
    turn: int,
) -> Tuple[str, Any]:
    print("[LLM WARN] LLM returned empty content after tool call completion. Attempting synthesis fallback...", file=sys.stderr, flush=True)
    kb_chunks: List[str] = []
    for tr in last_tool_results:
        raw_res = tr.get("result", "")
        try:
            parsed = json.loads(raw_res)
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict) and item.get("content"):
                        kb_chunks.append(str(item["content"]))
            elif isinstance(parsed, dict):
                if parsed.get("content"):
                    kb_chunks.append(str(parsed["content"]))
                elif parsed.get("stdout"):
                    kb_chunks.append(str(parsed["stdout"]))
        except Exception:
            if raw_res and len(raw_res) > 15:
                kb_chunks.append(raw_res)

    latest_user_query = next((m.content for m in reversed(messages) if isinstance(m, HumanMessage) and isinstance(m.content, str)), "")

    if kb_chunks and latest_user_query:
        combined_kb = "\n\n---\n\n".join(kb_chunks[:6])
        synth_messages = [
            SystemMessage(content=effective_system_prompt),
            HumanMessage(content=f"Context:\n{combined_kb}\n\nUser Query: {latest_user_query}"),
        ]
        try:
            synth_resp = await active_llm.ainvoke(synth_messages)
            if synth_resp and synth_resp.content:
                turn_text = str(synth_resp.content).strip()
                _log_raw_response(turn, synth_resp, model_name=current_model)
                return turn_text, synth_resp
        except Exception as synth_err:
            print(f"[SYNTHESIS FALLBACK ERROR] {synth_err}", file=sys.stderr, flush=True)

    return "", None


def format_tool_results_summary(last_tool_results: List[Dict[str, Any]]) -> Optional[str]:
    summary_parts: List[str] = []
    for tr in last_tool_results:
        raw_res = tr.get("result", "")
        try:
            parsed = json.loads(raw_res)
            if isinstance(parsed, dict):
                if parsed.get("status") == "success":
                    file_name = parsed.get("file_name", "")
                    if file_name:
                        summary_parts.append(f"File `{file_name}` created successfully.")
                    else:
                        stdout = parsed.get("stdout", "")
                        summary_parts.append(f"Command executed successfully." + (f"\n{stdout}" if stdout else ""))
                elif parsed.get("status") == "error":
                    summary_parts.append(f"Error: {parsed.get('error', parsed.get('stderr', 'Unknown error'))}")
                elif parsed.get("content"):
                    summary_parts.append(str(parsed["content"]))
            elif isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict) and item.get("content"):
                        summary_parts.append(str(item["content"]))
        except (json.JSONDecodeError, TypeError):
            if raw_res and len(raw_res) > 5:
                summary_parts.append(raw_res)

    if summary_parts:
        fallback_content = "\n\n".join(summary_parts)
        return sanitize_emojis(validate_output_guardrail(fallback_content))
    return None
