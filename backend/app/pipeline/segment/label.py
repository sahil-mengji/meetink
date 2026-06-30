from __future__ import annotations

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage
from app.llm.client import SegmentLabelResponse, get_chat_model
from app.schemas.meeting import Utterance

async def label_segment(utterances: list[Utterance], llm: BaseChatModel | None = None) -> tuple[str, float]:
    client = llm or get_chat_model()
    excerpt = "\n".join(f"{u.speaker}: {u.text}" for u in utterances[:8])
    first_sentence = utterances[0].text.split(".")[0][:80] if utterances else "Discussion"

    chain = client.with_structured_output(SegmentLabelResponse)
    response = await chain.ainvoke([
        SystemMessage(content="Label this meeting topic segment with a short title and confidence 0-1."),
        HumanMessage(content=excerpt or first_sentence)
    ])
    
    title = response.title.strip() or first_sentence
    return title, float(response.confidence)
