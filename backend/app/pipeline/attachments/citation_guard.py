import re

def filter_doc_citations(markdown: str, allowed_chunk_ids: set[str]) -> str:
    """Filter out hallucinated document citations from markdown text."""
    # Example format: [doc:chunk-uuid] or similar if LLM uses it.
    # For now, we return as is, or we could strip tags that don't match allowed_chunk_ids.
    return markdown

def filter_citations_used(citations: list[str], allowed_chunk_ids: set[str]) -> list[str]:
    """Ensure all citations in the list actually exist in the allowed set."""
    return [c for c in citations if c in allowed_chunk_ids]

def filter_source_doc_refs(refs: list[str], allowed_chunk_ids: set[str]) -> list[str]:
    """Ensure all source doc refs exist in the allowed set."""
    return [r for r in refs if r in allowed_chunk_ids]
