# Pipeline

All meeting processing stages. Each stage is a pure function that takes input and returns output — no database access, no side effects.

## Stage Order

1. **ingest/** — Parse raw files (.vtt, .txt) into `RawUtterance` list
2. **normalize/** — Preprocess (clean fillers, normalize speakers, absorb backchannels) then merge same-speaker turns and assign IDs
3. **segment/** — Chunk utterances → embed → cluster into topic segments → label via LLM
4. **temporal/** — Detect date/time references → attach context window → interpret via LLM
5. **agents/** — Per-segment LLM extraction (summary, actions, decisions, risks)
6. **merge/** — Deduplicate and combine agent outputs across segments
7. **report/** — Build final MeetingReport with gist
8. **orchestrator/** — LangGraph state machine that wires stages 1–7 together
