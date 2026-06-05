from fastapi import APIRouter

from app.api.v1.endpoints import auth, events, faces, gallery, photos, selfies

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(photos.router)
api_router.include_router(selfies.router)
api_router.include_router(faces.router)
api_router.include_router(gallery.router)
