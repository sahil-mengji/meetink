from __future__ import annotations

from app.schemas.meeting import TemporalInterpretation, TemporalMention


def filter_calendar_candidates(
    mentions: list[TemporalMention],
    min_confidence: float = 0.75,
) -> list[TemporalMention]:
    allowed = {
        TemporalInterpretation.SCHEDULED_MEETING,
        TemporalInterpretation.FOLLOW_UP_REMINDER,
    }
    return [
        m
        for m in mentions
        if m.confidence >= min_confidence and m.interpretation in allowed
    ]
