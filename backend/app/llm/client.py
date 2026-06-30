from __future__ import annotations

import json
import os
import re
from datetime import datetime, timedelta
from typing import Protocol, TypeVar

from pydantic import BaseModel, Field

from app.schemas.meeting import (
    ActionItem,
    CalendarAction,
    Decision,
    DiscussionPoint,
    IdentifiedByAgent,
    RiskItem,
    TemporalInterpretation,
)

from langchain_core.runnables import Runnable
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq

class MockStructuredRunnable(Runnable):
    def __init__(self, schema):
        self.schema = schema
        
    def invoke(self, input, config=None, **kwargs):
        # Extract text from LangChain message lists or PromptValues
        if hasattr(input, "messages"):
            text = "\n".join(m.content for m in input.messages if isinstance(m.content, str))
        elif isinstance(input, list):
            text = "\n".join(m.content for m in input if hasattr(m, "content") and isinstance(m.content, str))
        else:
            text = str(input)
        
        data = self._build_response(self.schema, text)
        return self.schema.model_validate(data)

    async def ainvoke(self, input, config=None, **kwargs):
        return self.invoke(input, config, **kwargs)

    def _build_response(self, schema: type[BaseModel], user: str) -> dict:
        name = schema.__name__
        text = user.lower()

        if name == "KeyMomentsResponse":
            return {
                "key_moments": [
                    {"text": "Discussed Q3 roadmap and database upgrade dependencies.", "type": "decision", "confidence": 0.9, "source_utterance_ids": [0]},
                    {"text": "Marketing needs 3 weeks lead time, setting September 15th as hard deadline.", "type": "action_item", "confidence": 0.85, "source_utterance_ids": [1]},
                ]
            }

        if name == "TopicSegregationResponse":
            return {
                "overall_topic": "Q3 Roadmap & Architecture Freeze",
                "overall_description": "Finalizing the Q3 roadmap for the new Agent Architecture and scheduling the PostgreSQL 16 database migration.",
                "topics": [
                    {
                        "title": "Database Migration & Architecture Freeze",
                        "description": "Discussion on upgrading to PostgreSQL 16 before rolling out LangGraph agents.",
                        "sub_topics": [
                            {
                                "title": "PostgreSQL 16 Migration",
                                "description": "Scheduled for August 5th during low-traffic weekend window.",
                                "points": [{"text": "AgentState table will use JSONB columns for memory buffer", "source_key_moment_ids": ["km-1"]}]
                            }
                        ]
                    }
                ]
            }

        if name == "SummaryRecapResponse":
            return {
                "markdown_report": "The meeting focused on finalizing the Q3 roadmap for the new Agent Architecture. The primary consensus was that the database upgrade must precede the agent rollout to ensure stability.\n\n### Executive Decisions\n- **Architecture Freeze:** No new features will be added to the legacy monolith starting next Monday.\n- **Database Migration:** The migration to PostgreSQL 16 will happen on August 5th during the low-traffic weekend window.\n- **Agent Rollout:** The highly anticipated LangGraph agents will launch in a phased rollout to 10% of users on September 15th.\n\n### Technical Implementation Details\nJohn walked the team through the proposed schema changes. The new `AgentState` table will use JSONB columns to store the conversational memory buffer, which should give us massive performance gains over the old relational model.\n\n> \"If we don't migrate to JSONB now, the agent state management will become a massive bottleneck within a month of launch.\" - John",
                "citations_used": ["km-1", "km-2"],
                "action_items": [
                    {"task": "Update Jira board timeline", "owner": "John", "assigned_by": "Sarah", "date": "2024-08-12", "time": "10:00", "deadline": "Tomorrow"},
                    {"task": "Contact Anthropic support regarding rate limits", "owner": "Bob", "assigned_by": "Alex", "date": "2024-08-12", "time": "10:15", "deadline": "EOD tomorrow"}
                ]
            }

        if name == "InferredInsightsResponse":
            return {
                "discussion_insights": [
                    {"insight": "JSONB Migration is Critical", "reasoning": "Agent state management will become a bottleneck without JSONB columns."}
                ],
                "risks_and_blockers": [
                    {"risk": "Third-Party API Rate Limits", "mitigation": "Increase Anthropic API tier before rollout"}
                ],
                "follow_up_points": [
                    {"point": "Legal sign-off on data privacy", "context": "Need compliance approval for storing user transcripts"}
                ]
            }

        if name == "KnowledgeExtractResponse":
            return {
                "permanent_facts": [
                    {"fact": "Legacy monolith architecture freeze starts next Monday.", "category": "Architecture"}
                ]
            }

        if name == "TeamPrepResponse":
            return {
                "team_announcements": ["Architecture freeze starting next Monday."],
                "structured_assignments": [
                    {"owner": "Bob", "tasks": ["Contact Anthropic support regarding rate limits"]},
                    {"owner": "Alice", "tasks": ["Schedule sync with legal team regarding data privacy"]}
                ]
            }

        if name == "TeamAnalysisResponse":
            return {
                "collaboration_dynamics": "The team collaborated effectively, aligning quickly on the hard deadline of September 15th and addressing QA concerns constructively.",
                "decision_drivers": ["Sarah", "John"],
                "overall_sentiment": "Productive",
                "individual_feedback": [
                    {
                        "speaker": "Sarah",
                        "speaker_type": "Facilitator",
                        "key_moments_count": 4,
                        "individual_feedback": "Kept the meeting on track and ensured all viewpoints were heard."
                    },
                    {
                        "speaker": "John",
                        "speaker_type": "Subject Matter Expert",
                        "key_moments_count": 7,
                        "individual_feedback": "Provided deep technical insights but occasionally derailed the conversation."
                    },
                    {
                        "speaker": "Bob",
                        "speaker_type": "Observer",
                        "key_moments_count": 1,
                        "individual_feedback": "Mostly listened, but raised a critical question about the timeline."
                    }
                ]
            }

        if name == "SegmentLabelResponse":
            first_line = user.strip().split("\n")[0][:80]
            return {"title": first_line or "Discussion", "confidence": 0.75}

        if name == "TemporalInterpretResponse":
            interpretation = TemporalInterpretation.VAGUE_REFERENCE
            calendar_action = CalendarAction.NONE
            resolved = None
            if "tuesday" in text or "sync" in text or "meeting" in text:
                interpretation = TemporalInterpretation.SCHEDULED_MEETING
                calendar_action = CalendarAction.CREATE_EVENT
                resolved = (datetime.utcnow() + timedelta(days=7)).isoformat()
            elif "by " in text or "deadline" in text or "eod" in text:
                interpretation = TemporalInterpretation.DEADLINE_FOR_ACTION
                resolved = (datetime.utcnow() + timedelta(days=5)).isoformat()
            return {
                "interpretation": interpretation.value,
                "resolved_datetime": resolved,
                "owner": self._extract_owner(user),
                "confidence": 0.8,
                "calendar_action": calendar_action.value,
            }

        if name == "SummaryResponse":
            sentences = re.split(r"[.!?]\s+", user)
            summary = ". ".join(s.strip() for s in sentences[:3] if s.strip())
            return {"summary": summary or "Meeting discussion summary."}

        if name == "CompressSummaryResponse":
            prev = ""
            if "previous summary:" in text:
                prev = text.split("previous summary:")[1].split("new transcript:")[0].strip()
            new_part = user.split("new transcript:")[-1] if "new transcript:" in user else user
            new_sent = re.split(r"[.!?]\s+", new_part)
            new_bit = new_sent[0].strip() if new_sent else ""
            combined = f"{prev} {new_bit}".strip() if prev else new_bit
            return {"summary": combined or "Updated summary."}

        if name == "DiscussionPointsResponse":
            points = []
            for line in user.split("\n"):
                if ":" in line:
                    speaker, content = line.split(":", 1)
                    points.append(
                        {
                            "text": content.strip()[:120],
                            "utterance_ids": [0],
                            "speaker": speaker.strip(),
                        }
                    )
            return {"discussion_points": points[:5]}

        if name == "ActionItemsResponse":
            actions = []
            uid = 0
            for line in user.split("\n"):
                lower = line.lower()
                if any(k in lower for k in ("will ", "need to", "action:", "by next", "take ")):
                    owner = self._extract_owner(line)
                    actions.append(
                        {
                            "text": line.strip()[:200],
                            "owner": owner,
                            "deadline": None,
                            "confidence": 0.75,
                            "source_utterance_ids": [uid],
                        }
                    )
                uid += 1
            if not actions and user.strip():
                actions.append(
                    {
                        "text": "Follow up on discussed items",
                        "owner": None,
                        "deadline": None,
                        "confidence": 0.5,
                        "source_utterance_ids": [0],
                    }
                )
            return {"actions": actions}

        if name == "DecisionsResponse":
            decisions = []
            uid = 0
            for line in user.split("\n"):
                if any(k in line.lower() for k in ("decided", "decision", "agreed", "go with")):
                    decisions.append(
                        {
                            "text": line.strip()[:200],
                            "confidence": 0.8,
                            "source_utterance_ids": [uid],
                        }
                    )
                uid += 1
            return {"decisions": decisions}

        if name == "RisksResponse":
            risks = []
            uid = 0
            for line in user.split("\n"):
                lower = line.lower()
                if any(k in lower for k in ("risk", "blocker", "dependency", "concern", "delay")):
                    risks.append(
                        {
                            "text": line.strip()[:200],
                            "blocker": "blocker" in lower,
                            "dependency": "vendor" if "vendor" in lower else None,
                            "confidence": 0.75,
                            "source_utterance_ids": [uid],
                        }
                    )
                uid += 1
            return {"risks": risks}

        if name == "HighlightsResponse":
            highlights = []
            uid = 0
            for line in user.split("\n"):
                lower = line.lower()
                if "will " in lower or "action:" in lower:
                    highlights.append({
                        "text": line.strip()[:200],
                        "type": "action_item",
                        "confidence": 0.9,
                        "source_utterance_ids": [uid]
                    })
                elif "decid" in lower or "agre" in lower:
                    highlights.append({
                        "text": line.strip()[:200],
                        "type": "decision",
                        "confidence": 0.85,
                        "source_utterance_ids": [uid]
                    })
                elif "risk" in lower or "block" in lower:
                    highlights.append({
                        "text": line.strip()[:200],
                        "type": "risk",
                        "confidence": 0.75,
                        "source_utterance_ids": [uid]
                    })
                uid += 1
            if not highlights and user.strip():
                highlights.append({
                    "text": "General key point discussed.",
                    "type": "key_point",
                    "confidence": 0.7,
                    "source_utterance_ids": [0]
                })
            return {"highlights": highlights}

        if name == "GistResponse":
            return {"gist": user[:300] if user else "Meeting gist."}

        return {}

    def _extract_owner(self, text: str) -> str | None:
        for name in ("Alice", "Bob", "Carol"):
            if name.lower() in text.lower():
                return name
        match = re.search(r"(\w+)\s+will\s+", text, re.I)
        return match.group(1) if match else None

