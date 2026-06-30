from __future__ import annotations

from app.schemas.meeting import TemporalMention, Utterance


def attach_temporal_context(
    mentions: list[TemporalMention],
    utterances: list[Utterance],
    window: int = 5,
) -> list[TemporalMention]:
    id_to_index = {u.id: i for i, u in enumerate(utterances)}
    updated: list[TemporalMention] = []

    for mention in mentions:
        idx = id_to_index.get(mention.utterance_id)
        if idx is None:
            updated.append(mention)
            continue
        before_ids = [utterances[i].id for i in range(max(0, idx - window), idx)]
        after_ids = [utterances[i].id for i in range(idx + 1, min(len(utterances), idx + window + 1))]
        updated.append(
            mention.model_copy(
                update={
                    "context_before_ids": before_ids,
                    "context_after_ids": after_ids,
                }
            )
        )
    return updated
