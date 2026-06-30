from app.pipeline.ingest.adapters.vtt import RawUtterance
from app.pipeline.normalize.pipeline import normalize_utterances
from app.schemas.meeting import MeetingMetadata, SourceType


def test_merge_same_speaker_within_gap():
    raw = [
        RawUtterance(speaker="Alice", start=0.0, end=1.0, text="Hello", raw_text="Hello"),
        RawUtterance(speaker="Alice", start=1.5, end=2.5, text="world", raw_text="world"),
        RawUtterance(speaker="Bob", start=3.0, end=4.0, text="Hi", raw_text="Hi"),
    ]
    metadata = MeetingMetadata(title="Test", source_type=SourceType.VTT, participants=[])
    utterances, metadata = normalize_utterances(raw, metadata)

    assert len(utterances) == 2
    assert utterances[0].speaker == "Alice"
    assert "Hello" in utterances[0].text and "world" in utterances[0].text
    assert utterances[0].id == 0
    assert utterances[1].id == 1
