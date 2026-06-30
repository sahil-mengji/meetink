import logging
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

from app.pipeline.agents.summary_recap_agent import generate_summary_recap

logger = logging.getLogger(__name__)

class SummaryRecapState(TypedDict):
    key_moments: list[dict]
    topics_data: dict
    metadata_in: dict
    utterances: list[dict]
    
    # populated by nodes
    markdown_report: str
    citations_used: list[str]
    action_items: list[dict]

async def summary_recap_node(state: SummaryRecapState):
    """Passes key moments and topics to the summary recap agent."""
    logger.info("Executing summary recap node")
    report_data = await generate_summary_recap(
        key_moments=state.get("key_moments", []),
        topics_data=state.get("topics_data", {}),
        metadata=state.get("metadata_in", {}),
        utterances=state.get("utterances", [])
    )
    return {
        "markdown_report": report_data.get("markdown_report", ""),
        "citations_used": report_data.get("citations_used", []),
        "action_items": report_data.get("action_items", [])
    }

workflow = StateGraph(SummaryRecapState)
workflow.add_node("summary_recap", summary_recap_node)

workflow.set_entry_point("summary_recap")
workflow.add_edge(START, "summary_recap")
workflow.add_edge("summary_recap", END)

summary_recap_graph = workflow.compile()
