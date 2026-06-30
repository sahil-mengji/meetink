"""Knowledge service — search and retrieval from the knowledge store."""

from __future__ import annotations

from app.db.search import search_knowledge


def search(query: str) -> list[dict]:
    """Search the knowledge library for matching records."""
    return search_knowledge(query)
