import logging
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

from app.pipeline.agents.team_analysis_agent import generate_team_analysis

logger = logging.getLogger(__name__)

class TeamAnalysisState(TypedDict):
    markdown_report: str
    metadata_in: dict
    speakers_list: list[str]
    
    # populated by nodes
    collaboration_dynamics: str
    overall_sentiment: str
    individual_feedback: list[dict]

async def team_analysis_node(state: TeamAnalysisState):
    """Passes context to the team analysis agent."""
    logger.info("Executing team analysis node")
    report_data = await generate_team_analysis(
        markdown_report=state.get("markdown_report", ""),
        metadata_in=state.get("metadata_in", {}),
        speakers_list=state.get("speakers_list", [])
    )
    return {
        "collaboration_dynamics": report_data.get("collaboration_dynamics", ""),
        "decision_drivers": report_data.get("decision_drivers", []),
        "overall_sentiment": report_data.get("overall_sentiment", ""),
        "individual_feedback": report_data.get("individual_feedback", [])
    }

workflow = StateGraph(TeamAnalysisState)
workflow.add_node("team_analysis", team_analysis_node)

workflow.set_entry_point("team_analysis")
workflow.add_edge(START, "team_analysis")
workflow.add_edge("team_analysis", END)

team_analysis_graph = workflow.compile()
