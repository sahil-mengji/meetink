import logging
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

from app.pipeline.agents.knowledge_agent import generate_knowledge_extract

logger = logging.getLogger(__name__)

class KnowledgeState(TypedDict):
    markdown_report: str
    action_items: list[dict]
    inferred_insights: dict
    
    # populated by nodes
    permanent_facts: list[dict]

async def knowledge_node(state: KnowledgeState):
    """Passes context to the knowledge agent."""
    logger.info("Executing knowledge node")
    report_data = await generate_knowledge_extract(
        markdown_report=state.get("markdown_report", ""),
        action_items=state.get("action_items", []),
        inferred_insights=state.get("inferred_insights", {})
    )
    return {
        "permanent_facts": report_data.get("permanent_facts", [])
    }

workflow = StateGraph(KnowledgeState)
workflow.add_node("knowledge_extract", knowledge_node)

workflow.set_entry_point("knowledge_extract")
workflow.add_edge(START, "knowledge_extract")
workflow.add_edge("knowledge_extract", END)

knowledge_graph = workflow.compile()
