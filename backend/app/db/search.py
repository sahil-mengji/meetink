from __future__ import annotations

from app.db.store import get_knowledge_store
from app.pipeline.segment.embeddings import embed
from app.pipeline.segment.cluster import cosine_similarity


def search_knowledge(query: str, top_k: int = 5) -> list[dict]:
    store = get_knowledge_store()
    results: list[dict] = []

    for record in store.list_records():
        snippets: list[str] = [record.get("gist", "")]
        for topic in record.get("topics", []):
            snippets.append(topic.get("title", ""))
            snippets.append(topic.get("summary", ""))
        blob = "\n".join(snippets).lower()

        score = 1.0 if query.lower() in blob else 0.0
        if score == 0.0:
            q_vec = embed([query])[0]
            d_vec = embed([blob[:500]])[0]
            score = cosine_similarity(q_vec, d_vec)

        if score > 0.1:
            results.append(
                {
                    "meeting_id": record["meeting_id"],
                    "snippet": blob[:300],
                    "score": round(score, 3),
                }
            )

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:top_k]
