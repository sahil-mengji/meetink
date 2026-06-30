"""
Google Tasks API integration.

Creates personal tasks from meeting action items using OAuth 2.0.
Reuses the same credentials.json / token.json as Google Calendar.
Falls back to mock mode when credentials.json is absent.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from app.schemas.meeting import ActionItem, MeetingReport
from app.auth.google_oauth import credentials_file_exists, get_tasks_service

logger = logging.getLogger(__name__)

GOOGLE_TASKS_LIST_ID = os.getenv("GOOGLE_TASKS_LIST_ID", "@default")

_MOCK_COUNTER = 0


# ── Public API ────────────────────────────────────────────────────────────────

def create_google_task(action_item: ActionItem, meeting: MeetingReport) -> dict[str, Any]:
    """
    Create a Google Task for *action_item*.

    Returns::

        {"status": "success",      "task_id": "...", "title": "..."}
        {"status": "mock_success", "task_id": "mock_task_N", "title": "..."}
        {"status": "auth_required","auth_url": "/auth/google"}
        {"status": "failed",       "reason": "..."}
    """
    from app.auth.google_oauth import credentials_file_exists, get_tasks_service

    if not credentials_file_exists():
        return _mock_task(action_item)

    service = get_tasks_service()
    if service is None:
        return {
            "status":  "auth_required",
            "message": "Google OAuth not completed. Visit /auth/google to authorise.",
            "auth_url": "/auth/google",
        }

    try:
        task_body = _build_task(action_item, meeting)
        created = (
            service.tasks()
            .insert(tasklist=GOOGLE_TASKS_LIST_ID, body=task_body)
            .execute()
        )

        task_id = created["id"]
        logger.info("Created Google Task %s for action %s", task_id, action_item.text[:20])
        return {
            "status":  "success",
            "task_id": task_id,
            "title":   created.get("title", ""),
        }

    except Exception as exc:
        logger.exception("Google Tasks error")
        return {"status": "failed", "reason": str(exc)}


def list_google_tasks() -> list[dict[str, Any]]:
    """
    Fetch recent tasks from Google Tasks API.
    """
    from app.auth.google_oauth import credentials_file_exists, get_tasks_service

    if not credentials_file_exists():
        return [
            {"id": "GT-101", "task": "Mock: Notify marketing team about revised timeline", "owner": "Sarah", "dueDate": "Today", "status": "To Do", "platform": "Google Tasks", "priority": "Medium"},
            {"id": "GT-102", "task": "Mock: Verify OAuth 2.0 refresh token rotation", "owner": "Alex", "dueDate": "Friday", "status": "To Do", "platform": "Google Tasks", "priority": "High"}
        ]

    service = get_tasks_service()
    if service is None:
        logger.info("Tasks: no valid OAuth token — returning mock data.")
        return [
            {"id": "GT-101", "task": "Auth Needed: Notify marketing team about revised timeline", "owner": "Sarah", "dueDate": "Today", "status": "To Do", "platform": "Google Tasks", "priority": "Medium"}
        ]

    try:
        result = service.tasks().list(tasklist=GOOGLE_TASKS_LIST_ID, showCompleted=False).execute()
        items = result.get('items', [])
        tasks = []
        for item in items:
            due = item.get('due')
            due_str = due[:10] if due else "No Date"
            tasks.append({
                "id": item.get("id", "GT-?")[:12],
                "task": item.get("title", "Untitled"),
                "owner": "Unassigned",  # Google Tasks don't have distinct owners in personal lists
                "dueDate": due_str,
                "status": "To Do",
                "platform": "Google Tasks",
                "priority": "Medium"
            })
        return tasks
    except Exception as exc:
        logger.error("Error fetching Google Tasks: %s", exc)
        return []

# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_task(action_item: ActionItem, meeting: MeetingReport) -> dict[str, Any]:
    notes = (
        f"Task: {action_item.text}\n"
        f"Assignee: {action_item.owner or 'Unassigned'}"
    )

    task_body: dict[str, Any] = {
        "title":  action_item.text,
        "notes":  notes,
        "status": "needsAction",
    }

    # Google Tasks due format: RFC 3339 (time portion ignored)
    if action_item.deadline:
        task_body["due"] = action_item.deadline.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    return task_body


def _mock_task(action_item: ActionItem) -> dict[str, Any]:
    global _MOCK_COUNTER
    _MOCK_COUNTER += 1
    task_id = f"mock_task_{_MOCK_COUNTER}"
    logger.info("[MOCK] Created Google Task %s for action %s", task_id, action_item.text[:20])
    return {
        "status":  "mock_success",
        "task_id": task_id,
        "title":   f"{action_item.text}",
    }
