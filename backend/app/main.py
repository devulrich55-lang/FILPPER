from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, dashboard, devices, modules
from app.db.seed import seed_admin_user
from app.db.session import init_db


app = FastAPI(
    title="Flliter Mobile Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@app.on_event("startup")
def _startup() -> None:
    init_db()
    seed_admin_user()


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(modules.router, prefix="/api", tags=["modules"])

