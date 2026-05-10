from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database import init_db
from app.services.reminder_scheduler import start_scheduler, stop_scheduler
from app.routers import auth, projects, personnel, followups, reminders, briefing, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="LifeOS API",
    description="Operations command center — Nexus Digital Solutions",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(personnel.router, prefix="/api/v1")
app.include_router(followups.router, prefix="/api/v1")
app.include_router(reminders.router, prefix="/api/v1")
app.include_router(briefing.router, prefix="/api/v1")
app.include_router(ws.router)  # WebSocket at /ws


@app.get("/health")
def health():
    return {"status": "ok", "service": "LifeOS API", "version": "1.0.0"}


@app.get("/")
def root():
    return {"message": "LifeOS API — Nexus Digital Solutions", "docs": "/docs"}
