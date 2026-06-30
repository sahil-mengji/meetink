from __future__ import annotations

from app.schemas.meeting import TopicSegment, Utterance
from app.pipeline.segment.label import label_segment


async def refine_low_confidence_segments(
    segments: list[TopicSegment],
    utterances: list[Utterance],
    confidence_threshold: float = 0.7,
) -> list[TopicSegment]:
    raw_to_u = {}
    for u in utterances:
        for rid in u.id:
            raw_to_u[rid] = u
    refined: list[TopicSegment] = []

    for segment in segments:
        if segment.confidence >= confidence_threshold or len(segment.utterance_ids) < 4:
            refined.append(segment)
            continue

        mid = len(segment.utterance_ids) // 2
        ids_a = segment.utterance_ids[:mid]
        ids_b = segment.utterance_ids[mid:]
        def get_len(ids):
            seen = set()
            length = 0
            for rid in ids:
                if rid in raw_to_u:
                    u = raw_to_u[rid]
                    if u.id not in seen:
                        seen.add(u.id)
                        length += len(u.text)
            return length
            
        len_a = get_len(ids_a)
        len_b = get_len(ids_b)
        utts_a = [raw_to_u[i] for i in ids_a if i in raw_to_u]
        utts_b = [raw_to_u[i] for i in ids_b if i in raw_to_u]

        title_a, conf_a = await label_segment(utts_a)
        title_b, conf_b = await label_segment(utts_b)

        seg_a = TopicSegment(
            title=title_a,
            utterance_ids=ids_a,
            confidence=conf_a,
            continues_segment_id=None,
        )
        seg_b = TopicSegment(
            title=title_b,
            utterance_ids=ids_b,
            confidence=conf_b,
            continues_segment_id=seg_a.segment_id,
        )
        refined.extend([seg_a, seg_b])

    return refined
