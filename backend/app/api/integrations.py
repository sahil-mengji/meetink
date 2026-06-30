import logging
from fastapi import APIRouter, HTTPException
from app.integrations.calendar import list_calendar_events
from app.integrations.google_tasks import list_google_tasks
from app.integrations.linear import list_linear_issues

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/calendar")
def get_calendar_events():
    logger.info("API Request: GET /integrations/calendar - Listing events")
    try:
        return list_calendar_events()
    except Exception as exc:
        logger.error(f"Error listing calendar events: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/tasks")
def get_google_tasks():
    logger.info("API Request: GET /integrations/tasks - Listing tasks")
    try:
        return list_google_tasks()
    except Exception as exc:
        logger.error(f"Error listing google tasks: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/linear")
def get_linear_issues():
    logger.info("API Request: GET /integrations/linear - Listing issues")
    try:
        return list_linear_issues()
    except Exception as exc:
        logger.error(f"Error listing linear issues: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


from pydantic import BaseModel

class CreateCalendarEventRequest(BaseModel):
    title: str
    start: str
    end: str
    description: str = ""
    location: str = ""


@router.post("/calendar")
def add_calendar_event(body: CreateCalendarEventRequest):
    logger.info(f"API Request: POST /integrations/calendar - Adding event {body.title}")
    from app.integrations.calendar import add_custom_calendar_event
    try:
        res = add_custom_calendar_event(
            title=body.title,
            start_time=body.start,
            end_time=body.end,
            description=body.description,
            location=body.location
        )
        if res.get("status") == "failed":
            raise HTTPException(status_code=500, detail=res.get("reason"))
        return res
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error adding calendar event: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
