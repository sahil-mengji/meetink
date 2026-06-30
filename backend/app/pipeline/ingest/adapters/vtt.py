from __future__ import annotations

import re
from dataclasses import dataclass

import webvtt

from app.schemas.meeting import MeetingMetadata, SourceType, Utterance


@dataclass
class RawUtterance:
    id: int
    speaker: str
    start: float
    end: float
    text: str
    raw_text: str


_SPEAKER_PREFIX = re.compile(r"^([A-Za-z][A-Za-z0-9 _-]{0,30}):\s*")
_V_TAG = re.compile(r"<v\s+([^>]+)>(.*?)</v>", re.I | re.S)
_OPEN_V_TAG = re.compile(r"^<v\s+([^>]+)>(.*)$", re.I | re.S)


def _ts_to_seconds(ts: str) -> float:
    """Parse a WebVTT timestamp ("HH:MM:SS.mmm" / "MM:SS.mmm") to seconds.

    We parse the string ourselves because webvtt's *_in_seconds truncate to
    whole integer seconds (4.500 -> 4), losing sub-second precision.
    """
    parts = ts.strip().replace(",", ".").split(":")
    try:
        if len(parts) == 3:
            return round(int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2]), 3)
        if len(parts) == 2:
            return round(int(parts[0]) * 60 + float(parts[1]), 3)
        return round(float(parts[0]), 3)
    except (ValueError, IndexError):
        return 0.0


def _parse_speaker_and_text(raw: str) -> tuple[str, str]:
    raw = raw.strip()
    match = _SPEAKER_PREFIX.match(raw)
    if match:
        return match.group(1).strip(), raw[match.end() :].strip()

    v_match = _V_TAG.search(raw)
    if v_match:
        return v_match.group(1).strip(), v_match.group(2).strip()

    open_v = _OPEN_V_TAG.match(raw)
    if open_v:
        return open_v.group(1).strip(), open_v.group(2).strip()

    return "Unknown", raw


def parse_vtt(content: str | bytes, title: str = "VTT Meeting") -> tuple[list[RawUtterance], MeetingMetadata]:
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="replace")

    vtt = webvtt.from_string(content)
    raw_utterances: list[RawUtterance] = []
    participants: set[str] = set()

    for i, cue in enumerate(vtt):
        text = cue.text.replace("\n", " ").strip()
        # Prefer the parsed voice span (<v Speaker>...); webvtt strips the tag
        # from .text and exposes the name via .voice. Fall back to "Speaker:"
        # prefix / leftover inline tags for players that don't populate .voice.
        if getattr(cue, "voice", None):
            speaker = cue.voice.strip()
        else:
            speaker, text = _parse_speaker_and_text(text)
        participants.add(speaker)
        raw_utterances.append(
            RawUtterance(
                id=i,
                speaker=speaker,
                start=_ts_to_seconds(cue.start),
                end=_ts_to_seconds(cue.end),
                text=text,
                raw_text=cue.raw_text or cue.text,
            )
        )

    metadata = MeetingMetadata(
        title=title,
        source_type=SourceType.VTT,
        participants=sorted(participants),
    )
    return raw_utterances, metadata
