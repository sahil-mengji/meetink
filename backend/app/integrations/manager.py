"""
Integration Manager.

Orchestrates all external integrations for a meeting export.
Applies confidence filtering and calls only selected integrations.
"""

from __future__ import annotations

import logging
from typing import Any

from app.schemas.meeting import ActionItem, IntegrationOptions, MeetingReport
from app.integrations.linear import create_linear_issue
from app.integrations.calendar import create_calendar_event
from app.integrations.google_tasks import create_google_task
from app.integrations.email import send_meeting_summary

logger = logging.getLogger(__name__)

# Action items below this confidence are not auto-exported; they are flagged
# for human review instead.
CONFIDENCE_THRESHOLD = 0.75


# ── Public API ────────────────────────────────────────────────────────────────

def dispatch_actions(
    meeting: MeetingReport,
    actions: list[ActionItem],
    options: IntegrationOptions,
) -> dict[str, Any]:
    """
    Dispatch a list of **human-approved** action items to selected integrations.

    Unlike `export_meeting`, this accepts the exact list of items the user
    reviewed and approved in the frontend — no confidence filtering applied.

    Returns per-item, per-integration results::

        {
            "meeting_id": "abc123",
            "action_results": {
                "Update Jira board...": {
                    "linear":   {"status": "success", "ticket_id": "MEET-1", "url": "..."},
                    "calendar": {"status": "skipped", "reason": "No deadline"},
                    "tasks":    {"status": "mock_success", "task_id": "mock_1"},
                },
                ...
            },
            "email": {}
        }
    """
    action_results: dict[str, dict[str, Any]] = {}

    for action_item in actions:
        key = action_item.text[:60]
        action_results[key] = _process_action(action_item, meeting, options)

    email_result: dict[str, Any] = {}
    if options.email:
        email_result = _safe_call("email", send_meeting_summary, meeting)

    return {
        "meeting_id": meeting.meeting_id,
        "action_results": action_results,
        "email": email_result,
    }


def export_meeting(
    meeting: MeetingReport,
    options: IntegrationOptions,
) -> dict[str, Any]:
    """
    Export meeting intelligence to selected external services.
    Uses confidence filtering on meeting.all_actions.
    """
    action_results: dict[str, dict[str, Any]] = {}
    skipped: list[str] = []

    for action_item in meeting.all_actions:
        if action_item.confidence < CONFIDENCE_THRESHOLD:
            logger.info(
                "Skipping action %s (confidence %.2f < %.2f)",
                action_item.text[:20],
                action_item.confidence,
                CONFIDENCE_THRESHOLD,
            )
            skipped.append(action_item.text[:20])
            action_results[action_item.text[:20]] = _low_confidence_placeholder(action_item)
            continue

        action_results[action_item.text[:20]] = _process_action(action_item, meeting, options)

    email_result: dict[str, Any] = {}
    if options.email:
        email_result = _safe_call("email", send_meeting_summary, meeting)

    return {
        "meeting_id": meeting.meeting_id,
        "action_results": action_results,
        "email": email_result,
        "skipped_low_confidence": skipped,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _process_action(
    action_item: ActionItem,
    meeting: MeetingReport,
    options: IntegrationOptions,
) -> dict[str, Any]:
    result: dict[str, Any] = {}

    if options.linear:
        result["linear"] = _safe_call(
            "linear", create_linear_issue, action_item, meeting
        )

    if options.calendar:
        result["calendar"] = _safe_call(
            "calendar", create_calendar_event, action_item, meeting
        )

    if options.tasks:
        result["tasks"] = _safe_call(
            "tasks", create_google_task, action_item, meeting
        )

    return result


def _safe_call(integration_name: str, fn, *args, **kwargs) -> dict[str, Any]:
    """Call an integration function; catch all exceptions so one failure
    doesn't abort the rest of the pipeline."""
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.exception("Unexpected failure in %s integration", integration_name)
        return {
            "status": "failed",
            "reason": f"Unexpected error: {exc}",
        }


def _low_confidence_placeholder(action_item: ActionItem) -> dict[str, Any]:
    return {
        "linear": {
            "status": "requires_human_confirmation",
            "reason": (
                f"Confidence {action_item.confidence:.2f} < threshold {CONFIDENCE_THRESHOLD}. "
                "Manually review and re-export."
            ),
        },
        "calendar": {"status": "requires_human_confirmation"},
        "tasks": {"status": "requires_human_confirmation"},
    }
