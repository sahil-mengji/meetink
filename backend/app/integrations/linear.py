"""
Linear API integration (replaces Jira).

Creates Linear issues from meeting action items using Linear's GraphQL API.
Falls back to mock mode if LINEAR_API_KEY or LINEAR_TEAM_ID are absent.
"""

from __future__ import annotations

import os
import logging
from typing import Any

import httpx

from app.schemas.meeting import ActionItem, MeetingReport

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

LINEAR_API_KEY = os.getenv("LINEAR_API_KEY", "")
LINEAR_TEAM_ID = os.getenv("LINEAR_TEAM_ID", "")

_MOCK_MODE = not (LINEAR_API_KEY and LINEAR_TEAM_ID)

_PRIORITY_MAP = {
    "high":   2,  # Linear: 1=urgent, 2=high, 3=medium, 4=low
    "medium": 3,
    "low":    4,
}

_MOCK_COUNTER = 0

LINEAR_API_URL = "https://api.linear.app/graphql"


# ── Public API ────────────────────────────────────────────────────────────────

def create_linear_issue(action_item: ActionItem, meeting: MeetingReport) -> dict[str, Any]:
    """
    Create a Linear issue for *action_item*.

    Returns::

        {"status": "success",      "ticket_id": "MEET-123", "url": "https://..."}
        {"status": "mock_success", "ticket_id": "DEMO-1",   "url": "https://..."}
        {"status": "failed",       "reason": "..."}
    """
    if _MOCK_MODE:
        return _mock_ticket(action_item)

    try:
        priority = 3  # Default to medium — ActionItem schema has no priority field
        due_date = action_item.deadline.date().isoformat() if action_item.deadline else None

        description = (
            f"**Task:** {action_item.text}\n"
            f"**Assignee:** {action_item.owner or 'Unassigned'}"
        )

        mutation = """
        mutation CreateIssue($input: IssueCreateInput!) {
            issueCreate(input: $input) {
                success
                issue {
                    id
                    identifier
                    url
                }
            }
        }
        """

        issue_input: dict = {
            "teamId":      LINEAR_TEAM_ID,
            "title":       action_item.text,
            "description": description,
            "priority":    priority,
        }
        if due_date:
            issue_input["dueDate"] = due_date

        variables = {"input": issue_input}

        response = httpx.post(
            LINEAR_API_URL,
            json={"query": mutation, "variables": variables},
            headers={
                "Authorization": LINEAR_API_KEY,
                "Content-Type":  "application/json",
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            return {"status": "failed", "reason": str(data["errors"])}

        issue = data["data"]["issueCreate"]["issue"]
        return {
            "status":    "success",
            "ticket_id": issue["identifier"],
            "url":       issue["url"],
        }

    except httpx.HTTPStatusError as exc:
        logger.error("Linear HTTP error %s: %s", exc.response.status_code, exc.response.text)
        return {
            "status": "failed",
            "reason": f"HTTP {exc.response.status_code}: {exc.response.text[:200]}",
        }
    except Exception as exc:
        logger.exception("Unexpected Linear error")
        return {"status": "failed", "reason": str(exc)}


def list_linear_issues() -> list[dict[str, Any]]:
    """
    Fetch recent issues from Linear using GraphQL API.
    """
    if _MOCK_MODE:
        return [
            {"id": "LIN-101", "task": "Mock: Review PostgreSQL 16 migration guide", "owner": "Alex", "dueDate": "Next Week", "status": "In Progress", "platform": "Linear", "priority": "High"},
            {"id": "LIN-102", "task": "Mock: Implement vector extension in SQLAlchemy", "owner": "Sarah", "dueDate": "Tomorrow", "status": "To Do", "platform": "Linear", "priority": "Medium"}
        ]

    query = """
    query {
      issues(first: 30, orderBy: updatedAt) {
        nodes {
          id
          identifier
          title
          state { name }
          priority
          dueDate
          assignee { name }
        }
      }
    }
    """
    try:
        response = httpx.post(
            LINEAR_API_URL,
            json={"query": query},
            headers={
                "Authorization": LINEAR_API_KEY,
                "Content-Type":  "application/json",
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            logger.error("Linear GraphQL error: %s", data["errors"])
            return []

        nodes = data.get("data", {}).get("issues", {}).get("nodes", [])
        issues = []
        for node in nodes:
            state_name = node.get("state", {}).get("name", "To Do") if node.get("state") else "To Do"
            assignee = node.get("assignee", {}).get("name", "Unassigned") if node.get("assignee") else "Unassigned"
            p_val = node.get("priority", 0)
            priority_str = "High" if p_val in (1, 2) else "Medium" if p_val == 3 else "Low"

            issues.append({
                "id": node.get("identifier", "LIN-?"),
                "task": node.get("title", "Untitled"),
                "owner": assignee,
                "dueDate": node.get("dueDate") or "No Date",
                "status": state_name,
                "platform": "Linear",
                "priority": priority_str
            })
        return issues
    except Exception as exc:
        logger.error("Error fetching Linear issues: %s", exc)
        return []

# ── Helpers ───────────────────────────────────────────────────────────────────

def _mock_ticket(action_item: ActionItem) -> dict[str, Any]:
    global _MOCK_COUNTER
    _MOCK_COUNTER += 1
    ticket_id = f"DEMO-{_MOCK_COUNTER}"
    logger.info("[MOCK] Created Linear issue %s for action %s", ticket_id, action_item.text[:20])
    return {
        "status":    "mock_success",
        "ticket_id": ticket_id,
        "url":       f"https://linear.app/demo/issue/{ticket_id}",
    }
