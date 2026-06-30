from __future__ import annotations

import logging
from typing import Any
import asyncio
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from app.llm.client import KeyMomentsResponse, get_chat_model

logger = logging.getLogger(__name__)

async def extract_key_moments(
    utterances: list[Any], 
    llm: BaseChatModel | None = None
) -> dict:
    """Extract key moments from a full or partial transcript."""
    client = llm or get_chat_model()
    
    CHUNK_SIZE = 100
    all_key_moments = []
    total_chunks = (len(utterances) + CHUNK_SIZE - 1) // CHUNK_SIZE
    
    logger.info(f"Extracting key moments for {len(utterances)} utterances across {total_chunks} chunk(s).")

    temp_id_to_u = {}
    for i, u in enumerate(utterances):
        temp_id_to_u[i] = u

    for i in range(0, len(utterances), CHUNK_SIZE):
        chunk_index = (i // CHUNK_SIZE) + 1
        chunk = utterances[i:i + CHUNK_SIZE]
        logger.info(f"Processing chunk {chunk_index}/{total_chunks} with {len(chunk)} utterances...")
        
        # Build transcript using temporary sequential IDs
        transcript_text = "\n".join(f"{i + j}: [{u.speaker}] {u.text}" for j, u in enumerate(chunk))

        prompt = ChatPromptTemplate.from_messages([
            ("system", """Extract key moments from the transcript segment. 
A key moment is a summary of an important event, an insightful quote, or a critical statement.
For each key moment, you must provide the 'source_utterance_ids' which should be the EXACT 
integer ID from the start of the line that corresponds to this key moment."""),
            ("human", """TRANSCRIPT SEGMENT:
{transcript_text}""")
        ])

        max_retries = 3
        for attempt in range(max_retries):
            try:
                chain = prompt | client.with_structured_output(KeyMomentsResponse)
                res = await chain.ainvoke({"transcript_text": transcript_text})
                
                # Map temp IDs back to original raw IDs
                for moment in res.key_moments:
                    src_temp_ids = moment.source_utterance_ids
                    raw_ids = set()
                    for tid in src_temp_ids:
                        if tid in temp_id_to_u:
                            u_id = temp_id_to_u[tid].id
                            if isinstance(u_id, (list, tuple)):
                                raw_ids.update(u_id)
                            else:
                                raw_ids.add(u_id)
                    
                    moment_dict = moment.model_dump()
                    # Ensure ids are strings as requested in previous schema
                    moment_dict["source_utterance_ids"] = [str(rid) for rid in sorted(list(raw_ids))]
                    # Generate unique ID and map over to match previous structure
                    all_key_moments.append({
                        "id": f"km-{len(all_key_moments)+1}",
                        "type": moment_dict["type"],
                        "text": moment_dict["text"],
                        "confidence": moment_dict["confidence"],
                        "source_ids": moment_dict["source_utterance_ids"]
                    })
                break  # Success, break out of retry loop
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "rate limit" in err_str.lower():
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 2
                        logger.warning(f"Rate limit hit for chunk {chunk_index}. Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                logger.error(f"Failed to extract key moments using LLM for chunk {chunk_index}: {e}")
                break # Non-recoverable or max retries hit

    logger.info(f"Finished extracting key moments. Total key moments found: {len(all_key_moments)}.")
    return {"key_moments": all_key_moments}
