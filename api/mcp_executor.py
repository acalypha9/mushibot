import os
import sys
import json
import re
import httpx
from typing import List, Dict, Any, Optional
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field, create_model
from security import is_safe_url, validate_safe_url

def adapt_and_validate_mcp_arguments(tool_name: str, tool_info: Dict[str, Any], raw_args: Dict[str, Any]) -> Dict[str, Any]:
    clean_arguments = dict(raw_args or {})

    # 1. Unwrap nested 'kwargs' dict if present
    if "kwargs" in clean_arguments and isinstance(clean_arguments["kwargs"], dict):
        unwrapped = clean_arguments.pop("kwargs")
        for k, v in unwrapped.items():
            if k not in clean_arguments:
                clean_arguments[k] = v

    input_schema = tool_info.get("inputSchema") or tool_info.get("parameters") if isinstance(tool_info, dict) else None
    properties = input_schema.get("properties", {}) if (input_schema and isinstance(input_schema, dict)) else {}

    # 2. Iterate through expected properties defined by MCP tool schema
    for param_name, param_info in properties.items():
        if not isinstance(param_info, dict):
            continue

        expected_type = param_info.get("type", "").lower()

        # CASE 1: Parameter expected to be an ARRAY
        if expected_type == "array" or param_name in ["urls", "links", "items", "queries"]:
            # If current param is missing or empty
            if param_name not in clean_arguments or not clean_arguments[param_name]:
                # Check singular form
                singular_key = param_name[:-1] if param_name.endswith("s") else None
                if singular_key and clean_arguments.get(singular_key):
                    val = clean_arguments.get(singular_key)
                    clean_arguments[param_name] = [val] if isinstance(val, str) else list(val)
                else:
                    # Check fallback keys like 'url', 'link', 'target_url', 'uri'
                    for fallback in ["url", "link", "target_url", "uri", "address", "query"]:
                        if clean_arguments.get(fallback):
                            val = clean_arguments[fallback]
                            clean_arguments[param_name] = [val] if isinstance(val, str) else list(val)
                            break
            # If current param exists but is a single string (not a list)
            elif isinstance(clean_arguments[param_name], str):
                clean_arguments[param_name] = [clean_arguments[param_name]]

        # CASE 2: Parameter expected to be a SCALAR / STRING
        elif expected_type == "string" or param_name in ["query", "url", "search_term"]:
            # If missing, check fallbacks
            if param_name not in clean_arguments or not clean_arguments[param_name]:
                plural_key = f"{param_name}s"
                if clean_arguments.get(plural_key):
                    val = clean_arguments[plural_key]
                    clean_arguments[param_name] = val[0] if isinstance(val, list) and len(val) > 0 else str(val)
                else:
                    for fallback in ["reason", "q", "search", "search_term", "input", "topic", "keyword", "prompt", "urls", "link"]:
                        val = clean_arguments.get(fallback)
                        if val:
                            clean_arguments[param_name] = val[0] if isinstance(val, list) and len(val) > 0 else str(val)
                            break
            # If current param is a list instead of string
            elif isinstance(clean_arguments[param_name], list) and len(clean_arguments[param_name]) > 0:
                clean_arguments[param_name] = str(clean_arguments[param_name][0])

    # 3. Specific tool fallbacks for tools without formal inputSchema properties
    name_lower = tool_name.lower()
    if ("fetch" in name_lower or "get" in name_lower) and "urls" not in clean_arguments and "url" in clean_arguments:
        val = clean_arguments["url"]
        clean_arguments["urls"] = [val] if isinstance(val, str) else list(val)
    elif ("search" in name_lower or "query" in name_lower) and "query" not in clean_arguments:
        for fallback in ["reason", "q", "search", "search_term", "input", "topic", "keyword", "prompt"]:
            val = clean_arguments.get(fallback)
            if val:
                clean_arguments["query"] = str(val)
                break

    return clean_arguments


