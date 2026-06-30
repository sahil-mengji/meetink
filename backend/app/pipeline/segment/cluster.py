from __future__ import annotations

import math


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return dot / (na * nb)


def cluster_adjacent_chunks(
    chunk_texts: list[str],
    embeddings: list[list[float]],
    threshold: float = 0.55,
) -> list[list[int]]:
    if not chunk_texts:
        return []

    clusters: list[list[int]] = [[0]]
    for i in range(1, len(chunk_texts)):
        sim = cosine_similarity(embeddings[i - 1], embeddings[i])
        if sim >= threshold:
            clusters[-1].append(i)
        else:
            clusters.append([i])
    return clusters
