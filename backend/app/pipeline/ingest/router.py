from __future__ import annotations

from pathlib import Path

from app.pipeline.ingest.adapters.audio import AudioTranscriptAdapter
from app.pipeline.ingest.adapters.plain_text import parse_plain_text
from app.pipeline.ingest.adapters.vtt import RawUtterance, parse_vtt
from app.schemas.meeting import MeetingMetadata, SourceType


AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac"}
VTT_EXTENSIONS = {".vtt"}
TEXT_EXTENSIONS = {".txt", ".text"}


def detect_source_type(filename: str) -> SourceType:
    ext = Path(filename).suffix.lower()
    if ext in VTT_EXTENSIONS:
        return SourceType.VTT
    if ext in TEXT_EXTENSIONS:
        return SourceType.PLAIN_TEXT
    if ext in AUDIO_EXTENSIONS:
        return SourceType.AUDIO
    raise ValueError(f"Unsupported file type: {ext or '(no extension)'}")


def ingest_file(content: bytes, filename: str, title: str | None = None) -> tuple[list[RawUtterance], MeetingMetadata]:
    meeting_title = title or Path(filename).stem.replace("_", " ").title()
    source_type = detect_source_type(filename)

    if source_type == SourceType.VTT:
        return parse_vtt(content, title=meeting_title)
    if source_type == SourceType.PLAIN_TEXT:
        return parse_plain_text(content, title=meeting_title)
    if source_type == SourceType.AUDIO:
        adapter = AudioTranscriptAdapter()
        # Skeleton: audio path requires file on disk; API layer writes temp file if needed
        raise NotImplementedError(
            "Audio upload detected but STT is not implemented. Use .vtt or .txt."
        )
    raise ValueError(f"Cannot ingest {filename}")
