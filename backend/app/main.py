import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Import all models so they are registered with Base.metadata
from app.models import models as _models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    # ── Startup ──────────────────────────────────────────────────────────
    logger.info("Creating upload directories...")
    Path(settings.photos_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.selfies_dir).mkdir(parents=True, exist_ok=True)

    logger.info("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Focal backend is ready!")
    yield

    # ── Shutdown ─────────────────────────────────────────────────────────
    logger.info("Shutting down...")
    await engine.dispose()


app = FastAPI(
    title="Focal API",
    description="AI-powered photo distribution — sort group photos to the right people using face recognition.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]
if settings.CORS_ORIGINS:
    if settings.CORS_ORIGINS.strip() == "*":
        origins = ["*"]
    else:
        additional = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
        origins.extend(additional)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (serve uploaded photos / selfies) ───────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── API Routes ───────────────────────────────────────────────────────────────
app.include_router(api_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "Focal API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
