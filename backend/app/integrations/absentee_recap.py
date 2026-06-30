from __future__ import annotations

from app.schemas.meeting import MeetingReport


def generate_recap(invited: list[str], attended: list[str], report: MeetingReport) -> str:
    absentees = sorted(set(invited) - set(attended))
    if not absentees:
        return "All invited participants attended."

    lines = [
        "Absentee Recap",
        f"Meeting: {report.meeting_id}",
        f"Absent: {', '.join(absentees)}",
        "",
        report.gist,
        "",
        "Key actions:",
    ]
    for action in report.all_actions[:5]:
        owner = action.owner or "Unassigned"
        lines.append(f"- {action.text} ({owner})")
    return "\n".join(lines)
