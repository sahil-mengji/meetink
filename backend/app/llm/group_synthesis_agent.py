"""group_synthesis_agent.py
LangGraph mini-graph that takes a tag name + list of meeting summaries and produces:
  - group_title
  - group_description
  - group_goal
  - progress_gist
"""
from __future__ import annotations

import logging
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.llm.client import get_chat_model

logger = logging.getLogger("app.llm.group_synthesis_agent")


class GroupSynthesisState(TypedDict):
    tag: str
    meeting_summaries: list[dict]  # [{title, recorded_at, markdown_report, topics_data}]
    group_title: str
    group_description: str
    group_goal: str
    progress_gist: str


async def _synthesize(state: GroupSynthesisState) -> dict:
    tag = state["tag"]
    summaries = state["meeting_summaries"]

    if not summaries:
        return {
            "group_title": tag.title(),
            "group_description": f"Meetings related to {tag}.",
            "group_goal": "",
            "progress_gist": "No meetings processed yet.",
        }

    # Build a compact context for the LLM
    meeting_blocks = []
    for i, m in enumerate(summaries, 1):
        topic_overview = m.get("topics_data", {}).get("overall_description", "")
        report_snippet = (m.get("markdown_report") or "")[:600]
        meeting_blocks.append(
            f"Meeting {i}: {m['title']} ({m['recorded_at'][:10]})\n"
            f"Topic Overview: {topic_overview}\n"
            f"Summary Excerpt: {report_snippet}"
        )

    context = "\n\n---\n\n".join(meeting_blocks)

    prompt = f"""You are a knowledge architect analyzing a cluster of related meetings grouped under the tag "{tag}".

Below are summaries of all meetings in this group:

{context}

Produce a JSON object with these fields:
- "group_title": A concise, meaningful title for this group of meetings (5-8 words). Reflect the shared theme, not just the tag name.
- "group_description": 1-2 sentences describing what this group of meetings is collectively about.
- "group_goal": 1 sentence describing the overarching goal or objective that runs through all these meetings.
- "progress_gist": A short phrase (3-8 words) summarizing the current state of progress across these meetings. E.g. "3 meetings, architecture decided", "In progress – 2 open blockers", "Completed: shipped to production".

Respond ONLY with valid JSON, no explanation."""

    llm = get_chat_model()
    try:
        response = await llm.ainvoke(prompt)
        text = response.content if hasattr(response, "content") else str(response)

        # Parse JSON from the response
        import json, re
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            data = json.loads(json_match.group())
            return {
                "group_title": data.get("group_title", tag.title()),
                "group_description": data.get("group_description", ""),
                "group_goal": data.get("group_goal", ""),
                "progress_gist": data.get("progress_gist", f"{len(summaries)} meeting(s)"),
            }
    except Exception as e:
        logger.error(f"[GroupSynthesis] LLM failed for tag '{tag}': {e}", exc_info=True)

    # Fallback
    return {
        "group_title": tag.replace("-", " ").title(),
        "group_description": f"Meetings related to {tag}.",
        "group_goal": "",
        "progress_gist": f"{len(summaries)} meeting(s)",
    }


def build_group_synthesis_graph():
    g = StateGraph(GroupSynthesisState)
    g.add_node("synthesize", _synthesize)
    g.set_entry_point("synthesize")
    g.add_edge("synthesize", END)
    return g.compile()


_graph = None


def get_group_synthesis_graph():
    global _graph
    if _graph is None:
        _graph = build_group_synthesis_graph()
    return _graph
