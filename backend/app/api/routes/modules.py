from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_user_and_scopes
from app.db.models import EventLog, LibraryItem, Operation, Device
from app.db.session import get_session
from app.services.library_service import delete_item, get_item, list_items, update_item, upsert_item
from app.services.ai_service import run_ai_analysis
from app.services.ble_scanner import scan_ble_devices
from app.services.scan_service import latest_ble_scan_results, register_detected_devices, scan_result_from_payload
from app.services.operations_service import create_operation, require_authorized

router = APIRouter()


def _scopes_or_admin(user_scopes: List[str]) -> bool:
    return "admin" in user_scopes


def _require(user_scopes: List[str], required_scope: str) -> None:
    if required_scope:
        require_authorized(user_scopes, required_scope)


def _dry_run_default(payload: Dict[str, Any]) -> bool:
    return payload.get("dry_run", False) is True


@router.post("/devices/{device_id}/lock")
def lock_device(
    device_id: int,
    payload: Dict[str, Any],
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, scopes = ctx
    _require(scopes, "devices:control")
    _dry = _dry_run_default(payload)

    op = create_operation(
        session,
        user,
        op_type="devices.lock",
        payload={"device_id": device_id, **payload},
        scope_required="devices:control",
        dry_run=_dry,
        status="done",
    )
    device = session.get(Device, device_id)
    if device and device.user_id == user.id:
        device.status = "locked"
        device.last_seen = datetime.utcnow()
        session.add(device)
        session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": _dry}


@router.post("/devices/{device_id}/ring")
def ring_device(
    device_id: int,
    payload: Dict[str, Any],
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, scopes = ctx
    _require(scopes, "devices:control")
    _dry = _dry_run_default(payload)

    op = create_operation(
        session,
        user,
        op_type="devices.ring",
        payload={"device_id": device_id, **payload},
        scope_required="devices:control",
        dry_run=_dry,
    )
    return {"operation_id": op.id, "status": op.status, "dryRun": _dry}


@router.post("/devices/{device_id}/wipe")
def wipe_device(
    device_id: int,
    payload: Dict[str, Any],
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, scopes = ctx
    _require(scopes, "devices:wipe")
    _dry = _dry_run_default(payload)

    op = create_operation(
        session,
        user,
        op_type="devices.wipe",
        payload={"device_id": device_id, **payload},
        scope_required="devices:wipe",
        dry_run=_dry,
    )
    return {"operation_id": op.id, "status": op.status, "dryRun": _dry}


@router.post("/devices/{device_id}/message")
def send_device_message(
    device_id: int,
    payload: Dict[str, Any],
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, scopes = ctx
    _require(scopes, "devices:control")
    _dry = _dry_run_default(payload)

    op = create_operation(
        session,
        user,
        op_type="devices.message",
        payload={"device_id": device_id, **payload},
        scope_required="devices:control",
        dry_run=_dry,
    )
    return {"operation_id": op.id, "status": op.status, "dryRun": _dry}


@router.get("/devices/{device_id}/last-known")
def last_known(device_id: int, ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _scopes = ctx
    device = session.get(Device, device_id)
    if not device or device.user_id != user.id:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"device_id": device_id, "lastSeen": device.last_seen.isoformat(), "status": device.status}


# ------------------------ RFID (125 kHz) ------------------------


@router.post("/rfid/scan")
def rfid_scan(
    payload: Dict[str, Any],
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, scopes = ctx
    _require(scopes, "rfid:read")
    dry = _dry_run_default(payload)

    result = scan_result_from_payload(payload, scan_type="rfid")
    if payload.get("register") and result.get("items"):
        result["registered"] = register_detected_devices(session, user, result["items"])

    op = create_operation(
        session,
        user,
        op_type="rfid.scan",
        payload=payload,
        status="done",
        scope_required="rfid:read",
        dry_run=dry,
    )
    op.result = result  # type: ignore[assignment]
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


@router.post("/rfid/emulate")
def rfid_emulate(
    payload: Dict[str, Any],
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, scopes = ctx
    _require(scopes, "rfid:emulate")
    dry = _dry_run_default(payload)

    op = create_operation(
        session,
        user,
        op_type="rfid.emulate",
        payload=payload,
        scope_required="rfid:emulate",
        dry_run=dry,
    )
    op.status = "queued"  # sensitive: never execute in scaffold
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/rfid/library")
def rfid_library(
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> list[dict]:
    user, _scopes = ctx
    items = list_items(session, user, kind="rfid.badge")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/rfid/library")
def rfid_library_add(
    payload: Dict[str, Any],
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, _scopes = ctx
    name = str(payload.get("name", "Badge"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="rfid.badge", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.delete("/rfid/library/{item_id}")
def rfid_library_delete(
    item_id: int,
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, _scopes = ctx
    delete_item(session, user, kind="rfid.badge", item_id=item_id)
    return {"deleted": True}


# ------------------------ NFC (13.56 MHz) ------------------------


@router.post("/nfc/scan")
def nfc_scan(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "nfc:read")
    dry = _dry_run_default(payload)
    result = scan_result_from_payload(payload, scan_type="nfc")
    if payload.get("register") and result.get("items"):
        result["registered"] = register_detected_devices(session, user, result["items"])
    op = create_operation(
        session, user, op_type="nfc.scan", payload=payload, status="done",
        scope_required="nfc:read", dry_run=dry,
    )
    op.result = result  # type: ignore[assignment]
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


@router.post("/nfc/emulate")
def nfc_emulate(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "nfc:emulate")
    dry = _dry_run_default(payload)

    op = create_operation(
        session,
        user,
        op_type="nfc.emulate",
        payload=payload,
        scope_required="nfc:emulate",
        dry_run=dry,
    )
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/nfc/tags")
def nfc_tags(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    items = list_items(session, user, kind="nfc.tag")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/nfc/tags")
def nfc_tags_add(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    name = str(payload.get("name", "Tag"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="nfc.tag", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.delete("/nfc/tags/{item_id}")
def nfc_tags_delete(item_id: int, ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    delete_item(session, user, kind="nfc.tag", item_id=item_id)
    return {"deleted": True}


# ------------------------ Sub-GHz ------------------------


@router.post("/subghz/analyze")
def subghz_analyze(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "subghz:analyze")
    dry = _dry_run_default(payload)

    result = scan_result_from_payload(payload, scan_type="subghz")
    if payload.get("frequency_mhz"):
        result["frequency_mhz"] = payload.get("frequency_mhz")
    if payload.get("modulation"):
        result["modulation"] = payload.get("modulation")
    op = create_operation(
        session,
        user,
        op_type="subghz.analyze",
        payload=payload,
        status="done",
        scope_required="subghz:analyze",
        dry_run=dry,
    )
    op.result = result  # type: ignore[assignment]
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


@router.post("/subghz/transmit")
def subghz_transmit(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "subghz:transmit")
    dry = _dry_run_default(payload)

    op = create_operation(
        session,
        user,
        op_type="subghz.transmit",
        payload=payload,
        scope_required="subghz:transmit",
        dry_run=dry,
    )
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/subghz/signals")
def subghz_signals(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    items = list_items(session, user, kind="subghz.signal")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/subghz/signals")
def subghz_signals_add(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    name = str(payload.get("name", "Signal"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="subghz.signal", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.put("/subghz/signals/{item_id}")
def subghz_signals_update(
    item_id: int,
    payload: Dict[str, Any],
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, _ = ctx
    item = update_item(
        session,
        user,
        kind="subghz.signal",
        item_id=item_id,
        name=payload.get("name"),
        data=payload.get("data"),
    )
    if not item:
        raise HTTPException(status_code=404, detail="Signal not found")
    return {"id": item.id, "name": item.name}


@router.delete("/subghz/signals/{item_id}")
def subghz_signals_delete(item_id: int, ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    delete_item(session, user, kind="subghz.signal", item_id=item_id)
    return {"deleted": True}


# ------------------------ IR ------------------------


@router.post("/ir/scan")
def ir_scan(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ir:read")
    dry = _dry_run_default(payload)
    result = scan_result_from_payload(payload, scan_type="ir")
    if payload.get("commands"):
        result["commands"] = payload.get("commands")
    op = create_operation(session, user, op_type="ir.scan", payload=payload, status="done", scope_required="ir:read", dry_run=dry)
    op.result = result  # type: ignore[assignment]
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


@router.post("/ir/transmit")
def ir_transmit(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ir:transmit")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="ir.transmit", payload=payload, scope_required="ir:transmit", dry_run=dry)
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/ir/remotes")
def ir_remotes(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    items = list_items(session, user, kind="ir.remote")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/ir/remotes")
def ir_remotes_add(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    name = str(payload.get("name", "Remote"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="ir.remote", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.post("/ir/remotes/custom")
def ir_remotes_custom(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    # custom builder = store a remote template
    user, scopes = ctx
    _require(scopes, "ir:write")
    return ir_remotes_add(payload, ctx=ctx, session=session)


@router.delete("/ir/remotes/{item_id}")
def ir_remotes_delete(item_id: int, ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    delete_item(session, user, kind="ir.remote", item_id=item_id)
    return {"deleted": True}


# ------------------------ BLE ------------------------


@router.post("/ble/pair")
def ble_pair(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ble:pair")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="ble.pair", payload=payload, scope_required="ble:pair", dry_run=dry)
    op.status = "done" if dry else "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.delete("/ble/unpair")
def ble_unpair(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ble:pair")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="ble.unpair", payload=payload, scope_required="ble:pair", dry_run=dry)
    op.status = "done" if dry else "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.post("/ble/scan")
def ble_scan(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ble:scan")
    dry = _dry_run_default(payload)

    items = payload.get("devices") or payload.get("items") or payload.get("results") or []
    source = "client"

    if not items and payload.get("use_server_scan", True):
        timeout = float(payload.get("timeout", 8))
        items = scan_ble_devices(timeout=timeout)
        source = "server"

    scan_payload = {**payload, "devices": items}
    result = scan_result_from_payload(scan_payload, scan_type="ble")
    result["source"] = source

    if payload.get("register") and result.get("items"):
        result["registered"] = register_detected_devices(session, user, result["items"])

    op = create_operation(session, user, op_type="ble.scan", payload=scan_payload, status="done", scope_required="ble:scan", dry_run=dry)
    op.result = result  # type: ignore[assignment]
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


@router.get("/ble/devices")
def ble_devices(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _scopes = ctx
    scanned = latest_ble_scan_results(session, user)
    if scanned:
        return scanned
    devices = session.exec(select(Device).where(Device.user_id == user.id)).all()
    return [{"id": d.id, "name": d.name, "device_type": d.device_type, "status": d.status} for d in devices]


@router.post("/ble/sync")
def ble_sync(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ble:sync")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="ble.sync", payload=payload, scope_required="ble:sync", dry_run=dry)
    op.status = "done" if dry else "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/ble/sync/status")
def ble_sync_status(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _scopes = ctx
    return {"status": "idle", "progress": 0}


@router.get("/connectivity/ble/status")
def ble_connectivity_status() -> dict:
    return {"status": "available"}


# ------------------------ BadUSB (SAFE DRY-RUN) ------------------------


@router.get("/badusb/scripts")
def badusb_scripts(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    items = list_items(session, user, kind="badusb.script")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/badusb/scripts")
def badusb_scripts_add(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "badusb:manage")
    name = str(payload.get("name", "Script"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="badusb.script", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.post("/badusb/execute")
def badusb_execute(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "badusb:execute")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="badusb.execute", payload=payload, scope_required="badusb:execute", dry_run=dry)
    op.status = "queued"  # Scaffold blocks real execution
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.post("/badusb/emulate")
def badusb_emulate(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "badusb:emulate")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="badusb.emulate", payload=payload, scope_required="badusb:emulate", dry_run=dry)
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


# ------------------------ iButton (1-Wire) ------------------------


@router.post("/ibutton/scan")
def ibutton_scan(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ibutton:read")
    dry = _dry_run_default(payload)
    result = scan_result_from_payload(payload, scan_type="ibutton")
    if payload.get("register") and result.get("items"):
        result["registered"] = register_detected_devices(session, user, result["items"])
    op = create_operation(session, user, op_type="ibutton.scan", payload=payload, status="done", scope_required="ibutton:read", dry_run=dry)
    op.result = result  # type: ignore[assignment]
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


@router.post("/ibutton/emulate")
def ibutton_emulate(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ibutton:emulate")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="ibutton.emulate", payload=payload, scope_required="ibutton:emulate", dry_run=dry)
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/ibutton/keys")
def ibutton_keys(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    items = list_items(session, user, kind="ibutton.key")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/ibutton/keys")
def ibutton_keys_add(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    name = str(payload.get("name", "Key"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="ibutton.key", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.delete("/ibutton/keys/{item_id}")
def ibutton_keys_delete(item_id: int, ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    delete_item(session, user, kind="ibutton.key", item_id=item_id)
    return {"deleted": True}


# ------------------------ GPIO ------------------------


@router.post("/gpio/connect")
def gpio_connect(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "gpio:connect")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="gpio.connect", payload=payload, status="done", scope_required="gpio:connect", dry_run=dry)
    op.result = {"connected": bool(payload.get("connected")), "message": payload.get("message", "Connexion GPIO enregistree")}
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


@router.post("/gpio/{protocol}/send")
def gpio_send(protocol: str, payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "gpio:send")
    dry = _dry_run_default(payload)
    op = create_operation(
        session,
        user,
        op_type=f"gpio.{protocol}.send",
        payload=payload,
        status="done",
        scope_required="gpio:send",
        dry_run=dry,
    )
    op.result = {"protocol": protocol, "sent": True, "dryRun": dry}
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


@router.get("/gpio/debug/logs")
def gpio_logs(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    logs = session.exec(select(EventLog).where(EventLog.user_id == user.id)).all()
    # Return last 20 events as "debug logs"
    return {"logs": [{"event_type": l.event_type, "message": l.message, "created_at": l.created_at.isoformat()} for l in logs[-20:]]}


@router.post("/gpio/peripherals/{peripheral_id}/control")
def gpio_peripheral_control(peripheral_id: int, payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "gpio:control")
    dry = _dry_run_default(payload)
    op = create_operation(
        session,
        user,
        op_type="gpio.peripheral.control",
        payload={"peripheral_id": peripheral_id, **payload},
        scope_required="gpio:control",
        dry_run=dry,
    )
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/connectivity/gpio/status")
def gpio_connectivity_status() -> dict:
    return {"status": "available"}


# ------------------------ Files & Storage ------------------------


@router.get("/storage/info")
def storage_info(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"storage": "microSD", "freeBytes": 3_200_000_000, "totalBytes": 64_000_000_000}


@router.get("/files/folders")
def folders(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    items = list_items(session, user, kind="files.folder")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/files/folders")
def folders_add(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    name = str(payload.get("name", "Folder"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="files.folder", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.delete("/files/folders/{folder_id}")
def folders_delete(folder_id: int, ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    delete_item(session, user, kind="files.folder", item_id=folder_id)
    return {"deleted": True}


@router.post("/files/backup")
def files_backup(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "files:backup")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="files.backup", payload=payload, scope_required="files:backup", dry_run=dry)
    op.status = "done" if dry else "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.post("/files/import")
def files_import(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "files:import")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="files.import", payload=payload, scope_required="files:import", dry_run=dry)
    op.status = "done" if dry else "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/files/export")
def files_export(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    devices = session.exec(select(Device).where(Device.user_id == user.id)).all()
    ops = session.exec(select(Operation).where(Operation.user_id == user.id)).all()
    return {
        "devices": [{"id": d.id, "name": d.name, "device_type": d.device_type, "status": d.status} for d in devices],
        "operations_count": len(ops),
    }


@router.get("/apps/files/tree")
def files_tree(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    _user, _ = ctx
    return {"root": {"folders": ["rfid", "nfc", "ir", "subghz"]}}


# ------------------------ System ------------------------


@router.get("/system/battery")
def battery(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"batteryPercent": 87, "charging": False}


@router.get("/system/updates")
def system_updates(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"currentVersion": "1.0.0", "available": False}


@router.post("/system/updates")
def system_updates_post(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "system:update")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="system.update", payload=payload, scope_required="system:update", dry_run=dry)
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/system/logs")
def system_logs(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    logs = session.exec(select(EventLog).where(EventLog.user_id == user.id)).all()
    return {"logs": [{"event_type": l.event_type, "message": l.message, "created_at": l.created_at.isoformat()} for l in logs[-100:]]}


@router.get("/system/ui")
def system_ui(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    item = session.exec(select(LibraryItem).where(LibraryItem.user_id == user.id, LibraryItem.kind == "ui.theme")).first()
    if not item:
        return {"theme": "default"}
    return {"theme": item.data}


@router.put("/system/ui")
def system_ui_put(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    upsert_item(session, user, kind="ui.theme", name="default", data=payload)
    return {"saved": True}


@router.get("/system/plugins")
def system_plugins(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    items = list_items(session, user, kind="plugins")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/system/plugins")
def system_plugins_post(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    name = str(payload.get("name", "Plugin"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="plugins", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.delete("/system/plugins/{plugin_id}")
def system_plugins_del(plugin_id: int, ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    delete_item(session, user, kind="plugins", item_id=plugin_id)
    return {"deleted": True}


@router.get("/apps/system")
def apps_system(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"apps": ["battery", "updates", "logs", "plugins"]}


@router.get("/connectivity/usb")
def usb_connectivity() -> dict:
    return {"status": "available"}


@router.get("/connectivity/sdcard")
def sdcard_connectivity() -> dict:
    return {"status": "available"}


# ------------------------ Firmware & Dev ------------------------


@router.get("/firmware/latest")
def firmware_latest() -> dict:
    return {"version": "1.0.0", "releaseNotes": "scaffold"}


@router.post("/firmware/update")
def firmware_update(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "firmware:update")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="firmware.update", payload=payload, scope_required="firmware:update", dry_run=dry)
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/dev/sdk/docs")
def dev_sdk_docs() -> dict:
    return {"sdk": "scaffold", "endpoints": ["POST /api/dev/keys", "POST /api/dev/build"]}


@router.post("/dev/keys")
def dev_keys(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _scopes = ctx
    item = upsert_item(session, user, kind="dev.keys", name="keys", data=payload)
    return {"saved": True, "id": item.id}


@router.post("/dev/build")
def dev_build(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "dev:build")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="dev.build", payload=payload, scope_required="dev:build", dry_run=dry)
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


@router.get("/dev/apps")
def dev_apps(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    items = list_items(session, user, kind="dev.app")
    return [{"id": i.id, "name": i.name, "data": i.data} for i in items]


@router.post("/dev/apps")
def dev_apps_add(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "dev:apps")
    name = str(payload.get("name", "App"))
    data = payload.get("data", payload)
    item = upsert_item(session, user, kind="dev.app", name=name, data=data)
    return {"id": item.id, "name": item.name}


@router.post("/dev/firmware/flash")
def dev_firmware_flash(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "firmware:flash")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="dev.firmware.flash", payload=payload, scope_required="firmware:flash", dry_run=dry)
    op.status = "queued"
    session.add(op)
    session.commit()
    return {"operation_id": op.id, "status": op.status, "dryRun": dry}


# ------------------------ AI, Reports, Diagnostics, Journal ------------------------


@router.post("/ai/analyze")
def ai_analyze(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "ai:analyze")
    op = run_ai_analysis(session, user, payload=payload)
    return {"operation_id": op.id, "result": op.result}


@router.get("/journal")
def journal(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, _ = ctx
    logs = session.exec(select(EventLog).where(EventLog.user_id == user.id).order_by(EventLog.created_at)).all()
    return {"events": [{"event_type": l.event_type, "message": l.message, "created_at": l.created_at.isoformat()} for l in logs[-200:]]}


@router.get("/reports")
def reports(ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> list[dict]:
    user, _ = ctx
    ops = session.exec(select(Operation).where(Operation.user_id == user.id, Operation.op_type == "ai.report")).all()
    return [{"id": o.id, "payload": o.payload, "result": o.result, "created_at": o.created_at.isoformat()} for o in ops]


@router.post("/reports")
def reports_post(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "reports:write")
    dry = _dry_run_default(payload)
    op = create_operation(session, user, op_type="ai.report", payload=payload, scope_required="reports:write", dry_run=dry, status="done")
    return {"operation_id": op.id, "status": op.status}


@router.post("/diagnostics/run")
def diagnostics_run(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "diagnostics:run")
    dry = _dry_run_default(payload)
    checks = payload.get("checks")
    if not checks:
        checks = [
            {"name": "database", "status": "ok" if session else "error"},
            {"name": "auth", "status": "ok"},
        ]
    result = {"ok": all(c.get("status") == "ok" for c in checks), "checks": checks}
    op = create_operation(session, user, op_type="diagnostics.run", payload=payload, scope_required="diagnostics:run", dry_run=dry, status="done")
    op.result = result  # type: ignore[assignment]
    session.add(op)
    session.commit()
    session.refresh(op)
    return {"operation_id": op.id, "result": op.result}


# ------------------------ Apps intégrées (stubs) ------------------------


@router.get("/apps/nfc")
def apps_nfc(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"app": "nfc", "hint": "use /api/nfc/tags"}


@router.get("/apps/rfid")
def apps_rfid(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"app": "rfid", "hint": "use /api/rfid/library"}


@router.get("/apps/ir")
def apps_ir(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"app": "ir", "hint": "use /api/ir/remotes"}


@router.get("/apps/subghz")
def apps_subghz(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"app": "subghz", "hint": "use /api/subghz/signals"}


@router.get("/apps/settings")
def apps_settings_get(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"settings": "scaffold"}


@router.put("/apps/settings")
def apps_settings_put(payload: Dict[str, Any], ctx=Depends(get_current_user_and_scopes), session: Session = Depends(get_session)) -> dict:
    user, scopes = ctx
    _require(scopes, "settings:write")
    upsert_item(session, user, kind="apps.settings", name="settings", data=payload)
    return {"saved": True}


@router.get("/apps/clock/sync")
def apps_clock_sync(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"synced": True, "time": "2026-07-21T00:00:00Z"}


@router.get("/apps/games")
def apps_games(ctx=Depends(get_current_user_and_scopes)) -> dict:
    _user, _ = ctx
    return {"games": []}

