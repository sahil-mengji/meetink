"""Tiny CLI to inspect ingestion output for a transcript file.

    python -m app.ingest.cli ../samples/sprint_sync.vtt
    python -m app.ingest.cli ../samples/sprint_sync.txt

Runs the rule-based path (ingest -> normalize) and prints the validated
Meeting JSON. The LLM fallback for messy input runs inside the full pipeline
(POST /{id}/process), not here.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from app.pipeline.ingest.router import ingest_file
from app.pipeline.normalize.pipeline import normalize_utterances
from app.schemas.meeting import Meeting


def main() -> int:
    ap = argparse.ArgumentParser(description="Inspect transcript ingestion output")
    ap.add_argument("file", help="path to .vtt / .txt transcript")
    args = ap.parse_args()

    path = Path(args.file)
    if not path.exists():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 1

    try:
        raw, metadata = ingest_file(path.read_bytes(), path.name)
        utterances, metadata = normalize_utterances(raw, metadata)
    except Exception as exc:  # surface parse/validation errors cleanly
        print(f"error: {exc}", file=sys.stderr)
        return 2

    meeting = Meeting(metadata=metadata, utterances=utterances, raw_filename=path.name)
    print(f"[{metadata.source_type.value}] {len(utterances)} utterances | "
          f"participants: {metadata.participants}", file=sys.stderr)
    print(meeting.model_dump_json(indent=2, exclude={"raw_content"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
