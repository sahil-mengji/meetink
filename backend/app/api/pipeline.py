"""
Pipeline Testing API — individual endpoints for each processing stage.
Allows the frontend Pipeline Testing page to invoke stages in isolation.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel, Field

from app.pipeline.agents.context import SegmentExtractionContext, build_segment_context
from app.pipeline.ingest.adapters.vtt import RawUtterance
from app.pipeline.ingest.router import ingest_file
from app.pipeline.normalize.pipeline import normalize_utterances
from app.pipeline.normalize.preprocess import (
    clean_utterances,
    absorb_backchannels,
    normalize_speaker_names,
    preprocess,
)
from app.schemas.meeting import (
    ActionItem,
    Decision,
    MeetingMetadata,
    MeetingReport,
    RiskItem,
    SegmentAgentOutput,
    TemporalMention,
    TopicSegment,
    Utterance,
)
from app.pipeline.segment.pipeline import segment_topics
from app.pipeline.temporal.detect import detect_temporal_mentions

router = APIRouter()


# ===================== Request / Response Models =====================


class IntentRequest(BaseModel):
    utterances: list[dict]


class NormalizeRequest(BaseModel):
    utterances: list[dict]
    metadata: dict = Field(default_factory=dict)
    merge_gap_seconds: float = 2.0


class SimpleUtteranceInput(BaseModel):
    speaker: str
    text: str


class ScriptHighlightsRequest(BaseModel):
    utterances: list[dict]
    metadata: dict = Field(default_factory=dict)
    merge_gap_seconds: float = 2.0


class SegmentRequest(BaseModel):
    utterances: list[dict]


class SegmentLabelRequest(BaseModel):
    utterances: list[dict]
    segments: list[dict]


class TemporalRequest(BaseModel):
    utterances: list[dict]
    recorded_at: str | None = None


class SegmentContextRequest(BaseModel):
    """Shared body shape for per-segment agent calls (summarize, decisions, risks, actions, insights)."""

    meeting_id: str = "test-pipeline"
    meeting_title: str = "Test Meeting"
    recorded_at: str | None = None
    participants: list[str] = Field(default_factory=list)
    topic: dict = Field(default_factory=dict)
    utterances: list[dict] = Field(default_factory=list)
    temporal_hints: list[dict] = Field(default_factory=list)
    prior_topic_titles: list[str] = Field(default_factory=list)
    transcript_excerpt: str = ""
    running_summary: str | None = None


class KnowledgePersistRequest(BaseModel):
    meeting_id: str = "test-pipeline"
    gist: str = ""
    all_actions: list[dict] = Field(default_factory=list)
    all_decisions: list[dict] = Field(default_factory=list)
    all_risks: list[dict] = Field(default_factory=list)


class FollowupsRequest(BaseModel):
    meeting_id: str = "test-pipeline"
    actions: list[dict] = Field(default_factory=list)
    decisions: list[dict] = Field(default_factory=list)


class ParticipationRequest(BaseModel):
    utterances: list[dict]
    participants: list[str] = Field(default_factory=list)


# ===================== Helpers =====================


def _parse_utterances(raw: list[dict]) -> list[Utterance]:
    """Best-effort parse list of dicts into Utterance models."""
    result = []
    for i, u in enumerate(raw):
        raw_id = u.get("id", [i])
        if not isinstance(raw_id, list):
            raw_id = [int(raw_id)]
            
        result.append(
            Utterance(
                id=tuple(raw_id),
                speaker=u.get("speaker", "Unknown"),
                start=float(u.get("start", 0)),
                end=float(u.get("end", 0)),
                text=u.get("text", ""),
                raw_text=u.get("raw_text", u.get("text", "")),
            )
        )
    return result


def _parse_segment(d: dict) -> TopicSegment:
    return TopicSegment(
        segment_id=d.get("segment_id", "seg-test"),
        title=d.get("title", "Untitled"),
        utterance_ids=d.get("utterance_ids", []),
        confidence=d.get("confidence", 0.8),
    )


def _build_ctx(body: SegmentContextRequest) -> SegmentExtractionContext:
    utterances = _parse_utterances(body.utterances)
    topic = _parse_segment(body.topic) if body.topic else TopicSegment(
        title="Test Topic", utterance_ids=[u.id for u in utterances]
    )
    temporal_hints = [TemporalMention(**h) for h in body.temporal_hints] if body.temporal_hints else []
    recorded_at = None
    if body.recorded_at:
        try:
            recorded_at = datetime.fromisoformat(body.recorded_at)
        except ValueError:
            pass

    return SegmentExtractionContext(
        meeting_id=body.meeting_id,
        meeting_title=body.meeting_title,
        recorded_at=recorded_at,
        participants=body.participants,
        topic=topic,
        utterances=utterances,
        temporal_hints=temporal_hints,
        prior_topic_titles=body.prior_topic_titles,
        transcript_excerpt=body.transcript_excerpt or "\n".join(f"{u.speaker}: {u.text}" for u in utterances),
        running_summary=body.running_summary,
    )


# ===================== Endpoints =====================


@router.post("/ingest")
async def pipeline_ingest(file: UploadFile):
    """Parse a .vtt/.txt file into structured utterances (VTT to JSON)."""
    content = await file.read()
    if not file.filename:
        return {"error": "Filename required"}

    raw_utterances, metadata = ingest_file(content, file.filename)
    return {
        "raw_utterances": [
            {
                "id": u.id,
                "speaker": u.speaker,
                "start": u.start,
                "end": u.end,
                "text": u.text,
                "raw_text": u.raw_text,
            }
            for u in raw_utterances
        ],
        "metadata": metadata.model_dump(mode="json"),
    }


class PreprocessRequest(BaseModel):
    utterances: list[dict]
    metadata: dict = Field(default_factory=dict)


@router.post("/preprocess")
async def pipeline_preprocess(body: PreprocessRequest):
    """Preprocess: clean fillers, normalize speakers, absorb backchannels."""
    raw_utterances = [
        RawUtterance(
            id=u.get("id", i),
            speaker=u.get("speaker", "Unknown"),
            start=float(u.get("start", 0)),
            end=float(u.get("end", 0)),
            text=u.get("text", ""),
            raw_text=u.get("raw_text", u.get("text", "")),
        )
        for i, u in enumerate(body.utterances)
    ]
    original_count = len(raw_utterances)

    # Run preprocessing steps
    after_speakers, p_map = normalize_speaker_names(raw_utterances)
    after_cleanup = clean_utterances(after_speakers)
    after_backchannels = absorb_backchannels(after_cleanup)
    
    metadata_out = body.metadata.copy()
    metadata_out["participant_map"] = p_map

    return {
        "raw_utterances": [
            {
                "id": u.id,
                "speaker": u.speaker,
                "start": u.start,
                "end": u.end,
                "text": u.text,
                "raw_text": u.raw_text,
            }
            for u in after_backchannels
        ],
        "metadata": metadata_out,
        "stats": {
            "original_count": original_count,
            "after_speaker_normalization": len(after_speakers),
            "after_text_cleanup": len(after_cleanup),
            "after_backchannel_absorption": len(after_backchannels),
            "removed": original_count - len(after_backchannels),
        },
    }


@router.post("/intent")
async def pipeline_intent(body: IntentRequest):
    """Classify utterance intents using heuristic rules."""
    utterances = _parse_utterances(body.utterances)
    results = []
    for u in utterances:
        text = u.text.lower()
        if "?" in u.text:
            intent = "question"
        elif any(w in text for w in ("will", "i'll", "can", "let me", "going to", "shall")):
            intent = "action"
        elif any(w in text for w in ("decided", "agreed", "let's go with", "final")):
            intent = "decision"
        else:
            intent = "statement"
        results.append({**u.model_dump(), "intent": intent})
    return {"utterances": results}


@router.post("/normalize")
async def pipeline_normalize(body: NormalizeRequest):
    """Normalize and merge raw utterances."""
    raw_utterances = [
        RawUtterance(
            id=u.get("id", i),
            speaker=u.get("speaker", "Unknown"),
            start=float(u.get("start", 0)),
            end=float(u.get("end", 0)),
            text=u.get("text", ""),
            raw_text=u.get("raw_text", u.get("text", "")),
        )
        for i, u in enumerate(body.utterances)
    ]
    metadata = MeetingMetadata(
        title=body.metadata.get("title", "Untitled Meeting"),
        recorded_at=datetime.fromisoformat(body.metadata["recorded_at"]) if body.metadata.get("recorded_at") else None,
        participants=body.metadata.get("participants", []),
    )
    utterances, updated_metadata = normalize_utterances(
        raw_utterances, metadata, body.merge_gap_seconds
    )
    return {
        "utterances": [u.model_dump() for u in utterances],
    }

import logging
logger = logging.getLogger(__name__)

class KeyMomentsRequest(BaseModel):
    utterances: list[dict]
    metadata: dict = Field(default_factory=dict)

class TopicSegregationRequest(BaseModel):
    key_moments: list[dict]
    metadata: dict = Field(default_factory=dict)

class SummaryRecapRequest(BaseModel):
    key_moments: list[dict]
    topics_data: dict
    metadata: dict = Field(default_factory=dict)

@router.post("/key-moments")
async def pipeline_key_moments(body: KeyMomentsRequest):
    """Detect intent and generate key moments via LangGraph on PRE-NORMALIZED utterances."""
    logger.info(f"Starting key-moments LangGraph pipeline with {len(body.utterances)} utterances")
    from app.pipeline.graphs.highlights_graph import highlights_graph

    parsed_utts = _parse_utterances(body.utterances)
    state = await highlights_graph.ainvoke({
        "utterances": [u.model_dump() for u in parsed_utts],
        "metadata_in": body.metadata,
    })
    
    key_moments = state.get("key_moments", [])
    logger.info(f"Pipeline complete. Found {len(key_moments)} key moments.")
    
    # Extract just the intents as a lightweight map to avoid returning the massive transcript
    intent_map = {}
    for u in state.get("annotated_utterances", []):
        if "intent" in u and "id" in u:
            # Convert ID tuple/list back to string representation
            u_id = u["id"]
            if isinstance(u_id, (list, tuple)):
                intent_map[str(list(u_id))] = u["intent"]
            else:
                intent_map[str([u_id])] = u["intent"]
    
    return {
        "intent_map": intent_map,
        "key_moments": key_moments,
        "metadata": body.metadata,
    }



@router.post("/topics-segregation")
async def pipeline_topics_segregation(body: TopicSegregationRequest):
    """Identify overall topics and segregate points under subtopics using Key Moments."""
    from app.pipeline.graphs.topic_segregation_graph import topic_segregation_graph
    
    logger.info(f"Starting topics-segregation LangGraph pipeline with {len(body.key_moments)} key moments.")
    
    state = await topic_segregation_graph.ainvoke({
        "key_moments": body.key_moments,
        "metadata_in": body.metadata,
    })
    
    return {
        "overall_topic": state.get("overall_topic", ""),
        "overall_description": state.get("overall_description", ""),
        "topics": state.get("topics", [])
    }

@router.post("/summary-recap")
async def pipeline_summary_recap(body: SummaryRecapRequest):
    """Generate a Markdown report with Perplexity-style citations."""
    from app.pipeline.graphs.summary_recap_graph import summary_recap_graph
    
    logger.info("Starting summary-recap LangGraph pipeline.")
    
    state = await summary_recap_graph.ainvoke({
        "key_moments": body.key_moments,
        "topics_data": body.topics_data,
        "metadata_in": body.metadata,
    })
    
    return {
        "markdown_report": state.get("markdown_report", ""),
        "citations_used": state.get("citations_used", []),
        "action_items": state.get("action_items", [])
    }

class InferredInsightsRequest(BaseModel):
    markdown_report: str
    action_items: list[dict]

@router.post("/inferred-insights")
async def pipeline_inferred_insights(body: InferredInsightsRequest):
    """Generate external inferred insights, risks, and follow-ups based on the Summary & Recap Report."""
    from app.pipeline.graphs.inferred_insights_graph import inferred_insights_graph
    
    logger.info("Starting inferred-insights LangGraph pipeline.")
    
    state = await inferred_insights_graph.ainvoke({
        "markdown_report": body.markdown_report,
        "action_items": body.action_items,
    })
    
    return {
        "discussion_insights": state.get("discussion_insights", []),
        "risks_and_blockers": state.get("risks_and_blockers", []),
        "follow_up_points": state.get("follow_up_points", [])
    }



class KnowledgeRequest(BaseModel):
    markdown_report: str
    action_items: list[dict]
    inferred_insights: dict

@router.post("/knowledge")
async def pipeline_knowledge(body: KnowledgeRequest):
    """Extract permanent facts for the Knowledge Library."""
    from app.pipeline.graphs.knowledge_graph import knowledge_graph
    
    state = await knowledge_graph.ainvoke({
        "markdown_report": body.markdown_report,
        "action_items": body.action_items,
        "inferred_insights": body.inferred_insights
    })
    
    return {
        "permanent_facts": state.get("permanent_facts", [])
    }

class TeamPrepRequest(BaseModel):
    action_items: list[dict]
    inferred_insights: dict

@router.post("/team-prep")
async def pipeline_team_prep(body: TeamPrepRequest):
    """Structure action items into team assignments."""
    from app.pipeline.graphs.team_prep_graph import team_prep_graph
    
    state = await team_prep_graph.ainvoke({
        "action_items": body.action_items,
        "inferred_insights": body.inferred_insights
    })
    
    return {
        "team_announcements": state.get("team_announcements", []),
        "structured_assignments": state.get("structured_assignments", [])
    }

class TeamAnalysisRequest(BaseModel):
    markdown_report: str
    metadata_in: dict

@router.post("/team-analysis")
async def pipeline_team_analysis(body: TeamAnalysisRequest):
    """Analyze team collaboration, decision drivers, and sentiment."""
    from app.pipeline.graphs.team_analysis_graph import team_analysis_graph
    
    state = await team_analysis_graph.ainvoke({
        "markdown_report": body.markdown_report,
        "metadata_in": body.metadata_in
    })
    
    return {
        "collaboration_dynamics": state.get("collaboration_dynamics", ""),
        "decision_drivers": state.get("decision_drivers", []),
        "overall_sentiment": state.get("overall_sentiment", "")
    }


@router.post("/participation")
async def pipeline_participation(body: ParticipationRequest):
    """Calculate speaker participation metrics."""
    utterances = _parse_utterances(body.utterances)
    participants = body.participants or sorted({u.speaker for u in utterances if u.speaker != "Unknown"})

    speaker_stats: dict[str, dict] = {}
    total_duration = 0.0

    for u in utterances:
        duration = u.end - u.start
        total_duration += duration
        if u.speaker not in speaker_stats:
            speaker_stats[u.speaker] = {"turns": 0, "total_seconds": 0.0, "word_count": 0}
        speaker_stats[u.speaker]["turns"] += 1
        speaker_stats[u.speaker]["total_seconds"] += duration
        speaker_stats[u.speaker]["word_count"] += len(u.text.split())

    metrics = []
    for speaker in participants:
        stats = speaker_stats.get(speaker, {"turns": 0, "total_seconds": 0.0, "word_count": 0})
        metrics.append({
            "speaker": speaker,
            "turns": stats["turns"],
            "total_seconds": round(stats["total_seconds"], 2),
            "percentage": round((stats["total_seconds"] / total_duration * 100) if total_duration > 0 else 0, 1),
            "word_count": stats["word_count"],
        })

    return {
        "participants": participants,
        "total_duration_seconds": round(total_duration, 2),
        "metrics": sorted(metrics, key=lambda m: m["total_seconds"], reverse=True),
    }
