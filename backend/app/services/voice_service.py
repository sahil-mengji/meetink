"""Voice verification service using SpeechBrain and pgvector speaker mapping."""

from __future__ import annotations

import os
import uuid
import logging
import tempfile
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db import models

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Global classifier instance for lazy loading
_classifier = None


def get_encoder_classifier() -> Any:
    """Lazy load the SpeechBrain EncoderClassifier to avoid startup delays."""
    global _classifier
    if _classifier is None:
        try:
            import torch
            import torchaudio
            from speechbrain.inference.speaker import EncoderClassifier
            logger.info("[VoiceService] Loading SpeechBrain EncoderClassifier (spkrec-ecapa-voxceleb)...")
            # Using the standard ECAPA-TDNN model which produces 192-dimensional embeddings
            _classifier = EncoderClassifier.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                savedir="data/speechbrain_models"
            )
            logger.info("[VoiceService] SpeechBrain model loaded successfully.")
        except Exception as e:
            logger.warning(f"[VoiceService] SpeechBrain / PyTorch could not be initialized directly ({e}). Using mock embeddings for fallback.")
            _classifier = "MOCK"
    return _classifier


def extract_embedding(audio_filepath: str) -> list[float]:
    """Extract a 192-dimensional speaker embedding from an audio file using SpeechBrain."""
    classifier = get_encoder_classifier()
    if classifier == "MOCK":
        # Generate a deterministic mock 192-dimensional embedding based on filename hash
        import hashlib
        h = hashlib.sha256(os.path.basename(audio_filepath).encode()).digest()
        embedding = [(float(b) / 255.0) for b in h[:192]]
        # If hash is shorter than 192 bytes (sha256 is 32 bytes = 32 floats), repeat it to reach 192
        while len(embedding) < 192:
            embedding.extend(embedding[:(192 - len(embedding))])
        return embedding

    try:
        import torchaudio
        # Load audio and normalize sample rate if necessary
        signal, fs = torchaudio.load(audio_filepath)
        if fs != 16000:
            import torchaudio.transforms as T
            resampler = T.Resample(fs, 16000)
            signal = resampler(signal)
        
        embeddings = classifier.encode_batch(signal)
        # Flatten the tensor to a 1D list of floats (192 dimensions)
        return embeddings.squeeze().tolist()
    except Exception as e:
        logger.error(f"[VoiceService] Error extracting real embedding from {audio_filepath}: {e}", exc_info=True)
        # Fallback to deterministic mock embedding
        return [0.1] * 192


def enroll_voice(user_id: str, audio_bytes: bytes, filename: str) -> dict:
    """Enroll a user's voice profile by generating and storing their embedding in pgvector."""
    logger.info(f"[VoiceService] Enrolling voice profile for user {user_id} from file {filename}")
    
    db: Session = SessionLocal()
    try:
        user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
        if not user:
            logger.error(f"[VoiceService] User {user_id} not found for voice enrollment.")
            raise ValueError(f"User {user_id} not found.")

        # Write audio bytes to a temporary file to pass to torchaudio/SpeechBrain
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1] or ".wav") as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            embedding = extract_embedding(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        profile_id = str(uuid.uuid4())
        profile = models.VoiceProfile(
            id=profile_id,
            user_id=user_id,
            name=user.name,
            embedding=embedding
        )
        db.add(profile)
        db.commit()
        logger.info(f"[VoiceService] Successfully enrolled voice profile {profile_id} for user {user.name}")
        return {"id": profile_id, "user_id": user_id, "name": user.name, "status": "enrolled"}
    except Exception as e:
        logger.error(f"[VoiceService] Error enrolling voice for user {user_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()


def list_voice_profiles() -> list[dict]:
    """List all enrolled voice profiles."""
    db: Session = SessionLocal()
    try:
        profiles = db.execute(select(models.VoiceProfile)).scalars().all()
        return [{"id": p.id, "user_id": p.user_id, "name": p.name} for p in profiles]
    finally:
        db.close()


def map_meeting_speakers(meeting_id: str, audio_filepath: str, raw_utterances: list[dict]) -> dict[str, str]:
    """
    Slice audio per generic speaker (e.g., Speaker A, Speaker B), generate combined embeddings,
    and match against enrolled voice profiles in pgvector using cosine distance.
    Returns a mapping dict: { "Speaker A": "Sahil", "Speaker B": "Navneet" }
    """
    logger.info(f"[VoiceService] Starting pgvector speaker mapping for meeting {meeting_id}")
    if not os.path.exists(audio_filepath):
        logger.warning(f"[VoiceService] Audio file {audio_filepath} does not exist. Cannot perform acoustic slicing.")
        return {}

    # Group utterances by raw speaker label
    speaker_segments: dict[str, list[tuple[float, float]]] = {}
    for u in raw_utterances:
        spk = u.get("speaker")
        if not spk or spk == "Unknown":
            continue
        start = u.get("start", 0.0)
        end = u.get("end", 0.0)
        if spk not in speaker_segments:
            speaker_segments[spk] = []
        speaker_segments[spk].append((start, end))

    if not speaker_segments:
        logger.warning("[VoiceService] No speaker segments found in utterances.")
        return {}

    db: Session = SessionLocal()
    try:
        # Check if we have any enrolled profiles first
        profiles_exist = db.execute(select(models.VoiceProfile)).scalars().first()
        if not profiles_exist:
            logger.info("[VoiceService] No enrolled voice profiles found in database. Skipping pgvector matching.")
            return {}

        mapping_result = {}
        # Try importing torchaudio for slicing audio
        try:
            import torchaudio
            import torch
            signal, fs = torchaudio.load(audio_filepath)
            
            for spk, segments in speaker_segments.items():
                logger.info(f"[VoiceService] Slicing audio for {spk} ({len(segments)} segments)...")
                # Concatenate up to the first 5 segments (max 30 seconds) to form a robust representation
                spk_chunks = []
                total_duration = 0.0
                for start, end in segments:
                    s_idx = int(start * fs)
                    e_idx = int(end * fs)
                    if e_idx > s_idx:
                        spk_chunks.append(signal[:, s_idx:e_idx])
                        total_duration += (end - start)
                        if total_duration >= 30.0:  # Cap at 30 seconds of audio per speaker for efficiency
                            break
                
                if not spk_chunks:
                    continue

                combined_signal = torch.cat(spk_chunks, dim=1)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                    torchaudio.save(tmp.name, combined_signal, fs)
                    tmp_path = tmp.name

                try:
                    spk_embedding = extract_embedding(tmp_path)
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)

                # Query pgvector for the closest matching voice profile using cosine distance
                # ORDER BY embedding <=> spk_embedding
                closest_profile = db.execute(
                    select(models.VoiceProfile, models.VoiceProfile.embedding.cosine_distance(spk_embedding).label("distance"))
                    .order_by("distance")
                    .limit(1)
                ).first()

                if closest_profile:
                    prof, dist = closest_profile
                    logger.info(f"[VoiceService] Matched {spk} ➔ {prof.name} (cosine distance: {dist:.4f})")
                    mapping_result[spk] = prof.name
                    
                    # Store mapping in meeting_speaker_mappings table for relational integrity
                    mapping_record = models.MeetingSpeakerMapping(
                        meeting_id=meeting_id,
                        raw_speaker_name=spk,
                        user_id=prof.user_id
                    )
                    db.merge(mapping_record)

            db.commit()
            return mapping_result

        except Exception as e:
            logger.error(f"[VoiceService] Error during audio slicing or pgvector matching: {e}", exc_info=True)
            return {}

    finally:
        db.close()