class MockChatModel:
    def with_structured_output(self, schema, **kwargs):
        return MockStructuredRunnable(schema)

def _azure_client() -> "AzureOpenAILLMClient | None":
    from app.config import get_settings

    settings = get_settings()
    if not getattr(settings, "azure_chat_ready", False):
        return None
    return AzureOpenAILLMClient(
        getattr(settings, "azure_openai_api_key", ""),
        getattr(settings, "azure_openai_endpoint", ""),
        getattr(settings, "azure_openai_chat_deployment", ""),
        getattr(settings, "azure_openai_api_version", ""),
    )

def get_chat_model():
    from app.config import get_settings

    settings = get_settings()
    if settings.llm_mock:
        return MockChatModel()
    
    if settings.llm_provider == "groq" and settings.groq_api_key:
        import httpx
        return ChatGroq(
            model=settings.groq_model, 
            api_key=settings.groq_api_key, 
            temperature=0.0,
            http_client=httpx.Client(verify=False, trust_env=False),
            http_async_client=httpx.AsyncClient(verify=False, trust_env=False)
        )
    if settings.llm_provider == "openai" and settings.openai_api_key:
        import httpx
        
        http_client = httpx.Client(verify=False, trust_env=False)
        http_async_client = httpx.AsyncClient(verify=False, trust_env=False)
        
        return ChatOpenAI(
            model=settings.openai_model, 
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            http_client=http_client,
            http_async_client=http_async_client,
            temperature=0.0,
        )
    if settings.llm_provider == "gemini" and settings.gemini_api_key:
        return ChatGoogleGenerativeAI(model=settings.gemini_model, api_key=settings.gemini_api_key, temperature=0.0)
    if settings.llm_provider == "ollama":
        return ChatOllama(model=settings.ollama_model, base_url=settings.ollama_host, temperature=0.0)
    
    if settings.groq_api_key:
        import httpx
        return ChatGroq(
            model=settings.groq_model, 
            api_key=settings.groq_api_key, 
            temperature=0.0,
            http_client=httpx.Client(verify=False, trust_env=False),
            http_async_client=httpx.AsyncClient(verify=False, trust_env=False)
        )
    if settings.openai_api_key:
        import httpx
        http_client = httpx.Client(verify=False, trust_env=False)
        http_async_client = httpx.AsyncClient(verify=False, trust_env=False)
        return ChatOpenAI(
            model=settings.openai_model, 
            api_key=settings.openai_api_key, 
            base_url=settings.openai_base_url, 
            http_client=http_client, 
            http_async_client=http_async_client, 
            temperature=0.0
        )
    
    return MockChatModel()


