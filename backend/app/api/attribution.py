import uuid
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_db
from app.db import models
from pydantic import BaseModel

router = APIRouter()

class UserCreate(BaseModel):
    name: str
    email: str | None = None

class UserOut(BaseModel):
    id: str
    name: str
    email: str | None = None

class SpeakerMappingRequest(BaseModel):
    # Dict of raw_speaker_name -> user_id
    mappings: Dict[str, str]

@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    """List all registered users in the system."""
    users = db.execute(select(models.User)).scalars().all()
    return users

@router.post("/users", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user manually."""
    db_user = models.User(id=str(uuid.uuid4()), name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/meetings/{meeting_id}/speakers", response_model=List[str])
def get_meeting_speakers(meeting_id: str, db: Session = Depends(get_db)):
    """Extract and return all unique raw speaker names from a meeting's transcript."""
    transcript = db.execute(
        select(models.MeetingTranscript).where(models.MeetingTranscript.meeting_id == meeting_id)
    ).scalar_one_or_none()
    
    if not transcript or not transcript.cleaned_transcript:
        # Fallback to Meeting.participants if transcript not available yet
        meeting = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
        if meeting:
            return meeting.participants
        raise HTTPException(status_code=404, detail="Meeting or transcript not found")
        
    speakers = set()
    for utterance in transcript.cleaned_transcript:
        if "speaker" in utterance:
            speakers.add(utterance["speaker"])
            
    return sorted(list(speakers))

@router.post("/meetings/{meeting_id}/speakers/map")
def map_meeting_speakers(meeting_id: str, body: SpeakerMappingRequest, db: Session = Depends(get_db)):
    """Map raw speaker names (e.g. 'Caller 1') to specific user UUIDs."""
    meeting = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    for raw_name, user_id in body.mappings.items():
        # Check if mapping already exists
        mapping = db.execute(
            select(models.MeetingSpeakerMapping).where(
                models.MeetingSpeakerMapping.meeting_id == meeting_id,
                models.MeetingSpeakerMapping.raw_speaker_name == raw_name
            )
        ).scalar_one_or_none()
        
        if mapping:
            mapping.user_id = user_id
        else:
            mapping = models.MeetingSpeakerMapping(
                meeting_id=meeting_id,
                raw_speaker_name=raw_name,
                user_id=user_id
            )
            db.add(mapping)
            
    db.commit()
    return {"status": "ok", "mapped_count": len(body.mappings)}
