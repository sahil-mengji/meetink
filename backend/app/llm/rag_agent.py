import ast
import json
from typing import Optional, List, Any
from langchain_core.tools import tool
from sqlalchemy import select
from sqlalchemy.orm import Session
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage, HumanMessage

from app.db.database import SessionLocal
from app.db import models
from app.llm.client import get_embedding_model, get_chat_model


def _coerce_metadata(metadata: Any) -> dict:
    if isinstance(metadata, dict):
        return metadata
    if isinstance(metadata, str):
        try:
            return ast.literal_eval(metadata)
        except (ValueError, SyntaxError):
            try:
                return json.loads(metadata)
            except json.JSONDecodeError:
                return {}
    return {}


def _format_citation_block(chunk_type: str, metadata: Any, meeting_id: Optional[str] = None) -> str:
    """Build explicit citation tags so the LLM copies exact IDs instead of renumbering."""
    meta = _coerce_metadata(metadata)
    lines: list[str] = []

    def format_tag(t):
        return f"[{meeting_id}:{t}]" if meeting_id else f"[{t}]"

    type_tags = {
        "key_moment": ("key_moment_id", "Key moment"),
        "action_item": ("action_item_citation", "Action item"),
        "topic": ("topic_citation", "Topic"),
        "knowledge_fact": ("knowledge_fact_citation", "Knowledge fact"),
    }
    if chunk_type in type_tags:
        field, label = type_tags[chunk_type]
        tag = meta.get(field)
        if tag:
            lines.append(f"{label} tag: {format_tag(tag)}")

    source_ids = meta.get("source_utterance_ids") or []
    if source_ids:
        formatted = ", ".join(format_tag(uid) for uid in source_ids)
        lines.append(
            "Transcript utterance IDs (0-based — cite EXACTLY these bracket numbers, "
            f"never renumber as 1st/2nd/3rd item): {formatted}"
        )

    km_ids = meta.get("source_key_moment_ids") or []
    if km_ids:
        formatted = ", ".join(format_tag(km_id) for km_id in km_ids)
        lines.append(f"Related key moment tags: {formatted}")

    doc_refs = meta.get("source_doc_refs") or []
    if doc_refs:
        formatted = ", ".join(format_tag(cid) for cid in doc_refs)
        lines.append(f"Document chunk tags: {formatted}")

    return "\n".join(lines) if lines else "No citation metadata — use fetch_transcript_context to locate sources."


@tool
def search_meetings(query: str, meeting_id: Optional[str] = None) -> str:
    """
    Search the semantic meeting database for relevant topics, key moments, action items, or summaries.
    Always use this tool first when asked a question about what happened in a meeting.
    Use meeting_id if you already know the exact meeting you want to search.
    Returns highly relevant semantic chunks with their source utterance IDs.
    """
    db: Session = SessionLocal()
    try:
        embedding_model = get_embedding_model()
        query_vector = embedding_model.embed_query(query)
        
        stmt = select(models.MeetingSemanticChunk).order_by(
            models.MeetingSemanticChunk.embedding.cosine_distance(query_vector)
        ).limit(10)
        
        if meeting_id:
            stmt = stmt.where(models.MeetingSemanticChunk.meeting_id == meeting_id)
            
        chunks = db.execute(stmt).scalars().all()
        if not chunks:
            return "No relevant meeting information found."
            
        results = []
        for i, c in enumerate(chunks):
            m = db.execute(select(models.Meeting.title, models.Meeting.recorded_at).where(models.Meeting.id == c.meeting_id)).first()
            m_title = m.title if m else "Unknown Meeting"
            m_date = m.recorded_at.isoformat() if m and m.recorded_at else ""
            
            citation_block = _format_citation_block(c.chunk_type, c.metadata_dict, c.meeting_id)
            res = (
                f"--- Result {i+1} ---\n"
                f"Meeting: {m_title}\n"
                f"Meeting ID: {c.meeting_id}\n"
                f"Date: {m_date}\n"
                f"Type: {c.chunk_type}\n"
                f"Content: {c.text}\n"
                f"Available Citations (copy these tags verbatim into your answer):\n"
                f"{citation_block}"
            )
            results.append(res)
            
        return "\n\n".join(results)
    finally:
        db.close()


