import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import FunctionTool, User
from schemas import (
    FunctionToolCreate,
    FunctionToolUpdate,
    FunctionToolResponse,
)

router = APIRouter(prefix="/api/tools", tags=["Function Tools"])


def sync_tools_from_file(db: Session):
    try:
        from config import engine
        from models import Base
        Base.metadata.create_all(bind=engine)
        from tools import all_tools
    except Exception:
        return

    valid_tool_names = {getattr(t, "name", str(t)) for t in all_tools}
    obsolete_tools = db.query(FunctionTool).filter(FunctionTool.name.in_([
        "get_available_collections", "search_knowledge_base",
        "create_ticket", "get_ticket_status", "list_tickets", "update_ticket_status"
    ])).all()
    for old_t in obsolete_tools:
        if old_t.name not in valid_tool_names:
            db.delete(old_t)


    for t in all_tools:
        name = getattr(t, "name", str(t))
        raw_desc = getattr(t, "description", "") or ""
        desc = raw_desc.split("\n\nArgs:")[0].strip() if raw_desc else ""

        args = getattr(t, "args", {})
        param_schema = {k: v.get("type", "string") for k, v in args.items()} if isinstance(args, dict) else {}
        params_json = json.dumps(param_schema)

        existing = db.query(FunctionTool).filter(FunctionTool.name == name).first()
        if not existing:
            ft = FunctionTool(
                id=uuid.uuid4(),
                name=name,
                description=desc,
                is_enabled=name != "execute_shell",
                parameters_json=params_json,
            )
            db.add(ft)
        else:
            existing.description = desc
            existing.parameters_json = params_json
    try:
        db.commit()
    except Exception:
        db.rollback()


@router.get("", response_model=List[FunctionToolResponse])
def list_tools(
    search: Optional[str] = Query(None, description="Search query for tool name or description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Auto-sync tools dynamically from tools.py
    sync_tools_from_file(db)

    query = db.query(FunctionTool)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (FunctionTool.name.ilike(term)) |
            (FunctionTool.description.ilike(term))
        )
    tools = query.order_by(FunctionTool.is_enabled.desc(), FunctionTool.created_at.asc()).all()
    return tools


@router.post("", response_model=FunctionToolResponse, status_code=status.HTTP_201_CREATED)
def create_tool(
    data: FunctionToolCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(FunctionTool).filter(FunctionTool.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Tool with name '{data.name}' already exists.")

    tool = FunctionTool(
        id=uuid.uuid4(),
        name=data.name.strip(),
        description=data.description,
        is_enabled=data.is_enabled,
        parameters_json=data.parameters_json,
        endpoint_url=data.endpoint_url,
        http_method=data.http_method or "POST",
    )
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


@router.get("/{tool_id}", response_model=FunctionToolResponse)
def get_tool(
    tool_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    tool = db.query(FunctionTool).filter(FunctionTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Function tool not found")
    return tool


@router.put("/{tool_id}", response_model=FunctionToolResponse)
def update_tool(
    tool_id: uuid.UUID,
    data: FunctionToolUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    tool = db.query(FunctionTool).filter(FunctionTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Function tool not found")

    if data.name is not None and data.name.strip() != tool.name:
        dup = db.query(FunctionTool).filter(FunctionTool.name == data.name.strip(), FunctionTool.id != tool_id).first()
        if dup:
            raise HTTPException(status_code=400, detail=f"Tool with name '{data.name}' already exists.")
        tool.name = data.name.strip()

    if data.description is not None:
        tool.description = data.description
    if data.is_enabled is not None:
        tool.is_enabled = data.is_enabled
    if data.parameters_json is not None:
        tool.parameters_json = data.parameters_json
    if data.endpoint_url is not None:
        tool.endpoint_url = data.endpoint_url
    if data.http_method is not None:
        tool.http_method = data.http_method

    db.commit()
    db.refresh(tool)
    return tool


@router.post("/{tool_id}/toggle", response_model=FunctionToolResponse)
def toggle_tool_status(
    tool_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    tool = db.query(FunctionTool).filter(FunctionTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Function tool not found")

    tool.is_enabled = not tool.is_enabled
    db.commit()
    db.refresh(tool)
    return tool


@router.delete("/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tool(
    tool_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    tool = db.query(FunctionTool).filter(FunctionTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Function tool not found")

    db.delete(tool)
    db.commit()
    return None
