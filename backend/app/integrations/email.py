"""
Email integration.

Sends a formatted meeting-summary email via Resend API (HTTPS).
Falls back to mock mode when RESEND_API_KEY is absent.
"""

from __future__ import annotations

import logging
import os
import textwrap
from collections import defaultdict
from typing import Any

from app.schemas.meeting import ActionItem, MeetingReport

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

RESEND_API_KEY     = os.getenv("RESEND_API_KEY", "re_9Q1Vu5sV_71evXz1bnJXimLzhhPo6hwaC")
RESEND_SENDER_EMAIL = os.getenv("RESEND_SENDER_EMAIL", "onboarding@resend.dev")
DEFAULT_RECIPIENTS = os.getenv("DEFAULT_EMAIL_RECIPIENTS", "sahilanand716@gmail.com")

_MOCK_MODE = not RESEND_API_KEY

_MOCK_COUNTER = 0


# ── Public API ────────────────────────────────────────────────────────────────

def send_meeting_summary(meeting: MeetingReport, custom_recipients: list[str] | None = None) -> dict[str, Any]:
    """
    Send a meeting-summary email to all action-item owners via Resend.

    Returns::

        {"status": "success",      "message_id": "...", "recipients": [...]}
        {"status": "mock_success", "message_id": "...", "recipients": [...]}
        {"status": "failed",       "reason": "..."}
    """
    recipients = custom_recipients if custom_recipients is not None else _collect_recipients(meeting)
    if not recipients:
        return {"status": "failed", "reason": "No recipients found."}

    subject   = f"Meeting Summary: {meeting.meeting_id} ({meeting.generated_at})"
    html_body = _build_html(meeting)

    if _MOCK_MODE:
        return _mock_send(meeting, recipients, subject)

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        actual_recipients = recipients
        if RESEND_SENDER_EMAIL == "onboarding@resend.dev":
            actual_recipients = [DEFAULT_RECIPIENTS or "sahilanand716@gmail.com"]
            logger.info("Resend sandbox detected: overriding recipients %s to verified sandbox address %s", recipients, actual_recipients)

        response = resend.Emails.send({
            "from":    RESEND_SENDER_EMAIL,
            "to":      actual_recipients,
            "subject": subject,
            "html":    html_body,
        })

        message_id = response.get("id", f"resend_{meeting.meeting_id}")
        logger.info("Email sent via Resend. id=%s recipients=%s", message_id, actual_recipients)
        return {
            "status":     "success",
            "message_id": message_id,
            "recipients": recipients,
        }

    except Exception as exc:
        logger.exception("Resend email error")
        return {"status": "failed", "reason": str(exc)}


# ── Body builders ─────────────────────────────────────────────────────────────

def _collect_recipients(meeting: MeetingReport) -> list[str]:
    emails: list[str] = []
    if DEFAULT_RECIPIENTS:
        emails = [e.strip() for e in DEFAULT_RECIPIENTS.split(",") if e.strip()]
    return emails


def _build_html(meeting: MeetingReport) -> str:
    by_owner: dict[str, list[ActionItem]] = defaultdict(list)
    for a in meeting.all_actions:
        by_owner[a.owner].append(a)

    action_rows = ""
    for owner, items in sorted(by_owner.items()):
        for a in items:
            priority_str = getattr(a, "priority", "Medium")
            priority_color = {
                "High": "#dc2626", "Medium": "#d97706", "Low": "#16a34a"
            }.get(priority_str, "#6b7280")
            deadline_str = a.deadline.strftime("%b %d, %Y %H:%M UTC") if a.deadline else "No Deadline"
            action_rows += textwrap.dedent(f"""
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">{owner}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">{a.text}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;
                             color:{priority_color};font-weight:600">{priority_str}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">{deadline_str}</td>
                </tr>
            """)

    decisions_html = "".join(
        f"<li>{d.text} "
        f"<span style='color:#6b7280;font-size:12px'>({d.confidence:.0%} confidence)</span></li>"
        for d in meeting.all_decisions
    )

    risks_html = "".join(
        f"<li><span style='color:#dc2626'>! [{getattr(r, 'severity', 'High' if r.blocker else 'Medium')}]</span> {r.text}</li>"
        for r in meeting.all_risks
    )

    return textwrap.dedent(f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:24px">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:8px;
                  border:1px solid #e5e7eb;overflow:hidden">

        <div style="background:#1e293b;padding:24px 32px">
          <h1 style="color:#fff;margin:0;font-size:20px">Meeting Summary</h1>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:14px">
            {meeting.meeting_id} &middot; {meeting.generated_at}
          </p>
        </div>

        <div style="padding:32px">

          <h2 style="font-size:14px;text-transform:uppercase;color:#6b7280;
                     letter-spacing:.05em;margin-top:0">Summary</h2>
          <p style="color:#374151;line-height:1.6">{meeting.gist}</p>

          {"<h2 style='font-size:14px;text-transform:uppercase;color:#6b7280;"
           "letter-spacing:.05em'>Decisions Made</h2>"
           "<ul style='color:#374151;line-height:1.8'>" + decisions_html + "</ul>"
           if meeting.all_decisions else ""}

          {"" if not meeting.all_actions else f"""
          <h2 style='font-size:14px;text-transform:uppercase;color:#6b7280;
                     letter-spacing:.05em'>Action Items</h2>
          <table style='width:100%;border-collapse:collapse;font-size:14px'>
            <thead>
              <tr style='background:#f1f5f9'>
                <th style='text-align:left;padding:8px 12px;color:#374151'>Owner</th>
                <th style='text-align:left;padding:8px 12px;color:#374151'>Task</th>
                <th style='text-align:left;padding:8px 12px;color:#374151'>Priority</th>
                <th style='text-align:left;padding:8px 12px;color:#374151'>Deadline</th>
              </tr>
            </thead>
            <tbody>{action_rows}</tbody>
          </table>
          """}

          {"<h2 style='font-size:14px;text-transform:uppercase;color:#6b7280;"
           "letter-spacing:.05em;margin-top:24px'>Risks &amp; Blockers</h2>"
           "<ul style='color:#374151;line-height:1.8'>" + risks_html + "</ul>"
           if meeting.all_risks else ""}

        </div>

        <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb">
          <p style="color:#94a3b8;font-size:12px;margin:0">
            Generated by Meeting Intelligence &amp; Action Item Orchestrator
            &middot; Meeting ID: {meeting.meeting_id}
          </p>
        </div>

      </div>
    </body>
    </html>
    """)


def _mock_send(meeting: MeetingReport, recipients: list[str], subject: str) -> dict[str, Any]:
    global _MOCK_COUNTER
    _MOCK_COUNTER += 1
    message_id = f"mock_msg_{_MOCK_COUNTER}"
    logger.info("[MOCK] Sent email '%s' to %s", subject, recipients)
    return {
        "status":     "mock_success",
        "message_id": message_id,
        "recipients": recipients,
    }
