from __future__ import annotations

from app.config import get_settings
from app.schemas.meeting import TranscriptWindow, Utterance


def estimate_tokens(text: str) -> int:
    try:
        import tiktoken

        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        return max(1, len(text) // 4)


def render_window(utterances: list[Utterance]) -> str:
    return "\n".join(f"{u.speaker}: {u.text}" for u in utterances)


def chunk_utterances_by_budget(
    utterances: list[Utterance],
    max_tokens: int | None = None,
    overlap_utterances: int = 0,
) -> list[TranscriptWindow]:
    if not utterances:
        return []

    budget = max_tokens or get_settings().summary_window_tokens
    windows: list[TranscriptWindow] = []
    i = 0
    window_index = 0

    while i < len(utterances):
        batch: list[Utterance] = []
        while i < len(utterances):
            candidate = batch + [utterances[i]]
            rendered = render_window(candidate)
            if batch and estimate_tokens(rendered) > budget:
                break
            batch = candidate
            i += 1
            if estimate_tokens(rendered) >= budget:
                break

        if not batch:
            batch = [utterances[i]]
            i += 1

        windows.append(
            TranscriptWindow(
                window_index=window_index,
                utterances=batch,
                rendered_text=render_window(batch),
                utterance_ids=[u.id for u in batch],
            )
        )
        window_index += 1

        if overlap_utterances > 0 and i < len(utterances):
            i = max(i - overlap_utterances, windows[-1].utterance_ids[0] + 1)

    return windows
