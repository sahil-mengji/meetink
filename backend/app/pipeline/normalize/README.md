# Normalize

Cleans and structures raw utterances into the final `Utterance` model.

## Preprocessing (`preprocess.py`)

Applied before merge. Three steps in order:

1. **Speaker name normalization** — Groups similar names ("Bob", "bob", "Bob Smith" → "Bob Smith") using fuzzy matching (rapidfuzz, threshold=80%). Attributes "Unknown" speakers sandwiched between same-speaker turns within 3s.
2. **Text cleanup** — Strips filler words (um, uh, you know, like), VTT artifacts ([Music], [Applause], [Inaudible]), normalizes whitespace and trailing punctuation.
3. **Backchannel absorption** — Removes short interjections ("Yeah", "Mm-hmm", "Right") that interrupt another speaker's flow (A speaks → B says "Yeah" → A continues = drop B's utterance).

## Merge (`pipeline.py`)

- Sorts utterances by start time
- Merges consecutive same-speaker turns within `merge_gap_seconds` (default 2s)
- Assigns sequential IDs
- Extracts unique participant list
