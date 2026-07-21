from sqlmodel import Session, select

from app.core.security import hash_password
from app.db.models import User
from app.db.session import engine

DEFAULT_ADMIN_USERNAME = "Ulrich"
DEFAULT_ADMIN_PASSWORD = "Ulrich11+"
DEFAULT_ADMIN_SCOPES = "admin"


def seed_admin_user() -> None:
    with Session(engine) as session:
        existing = session.exec(
            select(User).where(User.username == DEFAULT_ADMIN_USERNAME)
        ).first()
        if existing:
            return

        user = User(
            username=DEFAULT_ADMIN_USERNAME,
            password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
            scopes=DEFAULT_ADMIN_SCOPES,
        )
        session.add(user)
        session.commit()
