import logging
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

from app.llm.client import TeamAnalysisResponse, get_chat_model

logger = logging.getLogger(__name__)

async def generate_team_analysis(
    markdown_report: str,
    metadata_in: dict,
    speakers_list: list[str] | None = None,
    llm: BaseChatModel | None = None
) -> dict:
    """Analyze the meeting to understand team dynamics and sentiment."""
    client = llm or get_chat_model()
    
    logger.info("Generating Team Analysis.")

    if not markdown_report:
        return {"collaboration_dynamics": [], "decision_drivers": [], "overall_sentiment": "", "individual_feedback": []}

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert organizational psychologist analyzing a meeting.
YOUR TASK:
Analyze the meeting context to extract: 
1. Collaboration Dynamics: Provide 2-4 bullet points analyzing how well the team worked together (e.g. conflict, synergy, or miscommunication).
2. Decision Drivers: Who were the main people driving the conversation and making the decisions?
3. Overall Sentiment: Describe the overall emotional tone of the meeting (e.g. "Tense but productive", "Rushed and chaotic").
4. Individual Feedback: For each participant (speaker), provide granular feedback.
   - Categorize their speaker type (e.g., Facilitator, Driver, Observer, Subject Matter Expert, Challenger).
   - Estimate the number of key moments they were involved in.
   - Provide 1-2 sentences of specific feedback on their communication style, behavior, or contribution to the meeting's goals.
   - CRITICAL: You must EXACTLY match the spelling of the speaker names provided below in the `RAW SPEAKERS` section."""),
        ("human", """--- MEETING SUMMARY ---
{markdown_report}

--- METADATA ---
{metadata_in}

--- RAW SPEAKERS ---
{speakers_list}""")
    ])

    try:
        chain = prompt | client.with_structured_output(TeamAnalysisResponse)
        res: TeamAnalysisResponse = await chain.ainvoke({
            "markdown_report": markdown_report,
            "metadata_in": metadata_in,
            "speakers_list": ", ".join(speakers_list) if speakers_list else "Unknown speakers"
        })
        report_data = res.model_dump()
        logger.info("Successfully generated Team Analysis.")
        return report_data
    except Exception as e:
        logger.error(f"Failed to generate Team Analysis using LLM: {e}")
        return {"collaboration_dynamics": ["Failed to analyze"], "decision_drivers": [], "overall_sentiment": "Unknown"}
