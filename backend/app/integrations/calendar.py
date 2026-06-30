"""
Google Calendar integration.

Creates deadline-reminder events from meeting action items using OAuth 2.0.

Mode selection (automatic):
  credentials.json absent           → mock_success  (demo/CI safe)
  credentials.json present,
    token.json missing              → auth_required  (visit /auth/google)
  both files present and valid      → success        (real Google Calendar event)
"""

from __future__ import annotations

import logging
import os
from datetime import timedelta
from typing import Any

from app.schemas.meeting import ActionItem, MeetingReport
from app.auth.google_oauth import credentials_file_exists, get_calendar_service

logger = logging.getLogger(__name__)

GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")

_MOCK_COUNTER = 0


# ── Public API ────────────────────────────────────────────────────────────────

def create_calendar_event(action_item: ActionItem, meeting: MeetingReport) -> dict[str, Any]:
    """
    Create a Google Calendar event for *action_item*'s deadline.

    Returns::

        {"status": "success",        "event_id": "...", "html_link": "https://..."}
        {"status": "mock_success",   "event_id": "mock_event_N", "html_link": "..."}
        {"status": "auth_required",  "auth_url": "/auth/google"}
        {"status": "failed",         "reason": "..."}
    """
    from app.auth.google_oauth import credentials_file_exists, get_calendar_service

    # No credentials.json → mock mode
    if not credentials_file_exists():
        return _mock_event(action_item)

    # credentials.json present but no valid token → user must authorise
    service = get_calendar_service()
    if service is None:
        logger.info("Calendar: no valid OAuth token — user must visit /auth/google.")
        return {
            "status": "auth_required",
            "message": "Google OAuth not completed. Visit /auth/google to authorise.",
            "auth_url": "/auth/google",
        }

    # Real API call
    if not action_item.deadline:
        return {
            "status": "skipped",
            "reason": "No deadline set on action item — cannot create calendar event.",
        }

    try:
        event_body = _build_event(action_item, meeting)
        created = (
            service.events()
            .insert(
                calendarId=GOOGLE_CALENDAR_ID,
                body=event_body,
                sendUpdates="all",
            )
            .execute()
        )

        event_id = created["id"]
        logger.info("Created Calendar event %s for action %s", event_id, action_item.text[:20])
        return {
            "status": "success",
            "event_id": event_id,
            "html_link": created.get("htmlLink", ""),
        }

    except Exception as exc:
        logger.exception("Google Calendar API error")
        return {"status": "failed", "reason": str(exc)}


def list_calendar_events() -> list[dict[str, Any]]:
    """
    Fetch events from Google Calendar API.
    """
    from app.auth.google_oauth import credentials_file_exists, get_calendar_service
    from datetime import datetime, timedelta

    # Default mock events if no credentials exist
    mock_events = [
        {"id": "cal-1", "title": "🚀 Project Titan: Q3 Architecture Sync", "start": (datetime.utcnow() + timedelta(days=1)).isoformat()[:10] + "T10:00:00", "end": (datetime.utcnow() + timedelta(days=1)).isoformat()[:10] + "T11:00:00", "category": "Work", "attendees": ["Sarah", "Alex", "David", "Elena"]},
        {"id": "cal-2", "title": "💡 Database Migration Review", "start": (datetime.utcnow() + timedelta(days=2)).isoformat()[:10] + "T14:00:00", "end": (datetime.utcnow() + timedelta(days=2)).isoformat()[:10] + "T15:00:00", "category": "Work", "attendees": ["Alex", "DevOps"]}
    ]

    if not credentials_file_exists():
        return mock_events

    service = get_calendar_service()
    if service is None:
        logger.info("Calendar: no valid OAuth token — returning mock data.")
        return mock_events

    try:
        now = datetime.utcnow()
        time_min = (now - timedelta(days=30)).isoformat() + "Z"
        time_max = (now + timedelta(days=60)).isoformat() + "Z"

        result = service.events().list(
            calendarId=GOOGLE_CALENDAR_ID,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        items = result.get("items", [])
        events = []
        for item in items:
            start = item.get("start", {}).get("dateTime") or item.get("start", {}).get("date")
            end = item.get("end", {}).get("dateTime") or item.get("end", {}).get("date")
            attendees = [a.get("email", "").split("@")[0] for a in item.get("attendees", [])] if item.get("attendees") else ["Organizer"]

            events.append({
                "id": item.get("id", "evt-?"),
                "title": item.get("summary", "Untitled Event"),
                "start": start,
                "end": end,
                "category": "Work",
                "attendees": attendees
            })
        return events
    except Exception as exc:
        logger.error("Error fetching Google Calendar events: %s", exc)
        return mock_events


def add_custom_calendar_event(title: str, start_time: str, end_time: str, description: str = "", location: str = "") -> dict[str, Any]:
    from app.auth.google_oauth import credentials_file_exists, get_calendar_service
    import uuid

    if not credentials_file_exists():
        event_id = f"mock_custom_{uuid.uuid4().hex[:8]}"
        logger.info("[MOCK] Created custom Calendar event %s: %s", event_id, title)
        return {"status": "mock_success", "event_id": event_id}

    service = get_calendar_service()
    if service is None:
        return {"status": "auth_required", "auth_url": "/auth/google"}

    try:
        event_body = {
            "summary": title,
            "description": description,
            "location": location,
            "start": {"dateTime": start_time},
            "end": {"dateTime": end_time},
        }
        created = (
            service.events()
            .insert(
                calendarId=GOOGLE_CALENDAR_ID,
                body=event_body,
                sendUpdates="all",
            )
            .execute()
        )
        event_id = created["id"]
        logger.info("Created custom Calendar event %s: %s", event_id, title)
        return {
            "status": "success",
            "event_id": event_id,
            "html_link": created.get("htmlLink", ""),
        }
    except Exception as exc:
        logger.exception("Google Calendar insert error")
        return {"status": "failed", "reason": str(exc)}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_event(action_item: ActionItem, meeting: MeetingReport) -> dict[str, Any]:
    start_dt = action_item.deadline
    end_dt   = start_dt + timedelta(minutes=30)

    description = (
        f"Task: {action_item.text}\n"
        f"Assignee: {action_item.owner or 'Unassigned'}"
    )

    event = {
        "summary": f"[Action] {action_item.text}",
        "description": description,
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "UTC"},
        "end":   {"dateTime": end_dt.isoformat(),   "timeZone": "UTC"},
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email",  "minutes": 60 * 24},
                {"method": "popup",  "minutes": 30},
            ],
        },
        "extendedProperties": {
            "private": {
                "meeting_id": meeting.meeting_id,
                "action_id":  action_item.text[:20],
            }
        },
    }
    return event


def _mock_event(action_item: ActionItem) -> dict[str, Any]:
    global _MOCK_COUNTER
    _MOCK_COUNTER += 1
    event_id = f"mock_event_{_MOCK_COUNTER}"
    logger.info("[MOCK] Created Calendar event %s for action %s", event_id, action_item.text[:20])
    return {
        "status": "mock_success",
        "event_id": event_id,
        "html_link": f"https://calendar.google.com/event?eid={event_id}",
    }
