from __future__ import annotations

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage
from app.llm.client import TemporalInterpretResponse, get_chat_model
from app.schemas.meeting import TemporalMention, Utterance


async def interpret_mentions(
    mentions: list[TemporalMention],
    utterances: list[Utterance],
    llm: BaseChatModel | None = None,
) -> list[TemporalMention]:
    client = llm or get_chat_model()
    utterance_map = {u.id: u for u in utterances}
    interpreted: list[TemporalMention] = []
    
    chain = client.with_structured_output(TemporalInterpretResponse)

    for mention in mentions:
        ctx_parts = []
        for uid in mention.context_before_ids + [mention.utterance_id] + mention.context_after_ids:
            u = utterance_map.get(uid)
            if u:
                ctx_parts.append(f"{u.speaker}: {u.text}")
        context_text = "\n".join(ctx_parts)

        response = await chain.ainvoke([
            SystemMessage(content=(
                "Interpret the temporal mention. Return interpretation enum, resolved_datetime, "
                "owner if any, confidence, and calendar_action."
            )),
            HumanMessage(content=f"Mention: {mention.raw_text}\nContext:\n{context_text}")
        ])

        interpreted.append(
            mention.model_copy(
                update={
                    "interpretation": response.interpretation,
                    "resolved_datetime": response.resolved_datetime or mention.resolved_datetime,
                    "confidence": response.confidence,
                    "calendar_action": response.calendar_action,
                }
            )
        )
    return interpreted
