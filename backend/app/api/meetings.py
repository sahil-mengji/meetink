from __future__ import annotations

import uuid
import logging
from fastapi import APIRouter, HTTPException, UploadFile, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db import models
from app.services import meeting_service

router = APIRouter()
logger = logging.getLogger("app.api.meetings")
logger.setLevel(logging.INFO)


class UploadResponse(BaseModel):
    meeting_id: str
    filename: str
    speakers: list[str]


class AbsenteeRecapRequest(BaseModel):
    invited: list[str]
    attended: list[str]


class CreateUserRequest(BaseModel):
    name: str
    email: str | None = None


class UpdateUserRequest(BaseModel):
    name: str | None = None
    email: str | None = None


class SpeakerMappingRequest(BaseModel):
    mappings: dict[str, str]  # raw_speaker_name -> user_id


class ShareRequest(BaseModel):
    emails: list[str]


class DispatchRequest(BaseModel):
    action_items: list[dict]
    options: dict


@router.get("")
def list_meetings():
    logger.info("API Request: GET /meetings - Listing all meetings")
    return meeting_service.list_meetings()


@router.get("/groups")
def list_groups():
    logger.info("API Request: GET /meetings/groups - Listing knowledge groups")
    from app.services import group_service
    return group_service.list_groups()


@router.get("/users")
def list_users():
    logger.info("API Request: GET /meetings/users - Listing users")
    db: Session = SessionLocal()
    try:
        users = db.execute(select(models.User)).scalars().all()
        return [{"id": u.id, "name": u.name, "email": u.email} for u in users]
    finally:
        db.close()


@router.post("/users")
def create_user(body: CreateUserRequest):
    logger.info(f"API Request: POST /meetings/users - Creating user {body.name}")
    db: Session = SessionLocal()
    try:
        user = models.User(id=str(uuid.uuid4()), name=body.name, email=body.email)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Successfully created user {user.id} ({user.name})")
        return {"id": user.id, "name": user.name, "email": user.email}
    finally:
        db.close()


@router.put("/users/{user_id}")
def update_user(user_id: str, body: UpdateUserRequest):
    logger.info(f"API Request: PUT /meetings/users/{user_id} - Updating user")
    db: Session = SessionLocal()
    try:
        user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if body.name is not None:
            user.name = body.name
        if body.email is not None:
            user.email = body.email
        db.commit()
        db.refresh(user)
        logger.info(f"Successfully updated user {user.id}")
        return {"id": user.id, "name": user.name, "email": user.email}
    finally:
        db.close()


@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    logger.info(f"API Request: DELETE /meetings/users/{user_id} - Deleting user")
    db: Session = SessionLocal()
    try:
        user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        logger.info(f"Successfully deleted user {user_id}")
        return {"status": "deleted", "id": user_id}
    finally:
        db.close()


@router.post("/upload", response_model=UploadResponse)
async def upload_meeting(
    file: UploadFile,
    attachments: list[UploadFile] = None
) -> UploadResponse:
    logger.info(f"API Request: POST /meetings/upload - Receiving file {file.filename}")
    content = await file.read()
    
    attachment_files = []
    if attachments:
        for att in attachments:
            if att.filename:
                att_content = await att.read()
                attachment_files.append((att.filename, att_content))

    if not file.filename:
        logger.error("Upload failed: No filename provided in request")
        raise HTTPException(status_code=400, detail="Filename required")
    try:
        meeting_id, filename, speakers, _atts = meeting_service.upload_meeting_with_files(content, file.filename, attachment_files)
        logger.info(f"Upload successful: meeting_id={meeting_id}, filename={filename}, speakers={speakers}")
        return UploadResponse(meeting_id=meeting_id, filename=filename, speakers=speakers)
    except Exception as exc:
        logger.error(f"Error during file upload: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/{meeting_id}/speaker-mappings")
