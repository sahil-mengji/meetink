from __future__ import annotations

from typing import TypedDict

from app.schemas.meeting import (
    MeetingMetadata,
    MeetingReport,
    SegmentAgentOutput,
    TemporalMention,
    TopicSegment,
    Utterance,
)


class PipelineState(TypedDict):
    meeting_id: str
    metadata: MeetingMetadata
    utterances: list[Utterance]
    segments: list[TopicSegment]
    temporal_mentions: list[TemporalMention]
    segment_outputs: list[SegmentAgentOutput]
    report: MeetingReport | None
    errors: list[str]