class MockEmbeddingModel:
    def embed_query(self, text: str) -> list[float]:
        return [0.0] * 768

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[0.0] * 768 for _ in texts]


def get_embedding_model():
    """
    Returns an instance of an embeddings model for vector stores.
    """
    import os
    
    # We cloned the model locally to completely bypass network SSL issues.
    # It resides at backend/all-MiniLM-L6-v2
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    model_path = os.path.join(base_dir, "all-MiniLM-L6-v2")
    
    return HuggingFaceEmbeddings(model_name=model_path)
# Response schemas used by LLM calls
class SegmentLabelResponse(BaseModel):
    title: str
    confidence: float


class TemporalInterpretResponse(BaseModel):
    interpretation: TemporalInterpretation
    resolved_datetime: datetime | None = None
    owner: str | None = None
    confidence: float = 0.5
    calendar_action: CalendarAction = CalendarAction.NONE


class SummaryResponse(BaseModel):
    summary: str


class CompressSummaryResponse(BaseModel):
    summary: str


class DiscussionPointItem(BaseModel):
    text: str
    utterance_ids: list[int]
    speaker: str = ""


class DiscussionPointsResponse(BaseModel):
    discussion_points: list[DiscussionPointItem]


class ActionItemLLM(BaseModel):
    text: str
    owner: str | None = None
    deadline: datetime | None = None
    confidence: float = 0.7
    source_utterance_ids: list[int]


