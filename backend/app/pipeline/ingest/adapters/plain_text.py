from __future__ import annotations

import re
from dataclasses import dataclass

from app.pipeline.ingest.adapters.vtt import RawUtterance
from app.schemas.meeting import MeetingMetadata, SourceType

_SPEAKER_LINE = re.compile(r"^([A-Za-z][A-Za-z0-9 _-]{0,30}):\s*(.+)$")
# Optional leading [hh:mm:ss] or (mm:ss) timestamp, e.g. "[00:01:02] Alice: hi".
_LEADING_TS = re.compile(r"^[\[(]\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?)\s*[\])]\s*(.*)$")


def _ts_to_seconds(ts: str) -> float:
    parts = ts.replace(",", ".").split(":")
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
        if len(parts) == 2:
            return int(parts[0]) * 60 + float(parts[1])
        return float(parts[0])
    except ValueError:
        return 0.0


def parse_plain_text(content: str | bytes, title: str = "Text Meeting") -> tuple[list[RawUtterance], MeetingMetadata]:
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="replace")

    lines = [ln.strip() for ln in content.splitlines() if ln.strip()]
    raw_utterances: list[RawUtterance] = []
    participants: set[str] = set()
    current_time = 0.0
    duration = 2.0

    for line in lines:
        rest = line
        explicit_start: float | None = None
        ts_match = _LEADING_TS.match(line)
        if ts_match:
            explicit_start = _ts_to_seconds(ts_match.group(1))
            rest = ts_match.group(2).strip()

        match = _SPEAKER_LINE.match(rest)
        if match:
            speaker = match.group(1).strip()
            text = match.group(2).strip()
        else:
            speaker = "Unknown"
            text = rest

        if not text:
            continue

        # Prefer a real timestamp when present; otherwise assign synthetic time.
        start = explicit_start if explicit_start is not None else current_time
        participants.add(speaker)
        raw_utterances.append(
            RawUtterance(
                speaker=speaker,
                start=start,
                end=start + duration,
                text=text,
                raw_text=line,
            )
        )
        current_time = max(current_time, start) + duration

    metadata = MeetingMetadata(
        title=title,
        source_type=SourceType.PLAIN_TEXT,
        participants=sorted(participants),
    )
    return raw_utterances, metadata
