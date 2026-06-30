from pathlib import Path

import pytest

from app.pipeline.orchestrator.graph import run_pipeline

SAMPLE = Path(__file__).resolve().parents[1] / "samples" / "sprint_sync.vtt"


@pytest.mark.asyncio
async def test_e2e_pipeline_on_sample_vtt():
    content = SAMPLE.read_bytes()
    meeting = await run_pipeline("test-meeting-e2e", content, "sprint_sync.vtt")

    assert meeting.report is not None
    report = meeting.report
    assert len(report.topics) >= 2
    assert len(report.all_actions) >= 1

    for action in report.all_actions:
        assert action.source_utterance_ids

    tuesday_mentions = [m for m in report.temporal_mentions if "tuesday" in m.raw_text.lower()]
    assert tuesday_mentions