class ActionItemsResponse(BaseModel):
    actions: list[ActionItemLLM]


class DecisionLLM(BaseModel):
    text: str
    confidence: float = 0.7
    source_utterance_ids: list[int]


class DecisionsResponse(BaseModel):
    decisions: list[DecisionLLM]


class RiskLLM(BaseModel):
    text: str
    blocker: bool = False
    dependency: str | None = None
    confidence: float = 0.7
    source_utterance_ids: list[int]


class RisksResponse(BaseModel):
    risks: list[RiskLLM]


class GistResponse(BaseModel):
    gist: str


class KeyMomentLLM(BaseModel):
    text: str
    type: str
    confidence: float = 0.8
    source_utterance_ids: list[int]


class KeyMomentsResponse(BaseModel):
    key_moments: list[KeyMomentLLM]


# --- Ingestion: LLM fallback parsing of messy/unstructured transcripts -------
class ParsedUtteranceLLM(BaseModel):
    speaker: str | None = None
    text: str = ""


class ParsedTranscriptResponse(BaseModel):
    utterances: list[ParsedUtteranceLLM] = Field(default_factory=list)


# --- Topic Segregation Hierarchy -------
class SegregatedPointLLM(BaseModel):
    text: str
    source_key_moment_ids: list[str]

class SubTopicLLM(BaseModel):
    title: str
    description: str
    points: list[SegregatedPointLLM]

