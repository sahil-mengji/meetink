import logging
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

from app.llm.client import InferredInsightsResponse, get_chat_model

logger = logging.getLogger(__name__)

async def generate_inferred_insights(
    markdown_report: str,
    action_items: list[dict],
    llm: BaseChatModel | None = None
) -> dict:
    """Generate external inferred insights, risks, and follow-up points based on the summary report."""
    client = llm or get_chat_model()
    
    logger.info("Generating Inferred Insights & Follow-ups.")

    if not markdown_report:
        return {"discussion_insights": [], "risks_and_blockers": [], "follow_up_points": []}

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a strategic meeting analyst. Your goal is to analyze a factual meeting summary and infer meta-insights, identify potential risks, and suggest logical follow-up points that go BEYOND just what was explicitly stated.

YOUR TASK IS TWO-FOLD:

STEP 1: DIMENSIONAL PLANNING
Before extracting any insights or risks, you must determine the *dimensions* that are relevant to this specific meeting context.
- For `risk_dimensions`, evaluate the topic (e.g., if it's an architecture meeting, dimensions might be "Scalability", "Data Loss". If it's HR, "Compliance", "Morale").
- For `insight_dimensions`, evaluate the topic (e.g., "Market Trend", "Technical Shift", "Team Dynamics").
Output these in the `risk_dimensions` and `insight_dimensions` arrays.

STEP 2: EXTRACTION
Based ONLY on those predefined dimensions, extract structured data across three categories:
1. Discussion Insights: High-level trends or deeper meanings aligned with your `insight_dimensions`.
2. Risks & Blockers: Unstated risks or bottlenecks aligned with your `risk_dimensions`.
3. Follow-up Points: Logical next steps or discussions that weren't explicitly assigned.

CRITICAL INSTRUCTION:
Do not just regurgitate the summary. Provide *external* insights that add value to the raw meeting transcript."""),
        ("human", """--- MEETING SUMMARY REPORT ---
{markdown_report}

--- EXPLICIT ACTION ITEMS ---
{action_items}""")
    ])

    try:
        chain = prompt | client.with_structured_output(InferredInsightsResponse)
        res: InferredInsightsResponse = await chain.ainvoke({
            "markdown_report": markdown_report,
            "action_items": action_items
        })
        report_data = res.model_dump()
        logger.info(f"Successfully generated inferred insights. Found {len(report_data.get('discussion_insights', []))} insights.")
        return report_data
    except Exception as e:
        logger.error(f"Failed to generate inferred insights using LLM: {e}")
        return {"discussion_insights": [], "risks_and_blockers": [], "follow_up_points": []}
