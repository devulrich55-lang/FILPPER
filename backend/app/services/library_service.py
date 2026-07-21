from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlmodel import Session, select

from app.db.models import LibraryItem, User


def list_items(session: Session, user: User, kind: str) -> List[LibraryItem]:
    items = session.exec(select(LibraryItem).where(LibraryItem.user_id == user.id, LibraryItem.kind == kind)).all()
    return items


def upsert_item(
    session: Session,
    user: User,
    *,
    kind: str,
    name: str,
    data: Dict[str, Any],
) -> LibraryItem:
    existing = session.exec(
        select(LibraryItem).where(
            LibraryItem.user_id == user.id,
            LibraryItem.kind == kind,
            LibraryItem.name == name,
        )
    ).first()
    if existing:
        existing.data = data
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    item = LibraryItem(user_id=user.id, kind=kind, name=name, data=data)  # type: ignore[arg-type]
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def delete_item(session: Session, user: User, *, kind: str, item_id: int) -> None:
    item = session.get(LibraryItem, item_id)
    if not item or item.user_id != user.id or item.kind != kind:
        return
    session.delete(item)
    session.commit()


def get_item(session: Session, user: User, *, kind: str, item_id: int) -> Optional[LibraryItem]:
    item = session.get(LibraryItem, item_id)
    if not item or item.user_id != user.id or item.kind != kind:
        return None
    return item


def update_item(
    session: Session,
    user: User,
    *,
    kind: str,
    item_id: int,
    name: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None,
) -> Optional[LibraryItem]:
    item = get_item(session, user, kind=kind, item_id=item_id)
    if not item:
        return None
    if name is not None:
        item.name = name
    if data is not None:
        item.data = data
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

