from __future__ import annotations

from app.schemas.meeting import Utterance


def chunk_utterances(utterances: list[Utterance], min_size: int = 3, max_size: int = 5) -> list[list[Utterance]]:
    if not utterances:
        return []

    chunks: list[list[Utterance]] = []
    i = 0
    while i < len(utterances):
        remaining = len(utterances) - i
        if remaining <= max_size:
            chunks.append(utterances[i:])
            break
        size = max_size
        chunks.append(utterances[i : i + size])
        i += size
    return chunks
