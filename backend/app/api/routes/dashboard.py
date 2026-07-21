from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.deps import get_current_user_and_scopes
from app.db.models import Device, Operation
from app.db.session import get_session

router = APIRouter()


@router.get("/stats")
def stats(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _scopes = ctx
    now = datetime.now(timezone.utc)
    start_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    device_count = session.exec(
        select(func.count()).select_from(Device).where(Device.user_id == user.id)
    ).one()

    todays_ops = session.exec(
        select(Operation).where(
            Operation.user_id == user.id,
            Operation.created_at >= start_day,
        )
    ).all()
    detection_ops = [op for op in todays_ops if ".scan" in op.op_type or "detect" in op.op_type]
    done_ops = [op for op in todays_ops if op.status == "done"]

    rate = 0.0
    if todays_ops:
        rate = (len(done_ops) / len(todays_ops)) * 100.0

    alert_ops = [op for op in todays_ops if "alert" in op.op_type]

    return {
        "totalAppareils": device_count,
        "detectesAujourdHui": len(detection_ops),
        "tauxRecuperation": f"{rate:.0f}%",
        "alertes": len(alert_ops),
    }