class TopicLLM(BaseModel):
    title: str
    description: str
    sub_topics: list[SubTopicLLM]

class TopicSegregationResponse(BaseModel):
    overall_topic: str
    overall_description: str
    topics: list[TopicLLM]


# --- Summary & Recap -------
class ActionItem(BaseModel):
    task: str = Field(description="What needs to be done, e.g., 'order this', 'do that'")
    owner: str = Field(description="Who was assigned the task")
    assigned_by: str = Field(description="Who assigned the task")
    date: str = Field(description="The exact date this task was assigned or discussed (if mentioned)")
    time: str = Field(description="The exact time this task was assigned or discussed (if mentioned)")
    deadline: str = Field(description="Deadline date or time if mentioned")

class SummaryRecapResponse(BaseModel):
    planned_additional_sections: list[str] = Field(default_factory=list, description="Dynamically planned sections based on meeting content (excluding risks and insights)")
    markdown_report: str
    citations_used: list[str] = Field(default_factory=list)
    action_items: list[ActionItem] = Field(default_factory=list)

# --- Inferred Insights & Follow-ups -------
class InsightItem(BaseModel):
    insight: str = Field(description="A high-level external insight inferred from the discussion")
    reasoning: str = Field(description="Why this insight was derived")

class RiskItem(BaseModel):
    risk: str = Field(description="Potential risk or blocker identified")
    mitigation: str = Field(description="Suggested mitigation strategy")

class FollowupItem(BaseModel):
    point: str = Field(description="A logical follow-up discussion point or task that wasn't explicitly assigned but should be")
    context: str = Field(description="Why this follow-up is necessary")

class InferredInsightsResponse(BaseModel):
    risk_dimensions: list[str] = Field(description="Dimensions of risk evaluated (e.g. Scalability, Compliance)")
    insight_dimensions: list[str] = Field(description="Dimensions of insight evaluated (e.g. Market Trend, Technical Shift)")
    discussion_insights: list[InsightItem]
    risks_and_blockers: list[RiskItem]
    follow_up_points: list[FollowupItem]

# --- Final Output Stages -------

class PermanentFact(BaseModel):
    fact: str = Field(description="A permanent, long-term fact established in this meeting")
    category: str = Field(description="Category of the fact (e.g. Architecture, Strategy, HR)")

class KnowledgeExtractResponse(BaseModel):
    permanent_facts: list[PermanentFact]

class StructuredAssignment(BaseModel):
    owner: str = Field(description="The team member assigned to the task")
    tasks: list[str] = Field(description="List of tasks for this person")

class TeamPrepResponse(BaseModel):
    team_announcements: list[str] = Field(description="General announcements or updates for the broader team")
    structured_assignments: list[StructuredAssignment] = Field(description="Grouped assignments for handoff")

class ParticipantFeedback(BaseModel):
    speaker: str = Field(description="Name of the speaker")
    speaker_type: str = Field(description="Categorization of the speaker (e.g., Facilitator, Driver, Observer, Subject Matter Expert)")
    key_moments_count: int = Field(description="The estimated number of key moments this person was involved in or referred to")
    individual_feedback: str = Field(description="Specific feedback on how this person communicated, contributed, or behaved during the meeting")

class TeamAnalysisResponse(BaseModel):
    collaboration_dynamics: list[str] = Field(description="Points analyzing how well the team collaborated and communicated")
    decision_drivers: list[str] = Field(description="The names of people who primarily drove the decisions or conversation")
    overall_sentiment: str = Field(description="The overall sentiment and tone of the meeting (e.g. Tense, Productive, Rushed)")
    individual_feedback: list[ParticipantFeedback] = Field(default_factory=list, description="Granular feedback and metrics for each participant")
