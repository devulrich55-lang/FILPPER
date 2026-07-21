from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.api.deps import get_current_user_and_scopes
from app.db.models import Device
from app.db.session import get_session

router = APIRouter()


class DeviceCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    device_type: str = Field(min_length=1, max_length=40)
    status: str = "unknown"


class DeviceUpdateRequest(BaseModel):
    name: str | None = None
    device_type: str | None = None
    status: str | None = None


class DeviceResponse(BaseModel):
    id: int
    name: str
    device_type: str
    status: str
    last_seen: str


@router.get("", response_model=List[DeviceResponse])
def list_devices(
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> list[dict]:
    user, _scopes = ctx
    devices = session.exec(select(Device).where(Device.user_id == user.id)).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "device_type": d.device_type,
            "status": d.status,
            "last_seen": d.last_seen.isoformat(),
        }
        for d in devices
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_device(
    payload: DeviceCreateRequest,
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, _scopes = ctx
    device = Device(
        user_id=user.id,
        name=payload.name,
        device_type=payload.device_type,
        status=payload.status,
        last_seen=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    session.add(device)
    session.commit()
    session.refresh(device)
    return {"id": device.id, "name": device.name, "device_type": device.device_type, "status": device.status}


@router.get("/{device_id}")
def get_device(
    device_id: int,
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, _scopes = ctx
    device = session.get(Device, device_id)
    if not device or device.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return {
        "id": device.id,
        "name": device.name,
        "device_type": device.device_type,
        "status": device.status,
        "last_seen": device.last_seen.isoformat(),
    }


@router.put("/{device_id}")
def update_device(
    device_id: int,
    payload: DeviceUpdateRequest,
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> dict:
    user, _scopes = ctx
    device = session.get(Device, device_id)
    if not device or device.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(device, k, v)

    device.last_seen = datetime.utcnow()
    session.add(device)
    session.commit()
    session.refresh(device)
    return {"id": device.id, "name": device.name, "device_type": device.device_type, "status": device.status}


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(
    device_id: int,
    ctx=Depends(get_current_user_and_scopes),
    session: Session = Depends(get_session),
) -> None:
    user, _scopes = ctx
    device = session.get(Device, device_id)
    if not device or device.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    session.delete(device)
    session.commit()
    return None