@tool
def fetch_transcript_context(meeting_id: str, target_utterance_ids: List[str], context_window: int = 5) -> str:
    """
    Fetch the raw transcript text surrounding specific utterance IDs in a meeting.
    Use this when you have found a Key Moment or Topic from search_meetings, but need 
    the exact granular conversation (e.g., to see exactly who said what or why).
    """
    db: Session = SessionLocal()
    try:
        transcript = db.execute(select(models.MeetingTranscript).where(models.MeetingTranscript.meeting_id == meeting_id)).scalar_one_or_none()
        if not transcript or not transcript.cleaned_transcript:
            return "Transcript not available."
            
        utterances = transcript.cleaned_transcript
        
        target_indices = []
        for i, u in enumerate(utterances):
            u_id = str(u.get("id"))
            if any(str(tid) == u_id for tid in target_utterance_ids):
                target_indices.append(i)
                
        if not target_indices:
            return "Target utterances not found in transcript."
            
        ranges_to_include = set()
        for idx in target_indices:
            start = max(0, idx - context_window)
            end = min(len(utterances), idx + context_window + 1)
            for j in range(start, end):
                ranges_to_include.add(j)
                
        sorted_indices = sorted(list(ranges_to_include))
        
        results = []
        for j in sorted_indices:
            u = utterances[j]
            is_target = j in target_indices
            prefix = "--> " if is_target else "    "
            results.append(f"{prefix}[{u.get('id')}] {u.get('speaker')}: {u.get('text')}")
            
        return "\n".join(results)
    finally:
        db.close()


@tool
def fetch_document_reference(meeting_id: str, chunk_id: str) -> str:
    """
    Fetch the text from a specific document attached to a meeting.
    Use this if a Key Moment cites a specific 'source_doc_refs' chunk_id and you need to read the slide or document page.
    """
    db: Session = SessionLocal()
    try:
        chunk = db.execute(select(models.AttachmentChunk).where(models.AttachmentChunk.meeting_id == meeting_id, models.AttachmentChunk.chunk_id == chunk_id)).scalar_one_or_none()
        if not chunk:
            return "Document chunk not found."
            
        att = db.execute(select(models.MeetingAttachment).where(models.MeetingAttachment.id == chunk.attachment_id)).scalar_one_or_none()
        fname = att.filename if att else "Unknown Document"
        
        return f"Document: {fname}\nPage/Slide: {chunk.locator_value}\nTitle: {chunk.title}\nContent: {chunk.text}"
    finally:
        db.close()


@tool
def get_meeting_metadata(meeting_id: str) -> str:
    """
    Fetch top-level details of a meeting without searching vectors: Title, Date, Duration, List of Participants.
    """
    db: Session = SessionLocal()
    try:
        m = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
        if not m:
            return "Meeting not found."
            
        return f"Meeting ID: {m.id}\nTitle: {m.title}\nDate: {m.recorded_at}\nDuration: {m.duration}\nParticipants: {', '.join(m.participants)}"
    finally:
        db.close()


@tool
def search_exact_transcript(query: str, meeting_id: Optional[str] = None) -> str:
    """
    Perform a case-insensitive keyword/lexical search directly over the raw meeting transcripts.
    Useful for finding exact names, acronyms, or specific phrases that semantic search might miss.
    """
    db: Session = SessionLocal()
    try:
        stmt = select(models.MeetingTranscript)
        if meeting_id:
            stmt = stmt.where(models.MeetingTranscript.meeting_id == meeting_id)
        
        transcripts = db.execute(stmt).scalars().all()
        results = []
        query_lower = query.lower()
        
        for t in transcripts:
            if not t.cleaned_transcript:
                continue
            for i, u in enumerate(t.cleaned_transcript):
                text = u.get("text", "")
                if query_lower in text.lower():
                    # Get small context window
                    start = max(0, i - 1)
                    end = min(len(t.cleaned_transcript), i + 2)
                    context = []
                    for j in range(start, end):
                        cu = t.cleaned_transcript[j]
                        prefix = "--> " if j == i else "    "
                        context.append(f"{prefix}{cu.get('speaker')}: {cu.get('text')}")
                    
                    uid = u.get("id")
                    results.append(
                        f"Meeting ID: {t.meeting_id}\n"
                        f"Transcript utterance ID: {uid} (cite as [{uid}])\n"
                        + "\n".join(context)
                    )
                    
        if not results:
            return f"No exact matches found for '{query}'."
            
        return "\n\n".join(results[:15]) # Limit to top 15 hits to avoid overwhelming LLM
    finally:
        db.close()


