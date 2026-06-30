import logging
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

from app.llm.client import SummaryRecapResponse, get_chat_model

logger = logging.getLogger(__name__)

async def generate_summary_recap(
    key_moments: list[dict],
    topics_data: dict,
    metadata: dict | None = None,
    utterances: list[dict] | None = None,
    llm: BaseChatModel | None = None
) -> dict:
    """Generate a comprehensive summary and recap report with Perplexity-style citations."""
    client = llm or get_chat_model()
    
    logger.info("Generating Summary & Recap report.")

    if not key_moments and not topics_data.get("topics"):
        if not utterances:
            return {"markdown_report": "No meeting data available.", "citations_used": [], "action_items": []}
            
        # Fallback for very short meetings without key moments
        logger.info("No key moments found, generating short transcript summary.")
        transcript_lines = []
        for u in utterances:
            speaker = u.get('speaker', 'Unknown')
            text = u.get('text', '')
            transcript_lines.append(f"{speaker}: {text}")
        
        transcript_text = "\n".join(transcript_lines)[:10000] # Safe limit
        
        fallback_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert meeting analyst. The provided meeting was very short and did not generate structured key moments. 
            Write a brief, readable Markdown summary of the meeting transcript provided. 
            Do NOT include an "# Executive Summary" heading. Start your text directly with the summary paragraphs.
            If there are any clear action items, include them in the structured `action_items` output field.
            CRITICAL: You MUST output empty lists `[]` for `citations_used` and `planned_additional_sections` fields, as they are required by the JSON schema."""),
            ("human", "--- TRANSCRIPT ---\n{transcript}\n\n--- METADATA ---\n{metadata}")
        ])
        
        try:
            chain = fallback_prompt | client.with_structured_output(SummaryRecapResponse)
            res = await chain.ainvoke({
                "transcript": transcript_text,
                "metadata": metadata or "No metadata provided."
            })
            report_data = res.model_dump()
            logger.info("Successfully generated fallback summary for short meeting.")
            return report_data
        except Exception as e:
            logger.error(f"Failed to generate fallback summary: {e}")
            return {"markdown_report": "Failed to generate report.", "citations_used": [], "action_items": []}

    # Format inputs for prompt
    moments_text_lines = []
    for km in key_moments:
        # Strip unnecessary fields, just pass ID and text
        km_id = km.get("id", "unknown_id")
        text = km.get("text", "")
        moments_text_lines.append(f"[{km_id}]: {text}")
        
    moments_text = "\n".join(moments_text_lines)
    
    # Topic data as a string
    import json
    # Only keep title and description fields for the prompt to save tokens
    # the points are already in the moments text. We just want to give the structural hierarchy.
    topics_hierarchy_text = json.dumps(topics_data, indent=2)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert technical writer and meeting analyst. Your goal is to write a highly readable, COMPREHENSIVE, and EXTENSIVELY DETAILED Markdown summary report of a meeting.
        
CRITICAL INSTRUCTION - EXHAUSTIVE COVERAGE BUT STRICT FACTUALITY:
- You MUST cover EVERYTHING discussed. Do not lose out on small information or nuances.
- ONLY write exactly what was discussed and who said what.
- DO NOT add your own insights, follow-ups, hallucinations, or external information.
- Extensively use specific person references (e.g., "Alice stated...", "Bob explained...").
- DO NOT use generic pronouns like "it", "that", "this". Explicitly mention the topic by name every time.

CRITICAL INSTRUCTION - MARKDOWN FORMATTING:
- Do NOT write dense paragraphs. Extensively use BULLET POINTS for maximum readability.
- Use TABLES wherever possible (e.g., for Decisions or comparing approaches).
- Use blockquotes (`>`) for important callouts.
- IMPORTANT: Since you are returning a JSON string, you MUST output actual newline escape characters (`\\n`) to format the Markdown! Use `\\n\\n` between sections and paragraphs. If you do not include `\\n\\n`, the entire report will render as one unreadable block of text.

CRITICAL INSTRUCTION - CITATIONS:
- You MUST use inline citations formatted EXACTLY as `[km-X]` whenever you reference a fact, decision, or action. 
- You MUST only use IDs that exist in the "Key Moments" section. Do not invent citations.

CRITICAL INSTRUCTION - ACTION ITEMS:
- You must additionally extract explicit ACTION ITEMS. Output them in the structured `action_items` list.
- An action item is ONLY a specific task assigned to a specific person with a specific deadline.
- Do NOT extract follow-up points as action items. If there is no specific owner, do NOT add it.

Do NOT add any wrapper tags like ```markdown. Just output valid raw Markdown inside the `markdown_report` JSON field.

REPORT STRUCTURE & DYNAMIC PLANNING:
The output MUST be a single, cohesive Markdown string. Use headings (`#`, `##`, `###`) logically, separated by `\\n\\n`.
You MUST structure the report exactly with these minimum sections:
- Executive Summary Text (Start your markdown directly with the summary paragraphs. Do NOT include an "# Executive Summary" heading)
- ## Timeline of Discussion
- ## Decisions
- ## Key Highlights

DYNAMIC SECTIONS:
Before generating the markdown report, you must evaluate the meeting context and output a `planned_additional_sections` array.
Based on this plan, generate those additional headings in the markdown report (e.g., `## Architecture Changes`, `## Q3 Roadmap`).
WARNING: Do NOT plan or generate sections for "Risks", "Concerns", "Blockers", or "Insights". These are explicitly handled by a separate pipeline agent."""),
        ("human", """--- MEETING HIERARCHY ---
{topics_hierarchy_text}

--- KEY MOMENTS (WITH CITATION IDS) ---
{moments_text}

--- METADATA ---
{metadata}""")
    ])

    try:
        chain = prompt | client.with_structured_output(SummaryRecapResponse)
        res: SummaryRecapResponse = await chain.ainvoke({
            "topics_hierarchy_text": topics_hierarchy_text,
            "moments_text": moments_text,
            "metadata": metadata or "No metadata provided."
        })
        report_data = res.model_dump()
        logger.info(f"Successfully generated summary report. Citations used: {len(report_data.get('citations_used', []))}")
        return report_data
    except Exception as e:
        logger.error(f"Failed to generate summary recap using LLM: {e}")
        return {"markdown_report": "Failed to generate report.", "citations_used": []}
