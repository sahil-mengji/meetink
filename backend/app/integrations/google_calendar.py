from __future__ import annotations

from app.schemas.meeting import TemporalMention


def create_events(candidates: list[TemporalMention]) -> list[dict]:
    events = []
    for i, candidate in enumerate(candidates):
        events.append(
            {
                "event_id": f"stub-gcal-{i}",
                "title": f"Meeting follow-up: {candidate.raw_text}",
                "start": candidate.resolved_datetime.isoformat() if candidate.resolved_datetime else None,
            }
        )
    return events
