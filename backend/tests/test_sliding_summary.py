import os

import pytest

from app.pipeline.agents import summarization_agent
from app.pipeline.agents.context import SegmentExtractionContext, build_segment_context
from app.config import get_settings
from app.schemas.meeting import MeetingMetadata, TopicSegment, Utterance


@pytest.mark.asyncio
async def test_sliding_window_summary_multiple_windows(monkeypatch):
    monkeypatch.setenv("SUMMARY_WINDOW_TOKENS", "30")
    get_settings.cache_clear()

    utterances = [
        Utterance(id=i, speaker="Alice", start=float(i), end=float(i + 1), text=f"Point {i} " * 5, raw_text=f"Point {i}")
        for i in range(20)
    ]
    segment = TopicSegment(title="Long Topic", utterance_ids=[u.id for u in utterances], confidence=0.8)
    metadata = MeetingMetadata(title="Test", participants=["Alice"])
    ctx = build_segment_context("m1", metadata, segment, utterances, [])

    output = await summarization_agent.run(ctx)
    assert output.summary
    assert len(output.summary) > 0

    get_settings.cache_clear()