def execute_mcp_tool_sync(
    endpoint_url: str,
    env_json: str,
    tool_name: str,
    arguments: Dict[str, Any],
    tool_info: Optional[Dict[str, Any]] = None,
    allow_private: Optional[bool] = None,
) -> str:
    """Send JSON-RPC tools/call request to an HTTP / Streamable HTTP MCP server."""
    if not endpoint_url or not str(endpoint_url).strip():
        return "Error: MCP server URL is required."

    if allow_private is None:
        allow_private = os.getenv("ALLOW_INTERNAL_MCP_URLS", "false").lower() in ("true", "1", "yes")

    try:
        validated_url = validate_safe_url(endpoint_url, allow_private=allow_private)
    except ValueError as val_err:
        return f"Error: Blocked unsafe MCP server URL '{endpoint_url}': {str(val_err)}"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
    }

    try:
        if env_json:
            parsed_env = json.loads(env_json)
            if isinstance(parsed_env, dict) and "headers" in parsed_env and isinstance(parsed_env["headers"], dict):
                headers.update(parsed_env["headers"])
    except Exception:
        pass

    clean_arguments = adapt_and_validate_mcp_arguments(tool_name, tool_info or {}, arguments)

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": clean_arguments
        }
    }

    try:
        with httpx.Client(timeout=35.0) as client:
            res = client.post(validated_url, json=payload, headers=headers)

        if not res.is_success:
            return f"MCP server error (HTTP {res.status_code}): {res.text}"

        text = res.text
        # Parse JSON-RPC response or SSE response
        try:
            data = res.json()
            if "result" in data:
                res_content = data["result"].get("content")
                if isinstance(res_content, list):
                    texts = []
                    for item in res_content:
                        if isinstance(item, dict):
                            texts.append(item.get("text", str(item)))
                        else:
                            texts.append(str(item))
                    return "\n".join(texts)
                return json.dumps(data["result"], ensure_ascii=False)
            if "error" in data:
                return f"MCP error {data['error'].get('code', '')}: {data['error'].get('message', str(data['error']))}"
        except Exception:
            pass

        # Try parsing SSE lines
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("data:"):
                try:
                    data = json.loads(line[5:].strip())
                    if "result" in data:
                        res_content = data["result"].get("content")
                        if isinstance(res_content, list):
                            texts = [item.get("text", str(item)) if isinstance(item, dict) else str(item) for item in res_content]
                            return "\n".join(texts)
                        return json.dumps(data["result"], ensure_ascii=False)
                    if "error" in data:
                        return f"MCP error {data['error'].get('code', '')}: {data['error'].get('message', str(data['error']))}"
                except Exception:
                    pass

        return text or "Tool executed successfully (empty response)."

    except Exception as err:
        return f"Failed to execute MCP tool '{tool_name}': {str(err)}"


