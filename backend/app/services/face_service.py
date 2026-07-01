"""Face processing service — DeepFace embedding extraction + cosine matching."""

import logging
from collections import defaultdict

import numpy as np
from deepface import DeepFace
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import (
    Event,
    EventMember,
    FaceEmbedding,
    Match,
    Photo,
    Selfie,
)
from app.utils.similarity import (
    bytes_to_embedding,
    cosine_similarity,
    embedding_to_bytes,
)

logger = logging.getLogger(__name__)


# ── Clothing Histogram Extraction ─────────────────────────────────────────────

def extract_clothing_histogram(image_path: str, bbox: dict) -> np.ndarray | None:
    """Extract a 2D Hue-Saturation color histogram of the clothing area below the face."""
    import cv2
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        h_img, w_img, _ = img.shape
        
        # Bounding box of face: x, y, w, h
        x = int(bbox.get("x", 0))
        y = int(bbox.get("y", 0))
        w = int(bbox.get("w", 0))
        h = int(bbox.get("h", 0))
        
        # Torso area is roughly below the face
        cx = max(0, x - w // 2)
        cy = min(h_img - 1, y + h)
        cw = w * 2
        ch = h * 3
        
        x1 = cx
        y1 = cy
        x2 = min(w_img, cx + cw)
        y2 = min(h_img, cy + ch)
        
        if x2 <= x1 or y2 <= y1:
            return None
            
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            return None
            
        # Convert to HSV color space
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        
        # Calculate 2D H-S histogram (8 bins for Hue, 8 bins for Saturation)
        hist = cv2.calcHist([hsv], [0, 1], None, [8, 8], [0, 180, 0, 256])
        
        # Normalize histogram to sum to 1
        norm = np.sum(hist)
        if norm > 0:
            hist = hist / norm
        return hist.flatten()
    except Exception as exc:
        logger.error("Failed to extract clothing histogram for %s: %s", image_path, exc)
        return None


def compare_clothing_histograms(hist1: np.ndarray, hist2: np.ndarray) -> float:
    """Compare two 2D H-S histograms using correlation. Returns value between -1.0 and 1.0."""
    import cv2
    try:
        return float(cv2.compareHist(hist1.astype(np.float32), hist2.astype(np.float32), cv2.HISTCMP_CORREL))
    except Exception as exc:
        logger.error("Failed to compare clothing histograms: %s", exc)
        return -1.0


# ── Embedding Extraction ─────────────────────────────────────────────────────

def extract_embeddings_from_image(image_path: str) -> list[dict]:
    """Run DeepFace on a single image and return a list of face dicts.

    Each dict has keys: embedding (list[float]), facial_area (dict), face_confidence (float).
    Returns an empty list when no faces are detected.
    """
    try:
        results = DeepFace.represent(
            img_path=image_path,
            model_name=settings.RECOGNITION_MODEL,
            detector_backend=settings.DETECTOR_BACKEND,
            enforce_detection=False,
        )
    except Exception as exc:
        logger.error("DeepFace.represent failed for %s: %s", image_path, exc)
        return []

    faces: list[dict] = []
    for face_obj in results:
        embedding = face_obj.get("embedding")
        if embedding is None:
            continue
        facial_area = face_obj.get("facial_area", {})
        confidence = face_obj.get("face_confidence", 0.0)
        faces.append({
            "embedding": embedding,
            "facial_area": facial_area,
            "face_confidence": confidence,
        })
    return faces


# ── Per-Photo Processing ─────────────────────────────────────────────────────

async def process_photo_embeddings(photo: Photo, db: AsyncSession) -> int:
    """Extract face embeddings from a single photo and persist them.

    Returns the number of faces detected.
    """
    faces = extract_embeddings_from_image(photo.file_path)
    face_count = 0

    for face_data in faces:
        emb_bytes = embedding_to_bytes(face_data["embedding"])
        area = face_data["facial_area"]

        # Extract clothing histogram
        clothing_hist_bytes = None
        try:
            hist = extract_clothing_histogram(photo.file_path, area)
            if hist is not None:
                clothing_hist_bytes = hist.tobytes()
        except Exception as e:
            logger.error("Failed to extract clothing histogram: %s", e)

        face_emb = FaceEmbedding(
            photo_id=photo.id,
            embedding=emb_bytes,
            bbox_x=int(area.get("x", 0)),
            bbox_y=int(area.get("y", 0)),
            bbox_w=int(area.get("w", 0)),
            bbox_h=int(area.get("h", 0)),
            detection_confidence=float(face_data["face_confidence"]),
            clothing_hist=clothing_hist_bytes,
        )
        db.add(face_emb)
        face_count += 1

    photo.face_count = face_count
    await db.flush()
    return face_count


# ── Selfie Embedding Extraction ──────────────────────────────────────────────

async def process_selfie_embedding(selfie: Selfie, db: AsyncSession) -> bool:
    """Extract the face embedding from a selfie and store it.

    Returns True on success, False if no face was detected.
    """
    faces = extract_embeddings_from_image(selfie.file_path)
    if not faces:
        logger.warning("No face detected in selfie %s", selfie.id)
        return False

    # Use the first (and presumably only / most prominent) face
    emb_bytes = embedding_to_bytes(faces[0]["embedding"])
    selfie.embedding = emb_bytes
    await db.flush()
    return True


# ── Member Centroid Computation ───────────────────────────────────────────────

async def compute_member_centroids(
    event_id: int, db: AsyncSession
) -> dict[int, np.ndarray]:
    """Compute the average (centroid) embedding for each member from their selfies.

    Returns {user_id: centroid_ndarray}.
    """
    result = await db.execute(
        select(Selfie).where(
            Selfie.event_id == event_id,
            Selfie.embedding.isnot(None),
        )
    )
    selfies = result.scalars().all()

    user_embeddings: dict[int, list[np.ndarray]] = defaultdict(list)
    for selfie in selfies:
        emb = bytes_to_embedding(selfie.embedding)
        user_embeddings[selfie.user_id].append(emb)

    centroids: dict[int, np.ndarray] = {}
    for user_id, embeddings in user_embeddings.items():
        stacked = np.stack(embeddings, axis=0)
        centroid = np.mean(stacked, axis=0)
        # Normalise so cosine similarity is just a dot product
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        centroids[user_id] = centroid

    return centroids


# ── Face Matching Pipeline ────────────────────────────────────────────────────

async def match_faces_for_event(event_id: int, db: AsyncSession) -> dict:
    """Full processing pipeline for an event.

    1. Extract embeddings from every pending group photo.
    2. Process selfie embeddings if not yet extracted.
    3. Compute member centroids.
    4. Match each face embedding against every centroid.
    5. Create Match records for similarities >= threshold.
    6. Mark photos as completed.

    Returns a summary dict.
    """
    threshold = settings.SIMILARITY_THRESHOLD

    # ── Step 0: Validate event exists ────────────────────────────────────
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if event is None:
        raise ValueError(f"Event {event_id} not found")

    # ── Step 1: Process selfie embeddings that haven't been extracted yet ─
    selfie_result = await db.execute(
        select(Selfie).where(
            Selfie.event_id == event_id,
            Selfie.embedding.is_(None),
        )
    )
    unprocessed_selfies = selfie_result.scalars().all()
    for selfie in unprocessed_selfies:
        await process_selfie_embedding(selfie, db)

    # ── Step 2: Extract embeddings from pending photos ───────────────────
    photo_result = await db.execute(
        select(Photo).where(
            Photo.event_id == event_id,
            Photo.processing_status.in_(["pending", "failed"]),
        )
    )
    pending_photos = photo_result.scalars().all()

    total_faces = 0
    for photo in pending_photos:
        photo.processing_status = "processing"
        await db.flush()
        try:
            faces_found = await process_photo_embeddings(photo, db)
            total_faces += faces_found
            photo.processing_status = "completed"
        except Exception as exc:
            logger.error("Failed to process photo %s: %s", photo.id, exc)
            photo.processing_status = "failed"
        finally:
            import gc
            import tensorflow.keras.backend as K
            try:
                K.clear_session()
            except Exception:
                pass
            gc.collect()
        await db.flush()

    # ── Step 3: Compute member centroids ─────────────────────────────────
    centroids = await compute_member_centroids(event_id, db)
    if not centroids:
        logger.warning("No member selfie embeddings found for event %s", event_id)
        await db.commit()
        return {
            "event_id": event_id,
            "photos_processed": len(pending_photos),
            "faces_detected": total_faces,
            "matches_created": 0,
            "message": "No selfie embeddings available for matching",
        }

    # ── Step 4: Match all face embeddings against centroids ──────────────
    all_photos_result = await db.execute(
        select(Photo).where(
            Photo.event_id == event_id,
            Photo.processing_status == "completed",
        )
    )
    all_completed_photos = all_photos_result.scalars().all()

    # ── Step 4.0: Build clothing signatures for event members (First Pass) ────
    user_clothing_samples = defaultdict(list)
    for photo in all_completed_photos:
        face_embs_result = await db.execute(
            select(FaceEmbedding).where(FaceEmbedding.photo_id == photo.id)
        )
        face_embs = face_embs_result.scalars().all()
        for face_emb in face_embs:
            if face_emb.clothing_hist is None:
                continue
            face_vec = bytes_to_embedding(face_emb.embedding)
            for user_id, centroid in centroids.items():
                sim = cosine_similarity(face_vec, centroid)
                if sim >= threshold:  # Strict high-confidence face match
                    hist = np.frombuffer(face_emb.clothing_hist, dtype=np.float32)
                    user_clothing_samples[user_id].append(hist)

    # Compute the average normalized clothing signature for each user
    user_clothing_signatures = {}
    for user_id, samples in user_clothing_samples.items():
        avg_hist = np.mean(samples, axis=0)
        norm = np.sum(avg_hist)
        if norm > 0:
            avg_hist = avg_hist / norm
        user_clothing_signatures[user_id] = avg_hist
        logger.info("Built clothing signature for user %s with %s samples", user_id, len(samples))

    matches_created = 0
    fallback_threshold = settings.FALLBACK_THRESHOLD
    insurance_threshold = settings.INSURANCE_THRESHOLD

    for photo in all_completed_photos:
        face_embs_result = await db.execute(
            select(FaceEmbedding).where(FaceEmbedding.photo_id == photo.id)
        )
        face_embs = face_embs_result.scalars().all()
        if not face_embs:
            continue

        photo_matches_created = 0
        photo_best_face_emb_id = None
        photo_best_user_id = None
        photo_best_sim = -1.0

        for face_emb in face_embs:
            face_vec = bytes_to_embedding(face_emb.embedding)
            
            face_best_user_id = None
            face_best_sim = -1.0
            strict_matches = []

            # Retrieve face's clothing histogram if available
            face_hist = None
            if face_emb.clothing_hist is not None:
                face_hist = np.frombuffer(face_emb.clothing_hist, dtype=np.float32)

            for user_id, centroid in centroids.items():
                sim = cosine_similarity(face_vec, centroid)
                
                # Apply clothing boost if signature is available for this user
                if face_hist is not None and user_id in user_clothing_signatures:
                    user_sig = user_clothing_signatures[user_id]
                    try:
                        corr = compare_clothing_histograms(face_hist, user_sig)
                        # If clothing matches strongly (corr >= 0.70), apply a boost
                        if corr >= 0.70:
                            boost = max(0.0, (corr - 0.70) * 0.5)
                            sim = min(1.0, sim + boost)
                            logger.info(
                                "User %s clothing match corr %s, boosted face sim to %s",
                                user_id, round(corr, 3), round(sim, 3)
                            )
                    except Exception as e:
                        logger.error("Failed to compare clothing: %s", e)

                if sim > face_best_sim:
                    face_best_sim = sim
                    face_best_user_id = user_id
                
                if sim >= threshold:
                    strict_matches.append((user_id, sim))
            
            # Keep track of the absolute best match across the entire photo for insurance
            if face_best_sim > photo_best_sim:
                photo_best_sim = face_best_sim
                photo_best_user_id = face_best_user_id
                photo_best_face_emb_id = face_emb.id

            if strict_matches:
                for user_id, sim in strict_matches:
                    # Check for existing match to avoid duplicates
                    existing = await db.execute(
                        select(Match).where(
                            Match.event_id == event_id,
                            Match.photo_id == photo.id,
                            Match.user_id == user_id,
                            Match.face_embedding_id == face_emb.id,
                        )
                    )
                    if existing.scalar_one_or_none() is None:
                        match = Match(
                            event_id=event_id,
                            photo_id=photo.id,
                            user_id=user_id,
                            face_embedding_id=face_emb.id,
                            similarity_score=round(sim, 4),
                        )
                        db.add(match)
                        matches_created += 1
                        photo_matches_created += 1
            else:
                # Fallback: Best match above fallback threshold
                if face_best_user_id is not None and face_best_sim >= fallback_threshold:
                    existing = await db.execute(
                        select(Match).where(
                            Match.event_id == event_id,
                            Match.photo_id == photo.id,
                            Match.user_id == face_best_user_id,
                            Match.face_embedding_id == face_emb.id,
                        )
                    )
                    if existing.scalar_one_or_none() is None:
                        match = Match(
                            event_id=event_id,
                            photo_id=photo.id,
                            user_id=face_best_user_id,
                            face_embedding_id=face_emb.id,
                            similarity_score=round(face_best_sim, 4),
                        )
                        db.add(match)
                        matches_created += 1
                        photo_matches_created += 1

        # Check existing matches in DB for this photo
        db_matches_result = await db.execute(
            select(Match).where(Match.photo_id == photo.id)
        )
        db_matches = db_matches_result.scalars().all()
        
        # Distribution Insurance: If photo has faces, but no matches in database and none created this run
        if len(db_matches) == 0 and photo_matches_created == 0:
            if photo_best_user_id is not None and photo_best_sim >= insurance_threshold:
                match = Match(
                    event_id=event_id,
                    photo_id=photo.id,
                    user_id=photo_best_user_id,
                    face_embedding_id=photo_best_face_emb_id,
                    similarity_score=round(photo_best_sim, 4),
                )
                db.add(match)
                matches_created += 1
                logger.info(
                    "Insurance match created for photo %s (user %s, sim %s)",
                    photo.id,
                    photo_best_user_id,
                    photo_best_sim,
                )

    await db.flush()
    await db.commit()

    return {
        "event_id": event_id,
        "photos_processed": len(pending_photos),
        "faces_detected": total_faces,
        "matches_created": matches_created,
        "message": "Processing complete",
    }


# ── Processing Status ────────────────────────────────────────────────────────

async def get_processing_status(event_id: int, db: AsyncSession) -> dict:
    """Return a summary of processing progress for the event."""
    total_result = await db.execute(
        select(func.count(Photo.id)).where(Photo.event_id == event_id)
    )
    total_photos = total_result.scalar() or 0

    processed_result = await db.execute(
        select(func.count(Photo.id)).where(
            Photo.event_id == event_id,
            Photo.processing_status == "completed",
        )
    )
    processed_photos = processed_result.scalar() or 0

    faces_result = await db.execute(
        select(func.count(FaceEmbedding.id)).where(
            FaceEmbedding.photo_id.in_(
                select(Photo.id).where(Photo.event_id == event_id)
            )
        )
    )
    total_faces = faces_result.scalar() or 0

    matches_result = await db.execute(
        select(func.count(Match.id)).where(Match.event_id == event_id)
    )
    total_matches = matches_result.scalar() or 0

    # Determine overall status
    if total_photos == 0:
        overall_status = "no_photos"
    elif processed_photos == total_photos:
        overall_status = "completed"
    elif processed_photos > 0:
        overall_status = "processing"
    else:
        overall_status = "pending"

    return {
        "event_id": event_id,
        "status": overall_status,
        "total_photos": total_photos,
        "processed_photos": processed_photos,
        "total_faces_detected": total_faces,
        "total_matches": total_matches,
    }
