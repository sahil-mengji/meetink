from __future__ import annotations

import hashlib
import math


def _hash_to_vector(text: str, dim: int = 8) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = [digest[i % len(digest)] / 255.0 for i in range(dim)]
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values]


def embed(texts: list[str]) -> list[list[float]]:
    return [_hash_to_vector(t) for t in texts]
