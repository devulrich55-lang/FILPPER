from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlmodel import Session

from app.db.models import EventLog, Operation, User


def create_operation(
    session: Session,
    user: User,
    *,
    op_type: str,
    payload: Dict[str, Any],
    status: str = "queued",
    scope_required: str = "",
    dry_run: bool = False,
) -> Operation:
    op = Operation(
        user_id=user.id,  # type: ignore[arg-type]
        op_type=op_type,
        scope_required=scope_required,
        status=status,
        payload=payload,
        result={"dryRun": dry_run},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(op)

    session.add(
        EventLog(
            user_id=user.id,  # type: ignore[arg-type]
            event_type="operation",
            message=f"Operation created: {op_type} ({status})",
            meta={"op_type": op_type, "dry_run": dry_run, "scope_required": scope_required},
        )
    )
    session.commit()
    session.refresh(op)
    return op


def require_authorized(user_scopes: list[str], required_scope: str) -> None:
    if "admin" in user_scopes:
        return
    if required_scope not in user_scopes:
        raise HTTPException(status_code=403, detail="Not authorized for this operation")

