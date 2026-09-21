import uuid
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import (
    User, KnowledgeCollection, KnowledgeDocument,
    CronReminder, ModelProvider, FunctionTool
)
from auth import require_admin

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    limit: int = 30,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Aggregate recent created and updated events across system entities."""
    notifications: List[Dict[str, Any]] = []

    # 1. Knowledge Documents (Created/Updated)
    try:
        # Join with collection to obtain collection name
        docs = (
            db.query(KnowledgeDocument, KnowledgeCollection.name)
            .outerjoin(KnowledgeCollection, KnowledgeDocument.collection_id == KnowledgeCollection.id)
            .order_by(func.coalesce(KnowledgeDocument.updated_at, KnowledgeDocument.created_at).desc())
            .limit(15)
            .all()
        )
        for doc, col_name in docs:
            is_update = bool(
                doc.updated_at and doc.created_at and 
                (doc.updated_at - doc.created_at).total_seconds() > 5
            )
            event_time = doc.updated_at or doc.created_at
            notifications.append({
                "id": f"doc-{doc.id}",
                "type": "DOCUMENT",
                "action": "UPDATED" if is_update else "CREATED",
                "title": f"Document '{doc.title}' " + ("updated" if is_update else "added"),
                "description": f"Collection: {col_name or 'Knowledge Base'} • {doc.chunk_count} chunks",
                "timestamp": event_time.isoformat() if event_time else None,
                "entity_id": str(doc.id),
                "parent_id": str(doc.collection_id),
                "target_href": f"/dashboard/knowledge?collection={doc.collection_id}&tab=documents",
            })
    except Exception as e:
        db.rollback()

    # 2. Knowledge Collections
    try:
        cols = db.query(KnowledgeCollection).limit(10).all()
        for col in cols:
            meta = col.cmetadata if isinstance(col.cmetadata, dict) else {}
            c_at = meta.get("created_at")
            u_at = meta.get("updated_at")
            is_update = bool(u_at and c_at and u_at != c_at)
            event_time = u_at or c_at or datetime.datetime.now(datetime.timezone.utc).isoformat()
            notifications.append({
                "id": f"col-{col.id}",
                "type": "COLLECTION",
                "action": "UPDATED" if is_update else "CREATED",
                "title": f"Collection '{col.name}' " + ("updated" if is_update else "created"),
                "description": f"Vector Collection • {meta.get('embedding_model') or 'Ready for embeddings'}",
                "timestamp": event_time,
                "entity_id": str(col.id),
                "parent_id": None,
                "target_href": f"/dashboard/knowledge?collection={col.id}",
            })
    except Exception as e:
        db.rollback()

    # 3. Cron Reminders
    try:
        reminders = (
            db.query(CronReminder)
            .order_by(func.coalesce(CronReminder.updated_at, CronReminder.created_at).desc())
            .limit(10)
            .all()
        )
        for rem in reminders:
            is_update = bool(
                rem.updated_at and rem.created_at and 
                (rem.updated_at - rem.created_at).total_seconds() > 5
            )
            event_time = rem.updated_at or rem.created_at
            notifications.append({
                "id": f"rem-{rem.id}",
                "type": "REMINDER",
                "action": "UPDATED" if is_update else "CREATED",
                "title": f"Reminder '{rem.title}' " + ("updated" if is_update else "scheduled"),
                "description": f"Channel: {rem.channel_type} • {rem.cron_expression}",
                "timestamp": event_time.isoformat() if event_time else None,
                "entity_id": str(rem.id),
                "parent_id": None,
                "target_href": "/dashboard/tools?tab=reminders",
            })
    except Exception as e:
        db.rollback()

    # 4. Users (Admin only)
    if current_user.role == "ADMIN":
        try:
            users = (
                db.query(User)
                .order_by(User.created_at.desc())
                .limit(5)
                .all()
            )
            for u in users:
                notifications.append({
                    "id": f"user-{u.id}",
                    "type": "USER",
                    "action": "CREATED",
                    "title": f"User '{u.full_name or u.email}' registered",
                    "description": f"Role: {u.role}",
                    "timestamp": u.created_at.isoformat() if u.created_at else None,
                    "entity_id": str(u.id),
                    "parent_id": None,
                    "target_href": "/dashboard/users",
                })
        except Exception as e:
            db.rollback()

    # 5. Model Providers
    try:
        providers = (
            db.query(ModelProvider)
            .order_by(func.coalesce(ModelProvider.updated_at, ModelProvider.created_at).desc())
            .limit(5)
            .all()
        )
        for p in providers:
            event_time = p.updated_at or p.created_at
            notifications.append({
                "id": f"prov-{p.id}",
                "type": "PROVIDER",
                "action": "UPDATED" if p.updated_at else "CREATED",
                "title": f"Provider '{p.name}' ({p.category})",
                "description": f"Model: {p.model_name}",
                "timestamp": event_time.isoformat() if event_time else None,
                "entity_id": str(p.id),
                "parent_id": None,
                "target_href": "/dashboard/providers",
            })
    except Exception as e:
        db.rollback()

    # Sort all notifications by timestamp descending
    def get_sort_key(n):
        ts = n.get("timestamp")
        return ts if ts else ""

    notifications.sort(key=get_sort_key, reverse=True)
    return {"items": notifications[:limit], "total": len(notifications)}


@router.get("/verify")
def verify_notification_entity(
    type: str = Query(..., description="Entity type: COLLECTION, DOCUMENT, REMINDER, USER, PROVIDER"),
    id: str = Query(..., description="UUID of entity to verify"),
    parent_id: Optional[str] = Query(None, description="Optional parent UUID"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Verify if the entity referenced by a notification still exists in the database."""
    try:
        entity_uuid = uuid.UUID(id)
    except ValueError:
        return {"exists": False, "message": "Invalid entity ID format"}

    exists = False
    name = None

    try:
        if type.upper() == "COLLECTION":
            col = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == entity_uuid).first()
            if col:
                exists = True
                name = col.name
        elif type.upper() == "DOCUMENT":
            doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == entity_uuid).first()
            if doc:
                # Also verify parent collection still exists
                col = db.query(KnowledgeCollection).filter(KnowledgeCollection.id == doc.collection_id).first()
                if col:
                    exists = True
                    name = doc.title
        elif type.upper() == "REMINDER":
            rem = db.query(CronReminder).filter(CronReminder.id == entity_uuid).first()
            if rem:
                exists = True
                name = rem.title
        elif type.upper() == "USER":
            user_obj = db.query(User).filter(User.id == entity_uuid).first()
            if user_obj:
                exists = True
                name = user_obj.full_name or user_obj.email
        elif type.upper() == "PROVIDER":
            prov = db.query(ModelProvider).filter(ModelProvider.id == entity_uuid).first()
            if prov:
                exists = True
                name = prov.name
    except Exception as err:
        db.rollback()
        return {"exists": False, "message": f"Database error verifying entity: {str(err)}"}

    return {
        "exists": exists,
        "name": name,
        "message": "Entity exists" if exists else "This item no longer exists or has been deleted."
    }
