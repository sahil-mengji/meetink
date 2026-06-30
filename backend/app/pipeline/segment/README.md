# Segment

Groups utterances into coherent topic segments.

## Pipeline (`pipeline.py`)

1. **Chunking** (`chunking.py`) — Splits utterances into fixed-size windows (3–5 utterances per chunk)
2. **Embedding** (`embeddings.py`) — Generates vector representations of each chunk (currently SHA-256 hash-based; swap for real embeddings in production)
3. **Clustering** (`cluster.py`) — Groups adjacent chunks by cosine similarity (threshold=0.55) into topic clusters
4. **Labeling** (`label.py`) — LLM generates a title + confidence score for each segment from the first 8 utterances
5. **Refinement** (`sliding_window.py`) — Splits low-confidence segments (< 0.7) at midpoint and re-labels each half
