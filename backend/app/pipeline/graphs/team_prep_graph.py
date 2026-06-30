import logging
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

from app.pipeline.agents.team_prep_agent import generate_team_prep

logger = logging.getLogger(__name__)

class TeamPrepState(TypedDict):
    action_items: list[dict]
    inferred_insights: dict
    
    # populated by nodes
    team_announcements: list[str]
    structured_assignments: list[dict]

async def team_prep_node(state: TeamPrepState):
    """Passes context to the team prep agent."""
    logger.info("Executing team prep node")
    report_data = await generate_team_prep(
        action_items=state.get("action_items", []),
        inferred_insights=state.get("inferred_insights", {})
    )
    return {
        "team_announcements": report_data.get("team_announcements", []),
        "structured_assignments": report_data.get("structured_assignments", [])
    }

workflow = StateGraph(TeamPrepState)
workflow.add_node("team_prep", team_prep_node)

workflow.set_entry_point("team_prep")
workflow.add_edge(START, "team_prep")
workflow.add_edge("team_prep", END)

team_prep_graph = workflow.compile()
