from pathlib import Path

import pytest

from app.pipeline.ingest.adapters.vtt import parse_vtt
from app.pipeline.normalize.pipeline import normalize_utterances

SAMPLE = Path(__file__).resolve().parents[1] / "samples" / "sprint_sync.vtt"


def test_vtt_parse_speakers_and_count():
    content = SAMPLE.read_bytes()
    raw, metadata = parse_vtt(content, title="Sprint Sync")
    utterances, metadata = normalize_utterances(raw, metadata)

    speakers = set(metadata.participants)
    assert "Alice" in speakers
    assert "Bob" in speakers
    assert "Carol" in speakers
    assert len(utterances) >= 15
