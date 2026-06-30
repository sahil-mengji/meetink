import logging
import logging
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from app.schemas.meeting import Utterance
from app.pipeline.agents.highlight_agent import extract_key_moments

logger = logging.getLogger(__name__)

class KeyMomentsState(TypedDict):
    utterances: list[dict]
    metadata_in: dict
    
    # populated by nodes
    annotated_utterances: list[dict]
    key_moments: list[dict]

async def intent_detection_node(state: KeyMomentsState):
    """Detects simple intents using keyword rules and populates annotated_utterances."""
    annotated_utterances = []
    for u_dict in state.get("utterances", []):
        text_lower = u_dict.get("text", "").lower()
        if "?" in u_dict.get("text", ""):
            intent = "question"
        elif any(w in text_lower for w in ("will", "i'll", "can", "let me", "going to", "shall")):
            intent = "action"
        elif any(w in text_lower for w in ("decided", "agreed", "let's go with", "final")):
            intent = "decision"
        else:
            intent = "statement"
        annotated_utterances.append({**u_dict, "intent": intent})
    
    return {"annotated_utterances": annotated_utterances}

async def key_moments_extraction_node(state: KeyMomentsState):
    utterances = [Utterance(**u) for u in state.get("utterances", [])]
    moments_data = await extract_key_moments(utterances)
    return {"key_moments": moments_data.get("key_moments", [])}

workflow = StateGraph(KeyMomentsState)
workflow.add_node("intent", intent_detection_node)
workflow.add_node("key_moments", key_moments_extraction_node)

workflow.set_entry_point("intent")
workflow.add_edge(START, "intent")
workflow.add_edge(START, "key_moments")

workflow.add_edge("intent", END)
workflow.add_edge("key_moments", END)

highlights_graph = workflow.compile()
