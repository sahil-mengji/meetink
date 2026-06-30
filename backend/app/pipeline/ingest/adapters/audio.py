from __future__ import annotations

from app.pipeline.ingest.adapters.vtt import RawUtterance
from app.schemas.meeting import MeetingMetadata, SourceType


class AudioTranscriptAdapter:
    """Future: speech-to-text → utterances with timestamps.

    Wire Whisper / cloud STT here. Output must match VTT adapter shape
    (list of RawUtterance + MeetingMetadata) for normalize pipeline.
    """

    def transcribe(self, file_path: str, title: str = "Audio Meeting") -> tuple[list[RawUtterance], MeetingMetadata]:
        raise NotImplementedError(
            "Audio STT is not implemented. Upload a .vtt or .txt transcript for MVP."
        )

    @staticmethod
    def metadata_stub(title: str) -> MeetingMetadata:
        return MeetingMetadata(title=title, source_type=SourceType.AUDIO, participants=[])
