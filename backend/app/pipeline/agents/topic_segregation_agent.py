import logging
from typing import Any
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

from app.llm.client import TopicSegregationResponse, get_chat_model

logger = logging.getLogger(__name__)

async def segregate_topics(
    key_moments: list[dict],
    metadata: dict | None = None,
    llm: BaseChatModel | None = None
) -> dict:
    """Group key moments into a hierarchy of Topics -> SubTopics -> Points."""
    client = llm or get_chat_model()
    
    logger.info(f"Segregating {len(key_moments)} key moments into topics.")

    if not key_moments:
        return {"topics": []}

    # Format key moments for the prompt
    moments_text_lines = []
    for km in key_moments:
        # km could be a dict with 'id', 'text', 'type'
        km_id = km.get("id", "unknown_id")
        text = km.get("text", "")
        m_type = km.get("type", "general")
        moments_text_lines.append(f"[{km_id}] ({m_type}): {text}")
        
    moments_text = "\n".join(moments_text_lines)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert meeting analyst. You will be given a list of extracted "Key Moments" from a meeting.
Your job is to identify the overall high-level topics of discussion, and logically organize the key moments into those topics.

CRITICAL REQUIREMENTS FOR TOPIC NAMING:
- DO NOT generate generic or temporal topics like "Introduction", "Conclusion", "Next Steps", "Updates", or "Miscellaneous".
- Every topic and subtopic MUST be informative, intentional, and highly specific to the actual domain and motive of the discussion (e.g., "Database Migration Strategy" instead of "Tech Update", or "Q3 Marketing Alignment" instead of "General Discussion").
- Group items by their thematic subject matter, not by the time they occurred in the meeting.

Follow this hierarchical structure:
1. **Overall Meeting Topic & Description**: First, provide a single umbrella topic and description summarizing the entire meeting context.
2. **Level 1 Umbrella Topics**: Identify 1-3 high-level themes that cover the meeting. Provide a descriptive title and description.
3. **Level 2 Subtopics**: Break down each umbrella topic into specific sub-discussions. Provide a title and description.
4. **Segregated Points**: Under each subtopic, list specific points made. 
   - For each point, you MUST include the exact `source_key_moment_ids` (e.g. "km-1") that support or are related to this point. 
   - A point may reference multiple key moments.
   - Every key moment provided should ideally be mapped to at least one point."""),
        ("human", """--- METADATA ---
{metadata}

--- EXTRACTED KEY MOMENTS TO ORGANIZE ---
{moments_text}""")
    ])

    try:
        chain = prompt | client.with_structured_output(TopicSegregationResponse)
        res: TopicSegregationResponse = await chain.ainvoke({
            "metadata": metadata or "No metadata provided.",
            "moments_text": moments_text
        })
        # Ensure we return a dictionary
        topics_data = res.model_dump()
        logger.info(f"Successfully segregated into {len(topics_data.get('topics', []))} main topics.")
        return topics_data
    except Exception as e:
        logger.error(f"Failed to segregate topics using LLM: {e}")
        return {"topics": []}
