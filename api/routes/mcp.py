import uuid
import json
import httpx
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import McpServer, User
from security import validate_safe_url

router = APIRouter(prefix="/api/mcp", tags=["MCP Servers"])


class McpServerCreate(BaseModel):
    name: str
    transport: str
    endpoint_url: Optional[str] = None
    env_json: Optional[str] = None
    tools: Optional[List[Any]] = None


class McpTestRequest(BaseModel):
    config: Any


@router.post("/test")
def test_mcp_connection(data: McpTestRequest, current_user: User = Depends(require_admin)):
    """Test MCP connection and discover tools server-side without CORS limitations."""
    config_raw = data.config
    if not config_raw:
        raise HTTPException(status_code=400, detail="Configuration JSON is required.")

    parsed = {}
    try:
        parsed = json.loads(config_raw) if isinstance(config_raw, str) else config_raw
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON syntax in configuration.")

    if not isinstance(parsed, dict):
        raise HTTPException(status_code=400, detail="Configuration must be a JSON object.")

    if parsed.get("url"):
        target_url = str(parsed["url"]).strip()
        if not target_url.startswith("http://") and not target_url.startswith("https://"):
            raise HTTPException(status_code=400, detail=f"'{target_url}' is not a valid http:// or https:// URL.")
        try:
            target_url = validate_safe_url(target_url)
        except ValueError as err:
            raise HTTPException(status_code=400, detail="MCP URL targets a private or invalid network.") from err

        custom_headers = parsed.get("headers", {})
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        }
        if isinstance(custom_headers, dict):
            headers.update(custom_headers)

        discovered_tools = []
        is_mcp = False

        def parse_mcp_text(text: str):
            nonlocal is_mcp
            found_tools = []
            try:
                d = json.loads(text)
                if isinstance(d, dict) and (d.get("jsonrpc") == "2.0" or "result" in d or "tools" in d):
                    is_mcp = True
                    raw_t = d.get("result", {}).get("tools") or d.get("tools")
                    if isinstance(raw_t, list):
                        for item in raw_t:
                            if isinstance(item, dict) and item.get("name"):
                                t_entry = {
                                    "name": item["name"],
                                    "description": item.get("description", ""),
                                }
                                if "inputSchema" in item:
                                    t_entry["inputSchema"] = item["inputSchema"]
                                elif "parameters" in item:
                                    t_entry["inputSchema"] = item["parameters"]
                                found_tools.append(t_entry)
                            elif isinstance(item, str):
                                found_tools.append({"name": item, "description": ""})
            except Exception:
                pass

            if not is_mcp or not found_tools:
                for line in text.split("\n"):
                    line = line.strip()
                    if line.startswith("data:"):
                        try:
                            d = json.loads(line[5:].strip())
                            if isinstance(d, dict) and (d.get("jsonrpc") == "2.0" or "result" in d or "tools" in d):
                                is_mcp = True
                                raw_t = d.get("result", {}).get("tools") or d.get("tools")
                                if isinstance(raw_t, list):
                                    for item in raw_t:
                                        if isinstance(item, dict) and item.get("name"):
                                            t_entry = {
                                                "name": item["name"],
                                                "description": item.get("description", ""),
                                            }
                                            if "inputSchema" in item:
                                                t_entry["inputSchema"] = item["inputSchema"]
                                            elif "parameters" in item:
                                                t_entry["inputSchema"] = item["parameters"]
                                            found_tools.append(t_entry)
                                        elif isinstance(item, str):
                                            found_tools.append({"name": item, "description": ""})
                        except Exception:
                            pass
            return found_tools

        try:
            with httpx.Client(timeout=8.0) as client:
                # Step 1: Send initialize
                init_res = client.post(target_url, json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "clientInfo": {"name": "chatbot-web", "version": "1.0.0"}
                    }
                }, headers=headers)

                if init_res.is_success or init_res.status_code in (400, 401, 403, 404, 405):
                    is_mcp = True
                    discovered_tools.extend(parse_mcp_text(init_res.text))

                # Step 2: Send tools/list
                tools_res = client.post(target_url, json={
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "tools/list",
                    "params": {}
                }, headers=headers)

                if tools_res.is_success or tools_res.status_code in (400, 401, 403, 404, 405):
                    is_mcp = True
                    more_tools = parse_mcp_text(tools_res.text)
                    for mt in more_tools:
                        if not any(t["name"] == mt["name"] for t in discovered_tools):
                            discovered_tools.append(mt)

        except Exception as err:
            raise HTTPException(status_code=502, detail=f"Unable to reach '{target_url}': {str(err)}")

        if is_mcp:
            tool_names = [t["name"] for t in discovered_tools]
            tools_text = f" (tools: {', '.join(tool_names)})" if tool_names else ""
            return {
                "success": True,
                "message": f"MCP server is available!{tools_text}",
                "tools": discovered_tools
            }

        raise HTTPException(status_code=400, detail=f"Target URL '{target_url}' is not a valid MCP server.")

    if parsed.get("command"):
        cmd_str = str(parsed["command"])
        return {
            "success": True,
            "message": f"MCP server is available! (Stdio: '{cmd_str}')",
            "tools": []
        }

    raise HTTPException(status_code=400, detail="Configuration JSON must contain a valid 'url' or 'command'.")


