# Ingest

Parses raw meeting files into a list of `RawUtterance` dataclasses.

## Supported Formats

| Format | Adapter | What it does |
|--------|---------|-------------|
| `.vtt` | `adapters/vtt.py` | Parses WebVTT cues, extracts speaker from `<v>` tags or `Speaker:` prefix, converts timestamps to seconds |
| `.txt` | `adapters/plain_text.py` | Parses `Speaker: text` lines with optional `[HH:MM:SS]` timestamps |
| `.wav/.mp3` | `adapters/audio.py` | Placeholder — not yet implemented |

## Key Files

- **router.py** — `ingest_file(content, filename)` — detects format and delegates to the right adapter
- **llm_fallback.py** — If parsed output quality is poor, re-parses via LLM