@tool
def list_action_items_by_person(person_name: str, meeting_id: Optional[str] = None) -> str:
    """
    Query the database specifically for action items assigned to a named person.
    """
    db: Session = SessionLocal()
    try:
        stmt = select(models.MeetingActionItem).where(models.MeetingActionItem.owner.ilike(f"%{person_name}%"))
        if meeting_id:
            stmt = stmt.where(models.MeetingActionItem.meeting_id == meeting_id)
            
        action_items = db.execute(stmt).scalars().all()
        if not action_items:
            return f"No action items found for '{person_name}'."
            
        results = []
        for i, a in enumerate(action_items):
            m = db.execute(select(models.Meeting).where(models.Meeting.id == a.meeting_id)).scalar_one_or_none()
            m_title = m.title if m else "Unknown Meeting"
            m_date = m.recorded_at.isoformat() if m and m.recorded_at else ""
            
            src_ids = a.source_utterance_ids or []
            utterance_cites = ", ".join(f"[{uid}]" for uid in src_ids) if src_ids else "none"
            res = (
                f"{i+1}. Meeting: {m_title} ({m_date})\n"
                f"   Action item tag: [act-{i+1}]\n"
                f"   Deadline: {a.deadline}\n"
                f"   Action: {a.text}\n"
                f"   Source utterance IDs (cite exactly): {utterance_cites}"
            )
            results.append(res)
            
        return "\n".join(results)
    finally:
        db.close()


@tool
def generate_timeline(topic_or_project: str) -> str:
    """
    Look across multiple meetings and construct a chronological timeline of how a specific project or topic evolved.
    """
    db: Session = SessionLocal()
    try:
        embedding_model = get_embedding_model()
        query_vector = embedding_model.embed_query(topic_or_project)
        
        # Search semantic chunks across ALL meetings for the topic
        stmt = select(models.MeetingSemanticChunk).order_by(
            models.MeetingSemanticChunk.embedding.cosine_distance(query_vector)
        ).limit(15)
        
        chunks = db.execute(stmt).scalars().all()
        if not chunks:
            return f"No chronological events found for '{topic_or_project}'."
            
        # Correlate with meeting dates
        events = []
        for c in chunks:
            m = db.execute(select(models.Meeting).where(models.Meeting.id == c.meeting_id)).scalar_one_or_none()
            if m and m.recorded_at:
                events.append({
                    "date": m.recorded_at,
                    "date_str": m.recorded_at.isoformat(),
                    "meeting": m.title,
                    "type": c.chunk_type,
                    "content": c.text
                })
                
        # Sort chronologically
        events.sort(key=lambda x: x["date"])
        
        results = [f"Timeline for '{topic_or_project}':"]
        for e in events:
            results.append(f"- [{e['date_str']}] (Meeting: {e['meeting']}) [{e['type'].upper()}]: {e['content']}")
            
        return "\n".join(results)
    finally:
        db.close()


@tool
def speaker_activity_summary(speaker_name: str, meeting_id: str) -> str:
    """
    Summarize what a specific participant contributed across a specific meeting.
    Extracts all utterances by the speaker in the meeting.
    """
    db: Session = SessionLocal()
    try:
        transcript = db.execute(select(models.MeetingTranscript).where(models.MeetingTranscript.meeting_id == meeting_id)).scalar_one_or_none()
        if not transcript or not transcript.cleaned_transcript:
            return "Transcript not available."
            
        results = []
        speaker_lower = speaker_name.lower()
        
        for u in transcript.cleaned_transcript:
            if speaker_lower in str(u.get("speaker", "")).lower():
                results.append(f"[{u.get('id')}] {u.get('text')}")
                
        if not results:
            return f"No contributions found for '{speaker_name}' in this meeting."
            
        return "\n".join(results)
    finally:
        db.close()


