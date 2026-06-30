from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.meeting import (
    MeetingMetadata,
    TemporalMention,
    TopicSegment,
    Utterance,
)


class SegmentExtractionContext(BaseModel):
    model_config = ConfigDict(strict=True)

    meeting_id: str
    meeting_title: str
    recorded_at: datetime | None
    participants: list[str]
    topic: TopicSegment
    utterances: list[Utterance]
    temporal_hints: list[TemporalMention]
    prior_topic_titles: list[str]
    transcript_excerpt: str
    running_summary: str | None = None


def render_transcript(utterances: list[Utterance]) -> str:
    return "\n".join(f"{u.speaker}: {u.text}" for u in utterances)


def build_segment_context(
    meeting_id: str,
    metadata: MeetingMetadata,
    segment: TopicSegment,
    all_utterances: list[Utterance],
    temporal_mentions: list[TemporalMention],
    prior_topic_titles: list[str] | None = None,
    running_summary: str | None = None,
) -> SegmentExtractionContext:
    raw_to_u = {}
    for u in all_utterances:
        for rid in u.id:
            raw_to_u[rid] = u

    segment_utts = []
    segment_id_set = set()
    for uid in segment.utterance_ids:
        if uid in raw_to_u:
            u = raw_to_u[uid]
            if u.id not in segment_id_set:
                segment_id_set.add(u.id)
                segment_utts.append(u)
    hints = [m for m in temporal_mentions if m.utterance_id in segment_id_set]

    return SegmentExtractionContext(
        meeting_id=meeting_id,
        meeting_title=metadata.title,
        recorded_at=metadata.recorded_at,
        participants=metadata.participants,
        topic=segment,
        utterances=segment_utts,
        temporal_hints=hints,
        prior_topic_titles=prior_topic_titles or [],
        transcript_excerpt=render_transcript(segment_utts),
        running_summary=running_summary,
    )
