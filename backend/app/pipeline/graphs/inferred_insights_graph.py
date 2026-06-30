import logging
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

from app.pipeline.agents.inferred_insights_agent import generate_inferred_insights

logger = logging.getLogger(__name__)

class InferredInsightsState(TypedDict):
    markdown_report: str
    action_items: list[dict]
    
    # populated by nodes
    discussion_insights: list[dict]
    risks_and_blockers: list[dict]
    follow_up_points: list[dict]

async def inferred_insights_node(state: InferredInsightsState):
    """Passes summary output to the insights agent."""
    logger.info("Executing inferred insights node")
    report_data = await generate_inferred_insights(
        markdown_report=state.get("markdown_report", ""),
        action_items=state.get("action_items", [])
    )
    return {
        "discussion_insights": report_data.get("discussion_insights", []),
        "risks_and_blockers": report_data.get("risks_and_blockers", []),
        "follow_up_points": report_data.get("follow_up_points", [])
    }

workflow = StateGraph(InferredInsightsState)
workflow.add_node("inferred_insights", inferred_insights_node)

workflow.set_entry_point("inferred_insights")
workflow.add_edge(START, "inferred_insights")
workflow.add_edge("inferred_insights", END)

inferred_insights_graph = workflow.compile()
