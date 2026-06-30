# Agents

Per-segment LLM-based extraction. Each agent receives a `SegmentExtractionContext` and returns a `SegmentAgentOutput`.

## Agents

| Agent | File | What it extracts |
|-------|------|-----------------|
| **Summarization** | `summarization_agent.py` | Windowed summary (compress-merge across token budget windows) + discussion points |
| **Action Items** | `action_item_agent.py` | Committed action items with owner, deadline, confidence, source_utterance_ids |
| **Decisions** | `decision_agent.py` | Explicit decisions (agreements, final choices) — conservative extraction |
| **Risks** | `risk_agent.py` | Risks, blockers, dependencies with confidence scores |

## Supporting Files

- **context.py** — `SegmentExtractionContext` model + `build_segment_context()` helper that slices utterances and temporal hints for a single segment
- **windowing.py** — Token-budget-aware chunking of utterances into windows for the summarization agent's compress-merge strategy
