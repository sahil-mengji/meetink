# Orchestrator

LangGraph `StateGraph` that wires all pipeline stages together.

## Flow

```
ingest → normalize → segment_topics ─┬→ detect_temporal ──→ extract_per_segment → generate_report → persist_knowledge → END
                                      └→ extract_per_segment (waits for both segment + temporal)
```

## Key Functions (`graph.py`)

- **`run_pipeline_on_meeting(meeting)`** — Main entry point. Takes a `Meeting` object with raw content, runs all stages, returns the meeting with `.report` populated.
- **`_extract_per_segment()`** — For each segment: runs summarization first, then action/decision/risk agents in parallel (via `asyncio.gather`)
- **`_segment_topics()`** — Delegates to `segment.pipeline.segment_topics()`
- **`_detect_temporal()`** — Runs detection → context attachment → LLM interpretation
- **`_generate_report()`** — Merges outputs, generates gist, builds final report
- **`_persist_knowledge()`** — Saves report to knowledge store

## State (`state.py`)

`PipelineState` TypedDict tracks: meeting_id, metadata, utterances, segments, temporal_mentions, segment_outputs, report
