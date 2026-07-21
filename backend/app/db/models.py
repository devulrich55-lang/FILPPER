from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import Column
from sqlalchemy.types import JSON
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    scopes: str = Field(default="dashboard:read")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Device(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    name: str
    device_type: str
    status: str = Field(default="unknown")  # online/offline/unknown
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Operation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    op_type: str = Field(index=True)  # e.g. rfid.scan, ir.transmit, badusb.execute
    scope_required: str = Field(default="")
    status: str = Field(default="queued")  # queued/done/blocked/error
    payload: Dict[str, Any] = Field(
        sa_column=Column(JSON),
        default_factory=dict,
    )
    result: Dict[str, Any] = Field(
        sa_column=Column(JSON),
        default_factory=dict,
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LibraryItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    kind: str = Field(index=True)  # e.g. rfid.badge, nfc.tag, ir.remote
    name: str
    data: Dict[str, Any] = Field(sa_column=Column(JSON), default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EventLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    event_type: str = Field(index=True)  # scan/lock/ring/wipe/error/security
    message: str
    meta: Dict[str, Any] = Field(sa_column=Column(JSON), default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Alias used by init_db
SQLModelBase = SQLModel

