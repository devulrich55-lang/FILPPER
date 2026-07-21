from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import desc
from sqlmodel import Session, select

from app.db.models import Device, Operation, User


def scan_result_from_payload(payload: Dict[str, Any], *, scan_type: str) -> Dict[str, Any]:
    """Build scan result only from client/hardware payload — no fake defaults."""
    items = payload.get("devices") or payload.get("items") or payload.get("results") or []
    if not items and payload.get("tag_uid"):
        items = [payload]
    if not items:
        return {
            "scan_type": scan_type,
            "count": 0,
            "items": [],
            "message": "Aucun resultat. Lancez un scan avec materiel connecte ou envoyez les donnees detectees.",
        }
    return {
        "scan_type": scan_type,
        "count": len(items),
        "items": items,
        "message": f"{len(items)} element(s) detecte(s)",
    }


def register_detected_devices(
    session: Session,
    user: User,
    items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    registered: List[Dict[str, Any]] = []
    for item in items:
        name = item.get("name") or item.get("tag_uid") or item.get("key_id") or "Appareil inconnu"
        device_type = item.get("device_type") or item.get("type") or item.get("protocol") or "unknown"
        status = item.get("status") or "online"

        existing = session.exec(
            select(Device).where(Device.user_id == user.id, Device.name == name)
        ).first()
        if existing:
            existing.status = status
            existing.last_seen = datetime.utcnow()
            session.add(existing)
            registered.append(
                {"id": existing.id, "name": existing.name, "device_type": existing.device_type, "status": existing.status}
            )
            continue

        device = Device(
            user_id=user.id,  # type: ignore[arg-type]
            name=str(name),
            device_type=str(device_type),
            status=str(status),
            last_seen=datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        session.add(device)
        session.commit()
        session.refresh(device)
        registered.append(
            {"id": device.id, "name": device.name, "device_type": device.device_type, "status": device.status}
        )
    return registered


def latest_ble_scan_results(session: Session, user: User) -> List[Dict[str, Any]]:
    ops = session.exec(
        select(Operation)
        .where(Operation.user_id == user.id, Operation.op_type == "ble.scan")
        .order_by(desc(Operation.created_at))
    ).all()
    if not ops:
        return []
    result = ops[0].result or {}
    return result.get("items") or result.get("devices") or []
