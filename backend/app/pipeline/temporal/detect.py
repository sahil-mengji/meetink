from __future__ import annotations

import re
from datetime import datetime

import dateparser

from app.schemas.meeting import TemporalMention, Utterance

_DATE_PATTERNS = [
    re.compile(p, re.I)
    for p in (
        r"\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
        r"\bby\s+(monday|tuesday|wednesday|thursday|friday|eod|end of day)\b",
        r"\b(monday|tuesday|wednesday|thursday|friday)\s+at\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b",
        r"\beod\b",
        r"\bend of (the )?week\b",
        r"\b\d{1,2}/\d{1,2}(?:/\d{2,4})?\b",
    )
]


def _find_mentions_in_text(text: str) -> list[str]:
    found: list[str] = []
    for pattern in _DATE_PATTERNS:
        for match in pattern.finditer(text):
            found.append(match.group(0))
    return found


def detect_temporal_mentions(
    utterances: list[Utterance],
    anchor: datetime | None = None,
) -> list[TemporalMention]:
    mentions: list[TemporalMention] = []
    anchor = anchor or datetime.utcnow()

    for u in utterances:
        hits = _find_mentions_in_text(u.text)
        if not hits:
            # dateparser fallback on full utterance
            parsed = dateparser.parse(u.text, settings={"RELATIVE_BASE": anchor})
            if parsed and any(w in u.text.lower() for w in ("today", "tomorrow", "tuesday", "monday", "friday", "week")):
                hits = [u.text]

        for hit in hits:
            parsed_candidate = hit
            resolved = dateparser.parse(hit, settings={"RELATIVE_BASE": anchor})
            mentions.append(
                TemporalMention(
                    utterance_id=u.id,
                    raw_text=hit,
                    parsed_candidate=parsed_candidate,
                    resolved_datetime=resolved,
                    confidence=0.6 if resolved else 0.4,
                )
            )
    return mentions