def map_speakers(meeting_id: str, body: SpeakerMappingRequest):
    logger.info(f"API Request: POST /meetings/{meeting_id}/speaker-mappings - Mappings: {body.mappings}")
    db: Session = SessionLocal()
    try:
        for raw_spk, user_id in body.mappings.items():
            mapping = models.MeetingSpeakerMapping(
                meeting_id=meeting_id,
                raw_speaker_name=raw_spk,
                user_id=user_id
            )
            db.merge(mapping)
        db.commit()
        logger.info(f"Successfully mapped speakers for meeting {meeting_id}")
        return {"status": "ok"}
    except Exception as exc:
        logger.error(f"Error mapping speakers for meeting {meeting_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        db.close()


@router.post("/{meeting_id}/process")
async def process_meeting(meeting_id: str):
    logger.info(f"API Request: POST /meetings/{meeting_id}/process - Starting LangGraph pipeline")
    try:
        res = await meeting_service.process_meeting(meeting_id)
        logger.info(f"Pipeline processing completed successfully for meeting {meeting_id}")
        return res
    except ValueError as exc:
        logger.error(f"ValueError processing meeting {meeting_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except NotImplementedError as exc:
        logger.error(f"NotImplementedError processing meeting {meeting_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except Exception as exc:
        logger.error(f"Unhandled Exception processing meeting {meeting_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{meeting_id}")
def get_meeting(meeting_id: str):
    logger.info(f"API Request: GET /meetings/{meeting_id} - Fetching meeting details")
    try:
        meeting = meeting_service.get_meeting(meeting_id)
        if not meeting:
            logger.warning(f"Meeting {meeting_id} not found in database")
            raise HTTPException(status_code=404, detail="Meeting not found")
        logger.info(f"Successfully retrieved meeting details for {meeting_id}")
        return meeting
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving meeting {meeting_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{meeting_id}/traces")
def get_traces(meeting_id: str):
    """Returns all workflow traces committed so far for a meeting.
    Polled by the frontend every ~800ms during active pipeline processing
    to drive the real-time flow diagram and step output terminal."""
    db: Session = SessionLocal()
    try:
        meeting = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        traces = db.execute(
            select(models.MeetingWorkflowTrace)
            .where(models.MeetingWorkflowTrace.meeting_id == meeting_id)
            .order_by(models.MeetingWorkflowTrace.created_at.asc())
        ).scalars().all()
        return {
            "meeting_id": meeting_id,
            "status": meeting.status,
            "traces": [
                {
                    "id": t.id,
                    "step_name": t.step_name,
                    "status": t.status,
                    "input_summary": t.input_summary,
                    "output_summary": t.output_summary,
                    "output_data": t.output_data,
                    "execution_time_ms": t.execution_time_ms,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                }
                for t in traces
            ],
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error fetching traces for {meeting_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        db.close()


@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: str):
    logger.info(f"API Request: DELETE /meetings/{meeting_id} - Deleting meeting")
    try:
        success = meeting_service.delete_meeting(meeting_id)
        if not success:
            logger.warning(f"Deletion failed: Meeting {meeting_id} not found")
            raise HTTPException(status_code=404, detail="Meeting not found")
        logger.info(f"Successfully deleted meeting {meeting_id}")
        return {"status": "deleted", "id": meeting_id}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error deleting meeting {meeting_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{meeting_id}/report")
def get_report(meeting_id: str, format: str = "json"):
    result = meeting_service.get_report(meeting_id, format)
    if result is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if isinstance(result, str):
        return PlainTextResponse(result)
    return result


@router.post("/{meeting_id}/share")
def share_meeting(meeting_id: str, body: ShareRequest):
    from app.integrations.email import send_meeting_summary
    report = meeting_service.get_report(meeting_id, fmt="model")
    if not report:
        raise HTTPException(status_code=404, detail="Meeting report not found")
    
    result = send_meeting_summary(report, custom_recipients=body.emails)
    if result.get("status") == "failed":
        raise HTTPException(status_code=500, detail=result.get("reason"))
    return {"status": "success", "result": result}


@router.post("/{meeting_id}/dispatch")
def dispatch_integrations(meeting_id: str, body: DispatchRequest):
    logger.info(f"API Request: POST /meetings/{meeting_id}/dispatch")
    from app.integrations.manager import dispatch_actions
    from app.schemas.meeting import ActionItem, IntegrationOptions, IdentifiedByAgent, MeetingReport
    from datetime import datetime

    # Build a lightweight MeetingReport for context (needed by integration description builders)
    report = meeting_service.get_report(meeting_id, fmt="model")
    if not report:
        raise HTTPException(status_code=404, detail="Meeting report not found")

    # Build ActionItem models from the human-approved list sent by the frontend
    approved_actions: list[ActionItem] = []
    for item in body.action_items:
        parsed_deadline = None
        if item.get("deadline"):
            try:
                parsed_deadline = datetime.fromisoformat(str(item["deadline"]).replace("Z", "+00:00"))
            except Exception:
                pass

        parsed_uids = []
        for uid in (item.get("source_utterance_ids") or []):
            try:
                parsed_uids.append(int(uid))
            except (ValueError, TypeError):
                pass
        if not parsed_uids:
            parsed_uids = [0]

        approved_actions.append(ActionItem(
            text=item.get("text", "Untitled Action"),
            owner=item.get("owner"),
            deadline=parsed_deadline,
            confidence=float(item.get("confidence", 0.8)),
            source_utterance_ids=parsed_uids,
            identified_by_agent=IdentifiedByAgent.ACTION_ITEM,
            source_doc_refs=list(item.get("source_doc_refs") or []),
            source_key_moment_ids=list(item.get("source_key_moment_ids") or []),
        ))

    opts = IntegrationOptions(**body.options)
    result = dispatch_actions(report, approved_actions, opts)

    logger.info(f"Dispatch completed for {meeting_id}: {len(approved_actions)} items to {sum([opts.linear, opts.calendar, opts.tasks, opts.email])} integrations")
    return {"status": "success", "result": result}


@router.post("/{meeting_id}/dispatch-summaries")
def dispatch_summaries_to_participants(meeting_id: str):
    logger.info(f"API Request: POST /meetings/{meeting_id}/dispatch-summaries")
    db: Session = SessionLocal()
    try:
        meeting = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
            
        participants = meeting.participants or []
        report = meeting_service.get_report(meeting_id, fmt="model")
        
        dispatched = []
        from app.integrations.email import send_meeting_summary
        
        for p_name in participants:
            user = db.execute(select(models.User).where(models.User.name == p_name)).scalar_one_or_none()
            email = user.email if user and user.email else f"{p_name.lower().replace(' ', '.')}@company.com"
            if report:
                send_meeting_summary(report, custom_recipients=[email])
            dispatched.append({
                "participant": p_name,
                "email": email,
                "status": "Sent"
            })
            
        return {"status": "SUCCESS", "dispatched": dispatched}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error dispatching summaries for {meeting_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        db.close()

