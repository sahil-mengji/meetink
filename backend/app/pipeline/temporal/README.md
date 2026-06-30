# Temporal

Detects and interprets date/time references in the transcript.

## Pipeline

1. **Detection** (`detect.py`) — Regex patterns for "next Monday", "by EOD", "end of week", date formats. Falls back to `dateparser` library for fuzzy parsing.
2. **Context attachment** (`context.py`) — Attaches surrounding utterance IDs (±5 window) to each mention for LLM interpretation.
3. **Interpretation** (`interpret.py`) — LLM classifies each mention as: deadline_for_action, scheduled_meeting, follow_up_reminder, vague_reference. Resolves to datetime, assigns owner, and suggests calendar_action.
4. **Calendar candidates** (`calendar_candidates.py`) — Filters temporal mentions to only actionable ones (scheduled meetings, deadlines) for calendar export.
