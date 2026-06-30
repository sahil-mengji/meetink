from __future__ import annotations

from app.schemas.meeting import TopicSegment, Utterance
from app.pipeline.segment.chunking import chunk_utterances
from app.pipeline.segment.cluster import cluster_adjacent_chunks
from app.pipeline.segment.embeddings import embed
from app.pipeline.segment.label import label_segment
from app.pipeline.segment.sliding_window import refine_low_confidence_segments


async def segment_topics(utterances: list[Utterance]) -> list[TopicSegment]:
    if not utterances:
        return []

    chunks = chunk_utterances(utterances)
    chunk_texts = [" ".join(u.text for u in chunk) for chunk in chunks]
    vectors = embed(chunk_texts)
    cluster_indices = cluster_adjacent_chunks(chunk_texts, vectors)

    segments: list[TopicSegment] = []
    for group in cluster_indices:
        ids: list[int] = []
        utts: list[Utterance] = []
        for idx in group:
            for u in chunks[idx]:
                ids.extend(u.id)
                utts.append(u)
        title, confidence = await label_segment(utts)
        segments.append(
            TopicSegment(
                title=title,
                utterance_ids=ids,
                confidence=confidence,
            )
        )

    return await refine_low_confidence_segments(segments, utterances)
