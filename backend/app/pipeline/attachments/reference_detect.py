import uuid
import logging
from typing import Any
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.llm.client import get_chat_model
from app.pipeline.attachments.types import VerifiedDocReference

logger = logging.getLogger(__name__)

from typing import Union

class DocumentReferenceCandidate(BaseModel):
    utterance_id: str
    chunk_id: str
    raw_phrase: str
    confidence: Union[float, str]
    reason: str

class DocumentReferencesResponse(BaseModel):
    references: list[DocumentReferenceCandidate]

def index_refs_by_utterance(refs: list[VerifiedDocReference]) -> dict[str, list[VerifiedDocReference]]:
    res = {}
    for r in refs:
        if r.utterance_id not in res:
            res[r.utterance_id] = []
        res[r.utterance_id].append(r)
    return res

async def detect_verified_doc_references(
    utterances: list[Any],
    meeting_id: str,
    attachments: list[dict],
    chunks_by_attachment: dict[str, list[dict]]
) -> tuple[list[VerifiedDocReference], list[VerifiedDocReference]]:
    """Detect references to documents using an LLM."""
    if not attachments or not chunks_by_attachment:
        return [], []

    llm = get_chat_model()
    
    # We only care about utterances that likely mention documents. 
    # To save tokens, we can pre-filter utterances with heuristics before sending to LLM,
    # or we can send the whole transcript if it's small. We'll chunk the transcript.
    
    CHUNK_SIZE = 100
    all_verified = []
    all_low = []
    
    # Build a compact document index for the prompt
    doc_index_lines = []
    for att in attachments:
        doc_index_lines.append(f"DOCUMENT ID: {att['id']} | FILENAME: {att['filename']}")
        chunks = chunks_by_attachment.get(att['id'], [])
        for chunk in chunks:
            doc_index_lines.append(f"  - CHUNK ID: {chunk['chunk_id']} | Locator: {chunk['locator_type']} {chunk['locator_value']} | Title: {chunk['title']}")
            # Include a tiny snippet of the chunk text to help the LLM match content
            snippet = chunk['text'][:200].replace('\n', ' ')
            doc_index_lines.append(f"    Content: {snippet}...")
            
    doc_index_text = "\n".join(doc_index_lines)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a reference detection agent.
Your task is to identify when a speaker in a meeting transcript is explicitly referencing a provided document or presentation.

You will be given:
1. A DOCUMENT INDEX listing available attachments, their chunks (pages/slides), and short text snippets.
2. A TRANSCRIPT SEGMENT.

Analyze the transcript for explicit mentions of the documents (e.g., "On slide 5", "In the Q3 report, page 2", "Looking at the executive summary").
If you find a reference, map it to the specific CHUNK ID from the DOCUMENT INDEX.

Output a list of references with:
- utterance_id: The ID of the utterance making the reference.
- chunk_id: The ID of the document chunk being referenced.
- raw_phrase: The exact phrase from the transcript indicating the reference.
- confidence: A score from 0.0 to 1.0 (1.0 = explicitly named slide/page number, 0.5 = vague reference).
- reason: Why you mapped it to this chunk."""),
        ("human", """--- DOCUMENT INDEX ---
{doc_index_text}

--- TRANSCRIPT SEGMENT ---
{transcript_text}""")
    ])

    for i in range(0, len(utterances), CHUNK_SIZE):
        chunk = utterances[i:i + CHUNK_SIZE]
        
        # Build transcript text using exact utterance IDs
        # Utterance IDs can be tuples or ints, convert to string safely
        def _get_id(u):
            uid = u.get("id")
            if isinstance(uid, (list, tuple)):
                return str(list(uid))
            return str(uid)
            
        transcript_text = "\n".join(f"[{_get_id(u)}] {u.get('speaker', 'Unknown')}: {u.get('text', '')}" for u in chunk)
        
        try:
            chain = prompt | llm.with_structured_output(DocumentReferencesResponse)
            res = await chain.ainvoke({
                "doc_index_text": doc_index_text,
                "transcript_text": transcript_text
            })
            
            # Create a lookup for speaker
            id_to_speaker = {_get_id(u): u.get("speaker", "Unknown") for u in chunk}
            
            # Create lookup for attachment_id from chunk_id
            chunk_to_att = {}
            for att_id, ch_list in chunks_by_attachment.items():
                for ch in ch_list:
                    chunk_to_att[ch['chunk_id']] = att_id
            
            for ref in res.references:
                if ref.chunk_id not in chunk_to_att:
                    continue # Invalid chunk ID hallucinated by LLM
                    
                speaker = id_to_speaker.get(ref.utterance_id, "Unknown")
                att_id = chunk_to_att[ref.chunk_id]
                
                try:
                    conf_val = float(ref.confidence)
                except (ValueError, TypeError):
                    conf_val = 0.5
                    
                v_ref = VerifiedDocReference(
                    reference_id=str(uuid.uuid4()),
                    utterance_id=ref.utterance_id,
                    speaker=speaker,
                    attachment_id=att_id,
                    chunk_id=ref.chunk_id,
                    reference_type="explicit" if conf_val >= 0.8 else "implicit",
                    raw_phrase=ref.raw_phrase,
                    confidence=conf_val,
                    resolution_method="llm_extraction",
                    reason=ref.reason
                )
                
                if conf_val >= 0.7:
                    all_verified.append(v_ref)
                else:
                    all_low.append(v_ref)
                    
        except Exception as e:
            logger.error(f"Failed to detect references in chunk: {e}")

    return all_verified, all_low
