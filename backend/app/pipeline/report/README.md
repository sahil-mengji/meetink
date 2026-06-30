# Report

Builds the final `MeetingReport` from merged outputs.

## Key Functions (`generator.py`)

- **`generate_gist()`** — LLM generates a one-line executive summary from all topic summaries
- **`build_meeting_report()`** — Assembles `TopicReport` per segment + meeting-level aggregates (all_actions, all_decisions, all_risks, temporal_mentions)
- **`to_markdown()`** — Renders the report as a formatted Markdown document with sections for gist, topics, actions, decisions, risks, and temporal mentions