def sanitize_general_description(desc: str) -> str:
    """Make descriptions general, removing examples, query tips"""
    if not desc:
        return ""
    cleaned = re.split(r'\b(?:Query tips|Tips|Example|Examples)\s*:', desc, flags=re.IGNORECASE)[0].strip()
    cleaned = re.sub(r'\s*\((?:e\.g\.|eg\.|example)[^)]*\)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b(?:e\.g\.|eg\.)\s+[^.,;\n]+', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def build_args_schema_for_tool(tool_name: str, tool_info: Dict[str, Any]):
    input_schema = tool_info.get("inputSchema") or tool_info.get("parameters") if isinstance(tool_info, dict) else None

    if input_schema and isinstance(input_schema, dict) and input_schema.get("properties"):
        fields = {}
        properties = input_schema.get("properties", {})
        required_fields = set(input_schema.get("required", []))

        for field_name, field_info in properties.items():
            if not isinstance(field_info, dict):
                continue
            f_type_str = field_info.get("type", "string")
            f_desc = sanitize_general_description(field_info.get("description", ""))

            if f_type_str == "array":
                py_type = List[str]
            elif f_type_str == "integer":
                py_type = int
            elif f_type_str == "number":
                py_type = float
            elif f_type_str == "boolean":
                py_type = bool
            elif f_type_str == "object":
                py_type = dict
            else:
                py_type = str

            if field_name in required_fields:
                fields[field_name] = (py_type, Field(..., description=f_desc))
            else:
                default_val = field_info.get("default", None)
                fields[field_name] = (Optional[py_type], Field(default_val, description=f_desc))

        if fields:
            try:
                return create_model(f"{tool_name}Schema", **fields)
            except Exception as err:
                print(f"[SCHEMA BUILD WARN] {tool_name}: {err}", file=sys.stderr, flush=True)

    # Known fallback schemas for tools when inputSchema is omitted
    name_lower = tool_name.lower()
    if "fetch" in name_lower or "read" in name_lower:
        class FallbackFetchSchema(BaseModel):
            urls: List[str] = Field(..., description="List of target URLs to fetch content from")
        return FallbackFetchSchema

    if "search" in name_lower or "query" in name_lower or "find" in name_lower:
        class FallbackSearchSchema(BaseModel):
            query: str = Field(..., description="Search query string to find information")
        return FallbackSearchSchema

    class FallbackGenericSchema(BaseModel):
        query: Optional[str] = Field(None, description="Search query string")
        url: Optional[str] = Field(None, description="Target URL string")
        urls: Optional[List[str]] = Field(None, description="List of target URLs")

    return FallbackGenericSchema


def create_langchain_mcp_tool(server_name: str, endpoint_url: str, env_json: str, tool_info: Dict[str, Any]) -> Optional[StructuredTool]:
    tool_name = tool_info.get("name") if isinstance(tool_info, dict) else str(tool_info)
    if not tool_name:
        return None

    raw_desc = tool_info.get("description") if isinstance(tool_info, dict) else f"MCP tool '{tool_name}' provided by {server_name} server."
    description = sanitize_general_description(raw_desc or f"MCP tool '{tool_name}' provided by {server_name} server.")
    if not description:
        description = f"MCP tool '{tool_name}' provided by {server_name} server."

    def _run_tool(**kwargs) -> str:
        print(f"[MCP EXECUTION] Executing tool '{tool_name}' on configured MCP server", file=sys.stderr, flush=True)
        res = execute_mcp_tool_sync(endpoint_url, env_json, tool_name, kwargs, tool_info=tool_info if isinstance(tool_info, dict) else {})
        print(f"[MCP RESULT] {tool_name} response length: {len(res)} chars", file=sys.stderr, flush=True)
        return res

    try:
        args_schema = build_args_schema_for_tool(tool_name, tool_info if isinstance(tool_info, dict) else {})

        return StructuredTool.from_function(
            func=_run_tool,
            name=tool_name,
            description=description,
            args_schema=args_schema
        )
    except Exception as err:
        print(f"[MCP TOOL CREATE ERROR] {tool_name}: {err}", file=sys.stderr, flush=True)
        return None


def get_active_mcp_tools(db) -> List[StructuredTool]:
    """Query enabled MCP servers from database and return initialized LangChain tools."""
    try:
        from models import McpServer
        servers = db.query(McpServer).filter(McpServer.is_enabled == True).all()
        tools = []
        for srv in servers:
            if srv.tools and isinstance(srv.tools, list):
                for t_info in srv.tools:
                    if isinstance(t_info, dict):
                        t_obj = create_langchain_mcp_tool(srv.name, srv.endpoint_url or "", srv.env_json or "", t_info)
                        if t_obj:
                            tools.append(t_obj)
                    elif isinstance(t_info, str):
                        t_obj = create_langchain_mcp_tool(srv.name, srv.endpoint_url or "", srv.env_json or "", {"name": t_info})
                        if t_obj:
                            tools.append(t_obj)
        return tools
    except Exception as err:
        print(f"[GET MCP TOOLS ERROR] {err}", file=sys.stderr, flush=True)
        return []
