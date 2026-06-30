import logging
import asyncio
import uuid
from pydantic import BaseModel, Field
from sqlalchemy import select
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

from app.llm.client import KnowledgeExtractResponse, get_chat_model, get_embedding_model
from app.db.database import SessionLocal
from app.db.models import KnowledgeTag

logger = logging.getLogger(__name__)

class TagGenerationResponse(BaseModel):
    tags: list[str] = Field(description="Newly generated concise tags (1-2 words)")

async def _resolve_and_generate_tags(fact_text: str, llm: BaseChatModel) -> list[str]:
    embedding_model = get_embedding_model()
    
    # 1. Embed the fact_text
    try:
        fact_vector = await asyncio.to_thread(embedding_model.embed_query, fact_text)
    except Exception as e:
        logger.error(f"Failed to embed fact text: {e}")
        return []

    # 2. Search DB for matching tags (cosine distance < 0.6)
    def _search_db():
        with SessionLocal() as db:
            stmt = select(KnowledgeTag, KnowledgeTag.embedding.cosine_distance(fact_vector).label("distance")).where(
                KnowledgeTag.embedding.cosine_distance(fact_vector) < 0.6
            ).order_by("distance").limit(3)
            rows = db.execute(stmt).all()
            return [row[0] for row in rows]

    try:
        matching_tags_db = await asyncio.to_thread(_search_db)
    except Exception as e:
        logger.error(f"DB search for tags failed: {e}")
        matching_tags_db = []

    matching_tags = [t.tag_name for t in matching_tags_db]

    # 3. If we have 3 tags, just increment usage and return
    if len(matching_tags) >= 3:
        def _increment():
            with SessionLocal() as db:
                for t_name in matching_tags:
                    t = db.query(KnowledgeTag).filter(KnowledgeTag.tag_name == t_name).first()
                    if t:
                        t.usage_count += 1
                db.commit()
        await asyncio.to_thread(_increment)
        return matching_tags[:3]

    # 4. We need more tags. Ask LLM.
    needed = 3 - len(matching_tags)
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"You are a tagging assistant. We need exactly {needed} new, concise tag(s) (1-2 words each) for the following fact. We already have these tags: {matching_tags}. DO NOT output the existing tags, only the NEW ones."),
        ("human", "Fact: {fact}")
    ])
    
    try:
        chain = prompt | llm.with_structured_output(TagGenerationResponse)
        res = await chain.ainvoke({"fact": fact_text})
        new_tags = res.tags[:needed]
    except Exception as e:
        logger.error(f"Failed to generate tags: {e}")
        new_tags = []

    # 5. Embed and save new tags
    if new_tags:
        def _save_new_tags(tags):
            with SessionLocal() as db:
                for tag in tags:
                    tag = tag.strip().title()
                    existing = db.query(KnowledgeTag).filter(KnowledgeTag.tag_name == tag).first()
                    if not existing:
                        emb = embedding_model.embed_query(tag)
                        new_tag_record = KnowledgeTag(
                            id=str(uuid.uuid4()),
                            tag_name=tag,
                            embedding=emb,
                            usage_count=1
                        )
                        db.add(new_tag_record)
                    else:
                        existing.usage_count += 1
                db.commit()
        try:
            await asyncio.to_thread(_save_new_tags, new_tags)
        except Exception as e:
            logger.error(f"Failed to save new tags: {e}")
            
    # Clean up formatting for returned tags
    return matching_tags + [t.strip().title() for t in new_tags]

async def generate_knowledge_extract(
    markdown_report: str,
    action_items: list[dict],
    inferred_insights: dict,
    llm: BaseChatModel | None = None
) -> dict:
    """Extract permanent facts for the Knowledge Library and dynamically resolve/generate tags."""
    client = llm or get_chat_model()
    
    logger.info("Extracting Knowledge Library facts.")

    if not markdown_report:
        return {"permanent_facts": []}

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Knowledge Base Curator. Your job is to extract permanent, long-term facts, decisions, and architectural choices from a meeting summary.
Do NOT include short-term action items or transient complaints. Only extract things that a future employee would need to know 6 months from now."""),
        ("human", """--- MEETING SUMMARY REPORT ---
{markdown_report}

--- ACTION ITEMS ---
{action_items}

--- INFERRED INSIGHTS ---
{inferred_insights}""")
    ])

    try:
        chain = prompt | client.with_structured_output(KnowledgeExtractResponse)
        res: KnowledgeExtractResponse = await chain.ainvoke({
            "markdown_report": markdown_report,
            "action_items": action_items,
            "inferred_insights": inferred_insights
        })
        report_data = res.model_dump()
        
        # Concurrently resolve tags for all extracted facts
        facts = report_data.get("permanent_facts", [])
        if facts:
            tasks = [_resolve_and_generate_tags(f["fact"], client) for f in facts]
            tags_results = await asyncio.gather(*tasks)
            
            for i, fact in enumerate(facts):
                fact["tags"] = tags_results[i]
                
        logger.info(f"Successfully extracted {len(facts)} permanent facts with semantic tags.")
        return report_data
    except Exception as e:
        logger.error(f"Failed to extract knowledge using LLM: {e}")
        return {"permanent_facts": []}
