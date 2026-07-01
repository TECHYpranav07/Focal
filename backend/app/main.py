import os

# Limit TensorFlow CPU memory footprint and thread pools to prevent container OOM crashes
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

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
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE face_embeddings ADD COLUMN clothing_hist BLOB"))
            logger.info("Successfully added clothing_hist column to face_embeddings")
        except Exception:
            pass

    # Reset face matching state if the recognition model has changed or if we need to migrate clothing histograms
    version_file = Path(settings.UPLOAD_DIR) / "model_version.txt"
    old_model = ""
    if version_file.exists():
        try:
            old_model = version_file.read_text(encoding="utf-8").strip()
        except Exception:
            pass

    should_reset = old_model != settings.RECOGNITION_MODEL

    # Also reset if there are existing face embeddings that lack clothing histograms
    if not should_reset:
        async with engine.begin() as conn:
            try:
                result = await conn.execute(text("SELECT COUNT(*) FROM face_embeddings WHERE clothing_hist IS NULL"))
                count_missing = result.scalar()
                if count_missing > 0:
                    logger.info("Found %s face embeddings missing clothing histograms. Resetting for migration...", count_missing)
                    should_reset = True
            except Exception:
                pass

    if should_reset:
        logger.info(
            "Resetting face matching database entries to re-process with new configurations...",
        )
        async with engine.begin() as conn:
            await conn.execute(text("DELETE FROM matches"))
            await conn.execute(text("DELETE FROM face_embeddings"))
            await conn.execute(text("UPDATE selfies SET embedding = NULL"))
            await conn.execute(text("UPDATE photos SET processing_status = 'pending', face_count = 0"))
        try:
            version_file.write_text(settings.RECOGNITION_MODEL, encoding="utf-8")
        except Exception as exc:
            logger.error("Failed to write model version file: %s", exc)

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
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
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
