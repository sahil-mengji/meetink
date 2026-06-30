import logging
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

from app.llm.client import TeamPrepResponse, get_chat_model

logger = logging.getLogger(__name__)

async def generate_team_prep(
    action_items: list[dict],
    inferred_insights: dict,
    llm: BaseChatModel | None = None
) -> dict:
    """Structure the action items into grouped assignments for team handoff."""
    client = llm or get_chat_model()
    
    logger.info("Generating Team Action Prep.")

    if not action_items:
        return {"team_announcements": [], "structured_assignments": []}

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Technical Project Manager. Your job is to take raw Action Items and Insights from a meeting and format them into a clean, grouped handoff for the team.
YOUR TASK:
1. Group the assignments by Owner so each person has a clear list of what they need to do.
2. Write a few high-level 'Team Announcements' derived from the insights or general action items (e.g., "The dashboard deadline is moved to next week.")."""),
        ("human", """--- RAW ACTION ITEMS ---
{action_items}

--- MEETING INSIGHTS & FOLLOW-UPS ---
{inferred_insights}""")
    ])

    try:
        chain = prompt | client.with_structured_output(TeamPrepResponse)
        res: TeamPrepResponse = await chain.ainvoke({
            "action_items": action_items,
            "inferred_insights": inferred_insights
        })
        report_data = res.model_dump()
        logger.info(f"Successfully generated Team Prep. {len(report_data.get('structured_assignments', []))} assignees found.")
        return report_data
    except Exception as e:
        logger.error(f"Failed to generate Team Prep using LLM: {e}")
        return {"team_announcements": [], "structured_assignments": []}
