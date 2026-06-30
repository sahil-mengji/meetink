from __future__ import annotations

import asyncio

from langgraph.graph import END, StateGraph

# Legacy segment agents removed
from app.pipeline.agents.context import build_segment_context
from app.pipeline.ingest.llm_fallback import llm_reparse, quality_is_poor
from app.pipeline.ingest.router import ingest_file
from app.db.store import get_knowledge_store
from app.pipeline.merge.meeting_merge import merge_segment_outputs
from app.pipeline.normalize.pipeline import normalize_utterances
from app.pipeline.orchestrator.state import PipelineState
from app.pipeline.report.generator import build_meeting_report, generate_gist
from app.schemas.meeting import Meeting, MeetingMetadata, SegmentAgentOutput
from app.pipeline.segment.pipeline import segment_topics
from app.db.repository import get_repository
from app.pipeline.temporal.context import attach_temporal_context
from app.pipeline.temporal.detect import detect_temporal_mentions
from app.pipeline.temporal.interpret import interpret_mentions


async def _extract_per_segment(state: PipelineState) -> dict:
    # Legacy extraction removed
    return {"segment_outputs": []}


async def _segment_topics(state: PipelineState) -> dict:
    segments = await segment_topics(state["utterances"])
    return {"segments": segments}


async def _detect_temporal(state: PipelineState) -> dict:
    mentions = detect_temporal_mentions(state["utterances"], anchor=state["metadata"].recorded_at)
    mentions = attach_temporal_context(mentions, state["utterances"])
    mentions = await interpret_mentions(mentions, state["utterances"])
    return {"temporal_mentions": mentions}


async def _generate_report(state: PipelineState) -> dict:
    actions, decisions, risks, _ = merge_segment_outputs(
        state["segments"],
        state["segment_outputs"],
        state["temporal_mentions"],
    )
    gist = await generate_gist(state["segment_outputs"])
    report = build_meeting_report(
        meeting_id=state["meeting_id"],
        segments=state["segments"],
        segment_outputs=state["segment_outputs"],
        all_actions=actions,
        all_decisions=decisions,
        all_risks=risks,
        temporal_mentions=state["temporal_mentions"],
        gist=gist,
    )
    return {"report": report}


async def _persist_knowledge(state: PipelineState) -> dict:
    if state.get("report"):
        get_knowledge_store().persist_report(state["report"])
    return {}


def build_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("segment_topics", _segment_topics)
    graph.add_node("detect_temporal", _detect_temporal)
    graph.add_node("extract_per_segment", _extract_per_segment)
    graph.add_node("generate_report", _generate_report)
    graph.add_node("persist_knowledge", _persist_knowledge)

    graph.set_entry_point("segment_topics")
    graph.add_edge("segment_topics", "detect_temporal")
    graph.add_edge("detect_temporal", "extract_per_segment")
    graph.add_edge("extract_per_segment", "generate_report")
    graph.add_edge("generate_report", "persist_knowledge")
    graph.add_edge("persist_knowledge", END)
    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_pipeline_on_meeting(meeting: Meeting) -> Meeting:
    if not meeting.raw_content or not meeting.raw_filename:
        raise ValueError("Meeting has no uploaded file content")

    raw, metadata = ingest_file(meeting.raw_content, meeting.raw_filename, title=meeting.metadata.title)

    # If rule parsing did poorly (messy/unlabeled input), fall back to the LLM
    # to segment + attribute speakers. No-op when the model returns nothing
    # (e.g. the mock client), so we never lose the rule output.
    if quality_is_poor(raw, metadata.source_type):
        reparsed = await llm_reparse(meeting.raw_content)
        if reparsed:
            raw = reparsed
            participants = sorted({r.speaker for r in raw if r.speaker != "Unknown"})
            metadata = metadata.model_copy(update={"participants": participants})

    utterances, metadata = normalize_utterances(raw, metadata)

    initial_state: PipelineState = {
        "meeting_id": meeting.meeting_id,
        "metadata": metadata,
        "utterances": utterances,
        "segments": [],
        "temporal_mentions": [],
        "segment_outputs": [],
        "report": None,
        "errors": [],
    }

    result = await get_graph().ainvoke(initial_state)

    updated = meeting.model_copy(
        update={
            "metadata": metadata,
            "utterances": utterances,
            "segments": result.get("segments", []),
            "report": result.get("report"),
        }
    )
    get_repository().save(updated)
    return updated


async def run_pipeline(meeting_id: str, file_bytes: bytes, filename: str) -> Meeting:
    from pathlib import Path

    title = Path(filename).stem.replace("_", " ").title()
    meeting = Meeting(
        meeting_id=meeting_id,
        raw_content=file_bytes,
        raw_filename=filename,
        metadata=MeetingMetadata(title=title),
    )
    get_repository().save(meeting)
    return await run_pipeline_on_meeting(meeting)