@tool
def trace_reference_context(utterance_id: str, meeting_id: str, max_lookback: int = 20) -> str:
    """
    Vicinity Search Tool: Traces back from a specific utterance to resolve ambiguous pronouns (like 'that', 'he', 'it').
    It fetches the preceding conversation history and uses an internal LLM call to figure out what the pronoun refers to.
    Returns the resolved context.
    """
    db: Session = SessionLocal()
    try:
        transcript = db.execute(select(models.MeetingTranscript).where(models.MeetingTranscript.meeting_id == meeting_id)).scalar_one_or_none()
        if not transcript or not transcript.cleaned_transcript:
            return "Transcript not available."
            
        utterances = transcript.cleaned_transcript
        
        target_idx = -1
        for i, u in enumerate(utterances):
            if str(u.get("id")) == str(utterance_id):
                target_idx = i
                break
                
        if target_idx == -1:
            return "Utterance ID not found in transcript."
            
        start = max(0, target_idx - max_lookback)
        context_chunk = utterances[start:target_idx + 1]
        
        context_text = "\n".join([f"[{u.get('id')}] {u.get('speaker')}: {u.get('text')}" for u in context_chunk])
        target_text = utterances[target_idx].get("text")
        
        # Use LLM to resolve
        llm = get_chat_model()
        sys_msg = SystemMessage(content="You are a linguistic reference resolution AI. Given a transcript context leading up to a specific utterance, identify exactly what ambiguous pronouns or references (e.g. 'that', 'it', 'he', 'the project') in the final utterance are referring to. Be concise and definitive.")
        user_msg = HumanMessage(content=f"Context:\n{context_text}\n\nTarget Utterance: '{target_text}'\n\nWhat do the pronouns/references in the target utterance refer to based on the preceding context?")
        
        response = llm.invoke([sys_msg, user_msg])
        return f"Resolution for [{utterance_id}]: {response.content}"
    finally:
        db.close()


@tool
def resolve_conflicting_information(statement_1: str, statement_2: str, meeting_id: str) -> str:
    """
    Redundancy/Conflict Resolution Tool: When multiple extracted facts contradict each other (e.g. 'Deadline is today' vs 'Deadline is tomorrow'),
    this tool searches for both statements in the transcript timeline and uses an LLM to deduce the final overriding truth.
    """
    db: Session = SessionLocal()
    try:
        transcript = db.execute(select(models.MeetingTranscript).where(models.MeetingTranscript.meeting_id == meeting_id)).scalar_one_or_none()
        if not transcript or not transcript.cleaned_transcript:
            return "Transcript not available to verify conflicts."
            
        llm = get_chat_model()
        embedding_model = get_embedding_model()
        v1 = embedding_model.embed_query(statement_1)
        v2 = embedding_model.embed_query(statement_2)
        
        c1 = db.execute(select(models.MeetingSemanticChunk).where(models.MeetingSemanticChunk.meeting_id == meeting_id).order_by(models.MeetingSemanticChunk.embedding.cosine_distance(v1)).limit(3)).scalars().all()
        c2 = db.execute(select(models.MeetingSemanticChunk).where(models.MeetingSemanticChunk.meeting_id == meeting_id).order_by(models.MeetingSemanticChunk.embedding.cosine_distance(v2)).limit(3)).scalars().all()
        
        context_texts = set()
        for c in c1 + c2:
            context_texts.add(f"Type: {c.chunk_type}, Content: {c.text}")
            
        combined_context = "\n---\n".join(context_texts)
        
        sys_msg = SystemMessage(content="You are an AI conflict resolution agent. You will be given two conflicting factual statements extracted from a meeting, along with some semantic context retrieved from the database. Determine the correct, final truth by analyzing the context (e.g. one statement might have been corrected later, or they refer to different things).")
        user_msg = HumanMessage(content=f"Statement 1: {statement_1}\nStatement 2: {statement_2}\n\nRetrieved Context:\n{combined_context}\n\nResolve the conflict and explain the ground truth:")
        
        response = llm.invoke([sys_msg, user_msg])
        return f"Conflict Resolution:\n{response.content}"
    finally:
        db.close()


