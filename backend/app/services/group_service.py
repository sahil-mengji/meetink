"""group_service.py
Manages KnowledgeGroup records. Called at the end of the pipeline to keep
group metadata in sync whenever a meeting is processed.
"""
from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db import models

logger = logging.getLogger("app.services.group_service")


def _tag_slug(tag: str) -> str:
    """Convert a tag to a stable slug id."""
    return re.sub(r"[^a-z0-9]+", "-", tag.lower().strip()).strip("-")


def list_groups() -> list[dict]:
    """Return all knowledge groups with their member meetings, sorted by recorded_at."""
    db: Session = SessionLocal()
    try:
        groups = db.execute(
            select(models.KnowledgeGroup).order_by(models.KnowledgeGroup.group_title)
        ).scalars().all()

        # Fetch all meetings with their tags in one go
        facts = db.execute(
            select(models.MeetingKnowledgeFact.meeting_id, models.MeetingKnowledgeFact.tags)
        ).all()

        # Build a tag -> [meeting_id] mapping
        tag_to_meetings: dict[str, set[str]] = {}
        for f in facts:
            for t in (f.tags or []):
                tag_to_meetings.setdefault(t, set()).add(f.meeting_id)

        # Fetch all meeting base info
        meetings_rows = db.execute(
            select(
                models.Meeting.id,
                models.Meeting.title,
                models.Meeting.recorded_at,
                models.Meeting.duration,
                models.Meeting.status,
                models.Meeting.participants,
            )
        ).all()
        meeting_map = {r.id: r for r in meetings_rows}

        # Aggregate tags per meeting for display
        tags_by_meeting: dict[str, set[str]] = {}
        for f in facts:
            for t in (f.tags or []):
                tags_by_meeting.setdefault(f.meeting_id, set()).add(t)

        result = []
        for g in groups:
            member_ids = tag_to_meetings.get(g.tag, set())
            member_meetings = []
            for mid in member_ids:
                row = meeting_map.get(mid)
                if row:
                    member_meetings.append({
                        "id": row.id,
                        "title": row.title,
                        "recorded_at": row.recorded_at.isoformat() if row.recorded_at else "",
                        "duration": row.duration,
                        "status": row.status,
                        "participants": row.participants,
                        "tags": list(tags_by_meeting.get(row.id, set())),
                    })

            member_meetings.sort(key=lambda m: m["recorded_at"])

            result.append({
                "id": g.id,
                "tag": g.tag,
                "group_title": g.group_title or g.tag.title(),
                "group_description": g.group_description or "",
                "group_goal": g.group_goal or "",
                "progress_gist": g.progress_gist or f"{len(member_meetings)} meeting(s)",
                "meeting_count": len(member_meetings),
                "updated_at": g.updated_at.isoformat() if g.updated_at else "",
                "meetings": member_meetings,
            })

        return result
    except Exception as e:
        logger.error(f"[GroupService] Error listing groups: {e}", exc_info=True)
        raise
    finally:
        db.close()


async def update_groups_for_meeting(meeting_id: str, tags: list[str]) -> None:
    """Called after a meeting is fully processed.
    For each tag, upsert a KnowledgeGroup and re-synthesize its metadata with the LLM
    only if the meeting count changed (i.e. new meeting added to the group).
    """
    if not tags:
        logger.info(f"[GroupService] Meeting {meeting_id} has no tags — skipping group update.")
        return

    from app.llm.group_synthesis_agent import get_group_synthesis_graph

    db: Session = SessionLocal()
    try:
        # Gather meeting summaries for context
        # We load this once and reuse per tag
        all_facts = db.execute(
            select(models.MeetingKnowledgeFact.meeting_id, models.MeetingKnowledgeFact.tags)
        ).all()
        tag_to_meeting_ids: dict[str, set[str]] = {}
        for f in all_facts:
            for t in (f.tags or []):
                tag_to_meeting_ids.setdefault(t, set()).add(f.meeting_id)

        for tag in tags:
            slug = _tag_slug(tag)
            existing = db.execute(
                select(models.KnowledgeGroup).where(models.KnowledgeGroup.id == slug)
            ).scalar_one_or_none()

            member_ids = tag_to_meeting_ids.get(tag, set())
            new_count = len(member_ids)

            # Only re-synthesize if the meeting count changed or group is new
            should_synthesize = (existing is None) or (existing.meeting_count != new_count)

            if not should_synthesize:
                logger.info(f"[GroupService] Tag '{tag}' group unchanged — skipping LLM synthesis.")
                continue

            # Load meeting summaries for LLM context
            summaries = []
            for mid in member_ids:
                m_row = db.execute(select(models.Meeting).where(models.Meeting.id == mid)).scalar_one_or_none()
                recap_row = db.execute(select(models.MeetingSummaryRecap).where(models.MeetingSummaryRecap.meeting_id == mid)).scalar_one_or_none()
                topic_row = db.execute(select(models.MeetingTopic).where(models.MeetingTopic.meeting_id == mid)).scalar_one_or_none()
                if m_row:
                    summaries.append({
                        "title": m_row.title,
                        "recorded_at": m_row.recorded_at.isoformat() if m_row.recorded_at else "",
                        "markdown_report": recap_row.markdown_report if recap_row else "",
                        "topics_data": topic_row.topics_data if topic_row else {},
                    })

            logger.info(f"[GroupService] Re-synthesizing group for tag '{tag}' with {len(summaries)} meetings.")
            graph = get_group_synthesis_graph()
            result = await graph.ainvoke({
                "tag": tag,
                "meeting_summaries": summaries,
                "group_title": "",
                "group_description": "",
                "group_goal": "",
                "progress_gist": "",
            })

            if existing:
                existing.group_title = result["group_title"]
                existing.group_description = result["group_description"]
                existing.group_goal = result["group_goal"]
                existing.progress_gist = result["progress_gist"]
                existing.meeting_count = new_count
                existing.updated_at = datetime.utcnow()
            else:
                new_group = models.KnowledgeGroup(
                    id=slug,
                    tag=tag,
                    group_title=result["group_title"],
                    group_description=result["group_description"],
                    group_goal=result["group_goal"],
                    progress_gist=result["progress_gist"],
                    meeting_count=new_count,
                    updated_at=datetime.utcnow(),
                )
                db.add(new_group)

            db.commit()
            logger.info(f"[GroupService] Group '{tag}' upserted: title='{result['group_title']}', gist='{result['progress_gist']}'")

    except Exception as e:
        logger.error(f"[GroupService] Error updating groups for meeting {meeting_id}: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()
