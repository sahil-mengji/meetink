from __future__ import annotations

from datetime import datetime

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage
from app.llm.client import GistResponse, get_chat_model
from app.schemas.meeting import (
    ActionItem,
    Decision,
    MeetingReport,
    RiskItem,
    SegmentAgentOutput,
    TemporalMention,
    TopicReport,
    TopicSegment,
)


async def generate_gist(segment_outputs: list[SegmentAgentOutput], llm: BaseChatModel | None = None) -> str:
    client = llm or get_chat_model()
    summaries = "\n".join(f"- {o.summary}" for o in segment_outputs if o.summary)
    chain = client.with_structured_output(GistResponse)
    response = await chain.ainvoke([
        SystemMessage(content="Write a short executive gist from topic summaries only. Do not invent facts."),
        HumanMessage(content=summaries or "No summaries available.")
    ])
    return response.gist


def build_meeting_report(
    meeting_id: str,
    segments: list[TopicSegment],
    segment_outputs: list[SegmentAgentOutput],
    all_actions: list[ActionItem],
    all_decisions: list[Decision],
    all_risks: list[RiskItem],
    temporal_mentions: list[TemporalMention],
    gist: str,
) -> MeetingReport:
    output_by_segment = {o.segment_id: o for o in segment_outputs}
    topics: list[TopicReport] = []

    for segment in segments:
        output = output_by_segment.get(segment.segment_id)
        topics.append(
            TopicReport(
                segment_id=segment.segment_id,
                title=segment.title,
                summary=output.summary if output else "",
                discussion_points=output.discussion_points if output else [],
                actions=output.actions if output else [],
                decisions=output.decisions if output else [],
                risks=output.risks if output else [],
            )
        )

    return MeetingReport(
        meeting_id=meeting_id,
        gist=gist,
        topics=topics,
        all_actions=all_actions,
        all_decisions=all_decisions,
        all_risks=all_risks,
        temporal_mentions=temporal_mentions,
        generated_at=datetime.utcnow(),
    )


def to_markdown(report: MeetingReport) -> str:
    lines = [
        f"# Meeting Report — {report.meeting_id}",
        "",
        f"**Generated:** {report.generated_at.isoformat()}",
        "",
        "## Executive Gist",
        report.gist,
        "",
    ]

    for topic in report.topics:
        lines.extend(
            [
                f"## {topic.title}",
                "",
                topic.summary,
                "",
            ]
        )
        if topic.actions:
            lines.append("### Actions")
            for a in topic.actions:
                owner = a.owner or "Unassigned"
                deadline = a.deadline.isoformat() if a.deadline else "TBD"
                lines.append(f"- {a.text} (owner: {owner}, deadline: {deadline})")
            lines.append("")
        if topic.decisions:
            lines.append("### Decisions")
            for d in topic.decisions:
                lines.append(f"- {d.text}")
            lines.append("")
        if topic.risks:
            lines.append("### Risks")
            for r in topic.risks:
                lines.append(f"- {r.text}")
            lines.append("")

    if report.temporal_mentions:
        lines.append("## Temporal Mentions")
        for m in report.temporal_mentions:
            resolved = m.resolved_datetime.isoformat() if m.resolved_datetime else "unresolved"
            lines.append(f"- `{m.raw_text}` → {m.interpretation.value} ({resolved})")
        lines.append("")

    return "\n".join(lines)
