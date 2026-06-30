import logging
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

from app.pipeline.agents.topic_segregation_agent import segregate_topics

logger = logging.getLogger(__name__)

class TopicSegregationState(TypedDict):
    key_moments: list[dict]
    metadata_in: dict
    
    # populated by nodes
    overall_topic: str
    overall_description: str
    topics: list[dict]

async def topics_segregation_node(state: TopicSegregationState):
    """Passes key moments to the topic segregation agent."""
    logger.info("Executing topics segregation node")
    topics_data = await segregate_topics(
        key_moments=state.get("key_moments", []),
        metadata=state.get("metadata_in", {})
    )
    return {
        "overall_topic": topics_data.get("overall_topic", ""),
        "overall_description": topics_data.get("overall_description", ""),
        "topics": topics_data.get("topics", [])
    }

workflow = StateGraph(TopicSegregationState)
workflow.add_node("topics_segregation", topics_segregation_node)

workflow.set_entry_point("topics_segregation")
workflow.add_edge(START, "topics_segregation")
workflow.add_edge("topics_segregation", END)

topic_segregation_graph = workflow.compile()
