# Merge

Combines agent outputs from all segments into meeting-level lists.

## What it does (`meeting_merge.py`)

- Collects all actions, decisions, and risks from per-segment agent outputs
- **Deduplicates** using fuzzy text matching (rapidfuzz, threshold=85%) — same item extracted from overlapping segments is kept only once
- **Applies temporal deadlines** to action items by cross-referencing resolved_datetime from temporal mentions matching the action's source utterance IDs