@router.get("/servers")
def get_mcp_servers(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    servers = db.query(McpServer).order_by(McpServer.created_at.asc()).all()
    return servers


@router.post("/servers")
def create_mcp_server(data: McpServerCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Server Name is required.")

    if not data.env_json or not data.env_json.strip():
        raise HTTPException(status_code=400, detail="Configuration JSON is required.")

    try:
        parsed = json.loads(data.env_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON syntax in Server Configuration.")

    if not isinstance(parsed, dict):
        raise HTTPException(status_code=400, detail="Configuration must be a valid JSON object.")

    target_url = None
    if parsed.get("url"):
        target_url = str(parsed["url"]).strip()
        if target_url.lower() == "mcp_server_url" or (not target_url.startswith("http://") and not target_url.startswith("https://")):
            raise HTTPException(status_code=400, detail="Please provide a valid http:// or https:// URL. Placeholder 'mcp_server_url' is invalid.")
        try:
            target_url = validate_safe_url(target_url)
        except ValueError as err:
            raise HTTPException(status_code=400, detail="MCP URL targets a private or invalid network.") from err
    elif parsed.get("command"):
        if not str(parsed["command"]).strip():
            raise HTTPException(status_code=400, detail="'command' cannot be empty.")
    else:
        raise HTTPException(status_code=400, detail="Configuration JSON must contain a valid 'url' or 'command'.")

    endpoint = target_url or (f"{parsed.get('command')} {' '.join(parsed.get('args', []))}".strip() if parsed.get("command") else "mcp_server_url")

    discovered_tools = data.tools or []
    if not discovered_tools and data.env_json:
        try:
            test_res = test_mcp_connection(McpTestRequest(config=data.env_json))
            if isinstance(test_res, dict) and test_res.get("tools"):
                discovered_tools = test_res["tools"]
        except Exception:
            pass

    server = McpServer(
        id=uuid.uuid4(),
        name=data.name.strip(),
        transport=data.transport or "Streamable HTTP",
        endpoint_url=endpoint,
        is_enabled=True,
        env_json=data.env_json,
        tools=discovered_tools
    )
    db.add(server)
    db.commit()
    db.refresh(server)
    return server


@router.delete("/servers/{server_id}")
def delete_mcp_server(server_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    srv = db.query(McpServer).filter(McpServer.id == server_id).first()
    if not srv:
        raise HTTPException(status_code=404, detail="MCP Server not found.")
    db.delete(srv)
    db.commit()
    return {"message": "MCP server deleted successfully"}


@router.patch("/servers/{server_id}/toggle")
def toggle_mcp_server(server_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    srv = db.query(McpServer).filter(McpServer.id == server_id).first()
    if not srv:
        raise HTTPException(status_code=404, detail="MCP Server not found.")
    srv.is_enabled = not srv.is_enabled
    db.commit()
    return srv