@tool
def get_related_meetings(meeting_id: str) -> str:
    """
    Look up automatically generated cross-meeting links to find other meetings that share highly similar topics or project contexts.
    Returns a list of related meetings and the reason they were linked.
    """
    db: Session = SessionLocal()
    try:
        links = db.execute(
            select(models.MeetingLink).where(models.MeetingLink.source_meeting_id == meeting_id)
        ).scalars().all()
        
        if not links:
            return "No related meetings found."
            
        results = []
        for l in links:
            tm = db.execute(select(models.Meeting).where(models.Meeting.id == l.target_meeting_id)).scalar_one_or_none()
            if tm:
                results.append(f"Linked Meeting: {tm.title} (ID: {tm.id}, Date: {tm.recorded_at})\nReason: {l.reason}\nSimilarity Score: {l.similarity_score:.2f}")
                
        return "\n\n".join(results)
    finally:
        db.close()


@tool
def get_meeting_summary(meeting_id: str) -> str:
    """
    Fetch the high-level, explicitly generated Markdown summary report of the meeting.
    Always use this when asked for a summary, recap, or high-level decisions of a meeting, rather than doing semantic search.
    """
    db: Session = SessionLocal()
    try:
        summary_record = db.execute(select(models.MeetingSummaryRecap).where(models.MeetingSummaryRecap.meeting_id == meeting_id)).scalar_one_or_none()
        if not summary_record or not summary_record.markdown_report:
            return "No pre-generated summary report found for this meeting."
        return summary_record.markdown_report
    finally:
        db.close()


@tool
def get_meeting_insights_and_risks(meeting_id: str) -> str:
    """
    Fetch the automatically inferred high-level insights, risks, blockers, and follow-up points for the meeting.
    Use this when asked about risks, concerns, insights, or follow-ups.
    """
    db: Session = SessionLocal()
    try:
        insights_record = db.execute(select(models.MeetingInferredInsight).where(models.MeetingInferredInsight.meeting_id == meeting_id)).scalar_one_or_none()
        if not insights_record or not insights_record.insights_data:
            return "No pre-generated insights or risks found for this meeting."
        return json.dumps(insights_record.insights_data, indent=2)
    finally:
        db.close()


@tool
def get_meeting_topics(meeting_id: str) -> str:
    """
    Fetch the structural topic groupings and hierarchy of the meeting.
    Use this to understand the overarching agenda or what topics were discussed in general.
    """
    db: Session = SessionLocal()
    try:
        topic_record = db.execute(select(models.MeetingTopic).where(models.MeetingTopic.meeting_id == meeting_id)).scalar_one_or_none()
        if not topic_record or not topic_record.topics_data:
            return "No pre-generated topic data found for this meeting."
        return json.dumps(topic_record.topics_data, indent=2)
    finally:
        db.close()


@tool
def get_meetings_by_tag(tag: str) -> str:
    """
    Finds all meetings associated with a specific knowledge tag or topic.
    Use this when the user asks to "Show me meetings about X" or "Group meetings by X".
    """
    db: Session = SessionLocal()
    try:
        # First find facts with this tag
        stmt = select(models.MeetingKnowledgeFact)
        facts = db.execute(stmt).scalars().all()
        
        meeting_ids = set()
        tag_lower = tag.lower()
        for f in facts:
            if f.tags:
                if any(tag_lower in t.lower() for t in f.tags):
                    meeting_ids.add(f.meeting_id)
                    
        if not meeting_ids:
            return f"No meetings found with tag: {tag}"
            
        results = []
        for mid in meeting_ids:
            m = db.execute(select(models.Meeting).where(models.Meeting.id == mid)).scalar_one_or_none()
            if m:
                m_date = m.recorded_at.isoformat() if m.recorded_at else "Unknown Date"
                results.append(f"- Meeting: {m.title} (ID: {m.id}), Date: {m_date}")
                
        return f"Meetings matching tag '{tag}':\n" + "\n".join(results)
    finally:
        db.close()


def get_rag_agent_executor(extra_tools=None):
    llm = get_chat_model()
    tools = [
        search_meetings, 
        fetch_transcript_context, 
        fetch_document_reference, 
        get_meeting_metadata,
        search_exact_transcript,
        list_action_items_by_person,
        generate_timeline,
        speaker_activity_summary,
        trace_reference_context,
        resolve_conflicting_information,
        get_related_meetings,
        get_meeting_summary,
        get_meeting_insights_and_risks,
        get_meeting_topics,
        get_meetings_by_tag
    ]
    if extra_tools:
        tools.extend(extra_tools)
    agent_executor = create_react_agent(llm, tools)
    return agent_executor
