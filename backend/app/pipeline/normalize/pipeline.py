from __future__ import annotations

from app.pipeline.ingest.adapters.vtt import RawUtterance
from app.pipeline.normalize.preprocess import preprocess
from app.schemas.meeting import MeetingMetadata, Utterance


def normalize_utterances(
    raw_utterances: list[RawUtterance],
    metadata: MeetingMetadata,
    merge_gap_seconds: float = 2.0,
) -> tuple[list[Utterance], MeetingMetadata]:
    raw_utterances, p_map = preprocess(raw_utterances)
    sorted_raw = sorted(raw_utterances, key=lambda u: u.start)
    grouped: list[list[RawUtterance]] = []

    for raw in sorted_raw:
        # Light-merge consecutive turns from the SAME, KNOWN speaker within a
        # small gap. We never merge across "Unknown" speakers.
        known_speaker = bool(raw.speaker) and raw.speaker != "Unknown"
        if (
            grouped
            and known_speaker
            and grouped[-1][-1].speaker == raw.speaker
            and raw.start - grouped[-1][-1].end < merge_gap_seconds
        ):
            grouped[-1].append(raw)
        else:
            grouped.append([raw])

    utterances = []
    for i, group in enumerate(grouped):
        first = group[0]
        last = group[-1]
        text = " ".join(r.text for r in group).strip()
        raw_text = "\n".join(r.raw_text for r in group)
        source_ids = tuple(r.id for r in group)
        
        utterances.append(Utterance(
            id=source_ids,
            speaker=first.speaker,
            start=first.start,
            end=last.end,
            text=text,
            raw_text=raw_text,
        ))

    participants = sorted({u.speaker for u in utterances if u.speaker != "Unknown"})
    
    # Merge any newly discovered participant_map items, favoring existing ones
    combined_map = metadata.participant_map.copy()
    for k, v in p_map.items():
        if k not in combined_map:
            combined_map[k] = v

    updated_metadata = metadata.model_copy(update={
        "participants": participants,
        "participant_map": combined_map
    })
    return utterances, updated_metadata
