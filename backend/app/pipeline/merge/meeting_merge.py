from __future__ import annotations

from rapidfuzz import fuzz

from app.schemas.meeting import (
    ActionItem,
    Decision,
    IdentifiedByAgent,
    RiskItem,
    SegmentAgentOutput,
    TemporalMention,
    TopicSegment,
)


def _dedupe_by_text(items: list, key: str = "text", threshold: int = 85) -> list:
    unique: list = []
    for item in items:
        text = getattr(item, key)
        if any(fuzz.ratio(text, getattr(u, key)) >= threshold for u in unique):
            continue
        unique.append(item)
    return unique


def _apply_temporal_deadlines(
    actions: list[ActionItem],
    temporal_mentions: list[TemporalMention],
) -> list[ActionItem]:
    mention_by_utterance = {m.utterance_id: m for m in temporal_mentions if m.resolved_datetime}
    updated: list[ActionItem] = []
    for action in actions:
        deadline = action.deadline
        for uid in action.source_utterance_ids:
            mention = mention_by_utterance.get(uid)
            if mention and mention.resolved_datetime:
                deadline = mention.resolved_datetime
                break
        updated.append(action.model_copy(update={"deadline": deadline}))
    return updated


def merge_segment_outputs(
    segments: list[TopicSegment],
    outputs: list[SegmentAgentOutput],
    temporal_mentions: list[TemporalMention],
) -> tuple[list[ActionItem], list[Decision], list[RiskItem], list[SegmentAgentOutput]]:
    segment_map = {s.segment_id: s for s in segments}
    merged_outputs: list[SegmentAgentOutput] = []

    all_actions: list[ActionItem] = []
    all_decisions: list[Decision] = []
    all_risks: list[RiskItem] = []

    for output in outputs:
        merged_outputs.append(output)
        all_actions.extend(output.actions)
        all_decisions.extend(output.decisions)
        all_risks.extend(output.risks)

    all_actions = _apply_temporal_deadlines(all_actions, temporal_mentions)
    all_actions = _dedupe_by_text(all_actions)
    all_decisions = _dedupe_by_text(all_decisions)
    all_risks = _dedupe_by_text(all_risks)

    return all_actions, all_decisions, all_risks, merged_outputs
