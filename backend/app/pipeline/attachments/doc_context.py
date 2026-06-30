from typing import Any
from app.pipeline.attachments.types import VerifiedDocReference

def build_doc_context_block(
    utterance_ids: set[str],
    refs_by_utterance: dict[str, list[VerifiedDocReference]],
    chunk_text_by_id: dict[str, dict],
    attachment_filename_by_id: dict[str, str]
) -> str:
    """Build a contextual block of document chunks that are referenced by the given utterances."""
    # Find all unique chunk IDs referenced by the current set of utterances
    referenced_chunks = set()
    for uid in utterance_ids:
        if uid in refs_by_utterance:
            for ref in refs_by_utterance[uid]:
                referenced_chunks.add(ref.chunk_id)
                
    if not referenced_chunks:
        return ""
        
    lines = ["--- REFERENCED DOCUMENT CONTEXT ---"]
    lines.append("The speakers explicitly refer to the following document sections. Use this context to enrich your summaries and action items. You may cite these chunks using their CHUNK ID.\n")
    
    for chunk_id in referenced_chunks:
        if chunk_id in chunk_text_by_id:
            chunk_data = chunk_text_by_id[chunk_id]
            att_id = chunk_data.get('attachment_id') # We didn't store attachment_id in chunk_text_by_id in the service, but let's assume we have title
            filename = "" # Not easily accessible unless we pass it, but title is there
            
            lines.append(f"<document_chunk id=\"{chunk_id}\">")
            lines.append(f"Locator: {chunk_data['locator_type']} {chunk_data['locator_value']}")
            if chunk_data.get('title'):
                lines.append(f"Title: {chunk_data['title']}")
            lines.append(f"Content: {chunk_data['text']}")
            lines.append("</document_chunk>\n")
            
    return "\n".join(lines)
