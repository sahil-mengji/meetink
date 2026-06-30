from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, UploadFile, Form
from pydantic import BaseModel

from app.services import voice_service

router = APIRouter()
logger = logging.getLogger("app.api.voice")
logger.setLevel(logging.INFO)


class EnrollResponse(BaseModel):
    id: str
    user_id: str
    name: str
    status: str


@router.post("/enroll", response_model=EnrollResponse)
async def enroll_voice_profile(user_id: str = Form(...), file: UploadFile = UploadFile(...)):
    logger.info(f"API Request: POST /voice/enroll - Enrolling voice for user {user_id}")
    content = await file.read()
    if not file.filename:
        logger.error("Enrollment failed: No filename provided in request")
        raise HTTPException(status_code=400, detail="Filename required")
    try:
        res = voice_service.enroll_voice(user_id, content, file.filename)
        logger.info(f"Successfully enrolled voice profile for user {user_id}")
        return res
    except ValueError as exc:
        logger.error(f"ValueError during voice enrollment: {exc}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error(f"Error during voice enrollment: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/profiles")
def list_voice_profiles():
    logger.info("API Request: GET /voice/profiles - Listing voice profiles")
    try:
        return voice_service.list_voice_profiles()
    except Exception as exc:
        logger.error(f"Error listing voice profiles: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
