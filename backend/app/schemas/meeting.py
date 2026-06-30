from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class SourceType(str, Enum):
    VTT = "vtt"
    PLAIN_TEXT = "plain_text"
    AUDIO = "audio"


class TemporalInterpretation(str, Enum):
    DEADLINE_FOR_ACTION = "deadline_for_action"
    SCHEDULED_MEETING = "scheduled_meeting"
    FOLLOW_UP_REMINDER = "follow_up_reminder"
    VAGUE_REFERENCE = "vague_reference"
    IGNORE = "ignore"


class CalendarAction(str, Enum):
    CREATE_EVENT = "create_event"
    SET_REMINDER = "set_reminder"
    NONE = "none"


class IdentifiedByAgent(str, Enum):
    SUMMARIZATION = "summarization"
    ACTION_ITEM = "action_item"
    DECISION = "decision"
    RISK = "risk"
    TEMPORAL = "temporal"


class Utterance(BaseModel):
    model_config = ConfigDict(strict=True)

    id: tuple[int, ...]
    speaker: str
    start: float
    end: float
    text: str
    raw_text: str

    @field_validator("id", mode="before")
    @classmethod
    def ensure_tuple_id(cls, v: Any) -> tuple[int, ...]:
        if isinstance(v, tuple):
            return v
        if isinstance(v, list):
            return tuple(int(x) for x in v)
        if isinstance(v, (int, float)):
            return (int(v),)
        if isinstance(v, str):
            try:
                return (int(v),)
            except ValueError:
                return (0,)
        return (0,)


class MeetingMetadata(BaseModel):
    model_config = ConfigDict(strict=True)

    title: str = "Untitled Meeting"
    recorded_at: datetime | None = None
    source_type: SourceType = SourceType.VTT
    participants: list[str] = Field(default_factory=list)
    participant_map: dict[str, str] = Field(default_factory=dict)


class Attachment(BaseModel):
    model_config = ConfigDict(strict=True)

    attachment_id: str = Field(default_factory=lambda: str(uuid4()))
    filename: str
    mime_type: str = "application/pdf"
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    text_summary: str = ""
    slide_count: int = 0
    page_count: int = 0
    outline: dict = Field(default_factory=dict)
    doc_summary: str | None = None
    storage_path: str | None = None

class AttachmentChunk(BaseModel):
    model_config = ConfigDict(strict=True)

    chunk_id: str
    attachment_id: str
    locator_type: str
    locator_value: str
    title: str | None = None
    text: str

class MeetingDocReference(BaseModel):
    model_config = ConfigDict(strict=True)

    id: str
    utterance_id: str
    speaker: str
    attachment_id: str
    chunk_id: str
    reference_type: str
    raw_phrase: str
    confidence: float
    resolution_method: str


class TopicSegment(BaseModel):
    model_config = ConfigDict(strict=True)

    segment_id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    utterance_ids: list[int]
    confidence: float = 0.8
    continues_segment_id: str | None = None


class DiscussionPoint(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    utterance_ids: list[int]
    speaker: str = ""

    @field_validator("utterance_ids")
    @classmethod
    def non_empty_ids(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("utterance_ids must not be empty")
        return v


class ActionItem(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    owner: str | None = None
    deadline: datetime | None = None
    confidence: float = 0.7
    source_utterance_ids: list[int]
    identified_by_agent: IdentifiedByAgent = IdentifiedByAgent.ACTION_ITEM
    source_doc_refs: list[str] = Field(default_factory=list)
    source_key_moment_ids: list[str] = Field(default_factory=list)

    @field_validator("source_utterance_ids")
    @classmethod
    def non_empty_ids(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("source_utterance_ids must not be empty")
        return v


class Decision(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    confidence: float = 0.7
    source_utterance_ids: list[int]
    identified_by_agent: IdentifiedByAgent = IdentifiedByAgent.DECISION

    @field_validator("source_utterance_ids")
    @classmethod
    def non_empty_ids(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("source_utterance_ids must not be empty")
        return v


class RiskItem(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    blocker: bool = False
    dependency: str | None = None
    confidence: float = 0.7
    source_utterance_ids: list[int]
    identified_by_agent: IdentifiedByAgent = IdentifiedByAgent.RISK

    @field_validator("source_utterance_ids")
    @classmethod
    def non_empty_ids(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("source_utterance_ids must not be empty")
        return v


class TemporalMention(BaseModel):
    model_config = ConfigDict(strict=True)

    utterance_id: tuple[int, ...]
    raw_text: str
    parsed_candidate: str | None = None
    context_before_ids: list[int] = Field(default_factory=list)
    context_after_ids: list[int] = Field(default_factory=list)
    interpretation: TemporalInterpretation = TemporalInterpretation.VAGUE_REFERENCE
    resolved_datetime: datetime | None = None
    confidence: float = 0.5
    calendar_action: CalendarAction = CalendarAction.NONE

    @field_validator("utterance_id", mode="before")
    @classmethod
    def ensure_tuple_id(cls, v: Any) -> tuple[int, ...]:
        if isinstance(v, tuple):
            return v
        if isinstance(v, list):
            return tuple(int(x) for x in v)
        if isinstance(v, (int, float)):
            return (int(v),)
        if isinstance(v, str):
            try:
                return (int(v),)
            except ValueError:
                return (0,)
        return (0,)


class SegmentAgentOutput(BaseModel):
    model_config = ConfigDict(strict=True)

    segment_id: str
    summary: str = ""
    discussion_points: list[DiscussionPoint] = Field(default_factory=list)
    actions: list[ActionItem] = Field(default_factory=list)
    decisions: list[Decision] = Field(default_factory=list)
    risks: list[RiskItem] = Field(default_factory=list)


class TopicReport(BaseModel):
    model_config = ConfigDict(strict=True)

    segment_id: str
    title: str
    summary: str
    discussion_points: list[DiscussionPoint] = Field(default_factory=list)
    actions: list[ActionItem] = Field(default_factory=list)
    decisions: list[Decision] = Field(default_factory=list)
    risks: list[RiskItem] = Field(default_factory=list)


class MeetingReport(BaseModel):
    model_config = ConfigDict(strict=True)

    meeting_id: str
    gist: str
    topics: list[TopicReport] = Field(default_factory=list)
    all_actions: list[ActionItem] = Field(default_factory=list)
    all_decisions: list[Decision] = Field(default_factory=list)
    all_risks: list[RiskItem] = Field(default_factory=list)
    temporal_mentions: list[TemporalMention] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class Meeting(BaseModel):
    model_config = ConfigDict(strict=True)

    meeting_id: str = Field(default_factory=lambda: str(uuid4()))
    metadata: MeetingMetadata = Field(default_factory=MeetingMetadata)
    utterances: list[Utterance] = Field(default_factory=list)
    attachments: list[Attachment] = Field(default_factory=list)
    attachment_chunks: list[AttachmentChunk] = Field(default_factory=list)
    doc_references: list[MeetingDocReference] = Field(default_factory=list)
    segments: list[TopicSegment] = Field(default_factory=list)
    report: MeetingReport | None = None
    raw_filename: str | None = None
    raw_content: bytes | None = None

    @model_validator(mode="before")
    @classmethod
    def strip_raw_for_json(cls, data: Any) -> Any:
        return data


class TranscriptWindow(BaseModel):
    model_config = ConfigDict(strict=True)

    window_index: int
    storage_path: str | None = None

class AttachmentChunk(BaseModel):
    model_config = ConfigDict(strict=True)

    chunk_id: str
    attachment_id: str
    locator_type: str
    locator_value: str
    title: str | None = None
    text: str

class MeetingDocReference(BaseModel):
    model_config = ConfigDict(strict=True)

    id: str
    utterance_id: str
    speaker: str
    attachment_id: str
    chunk_id: str
    reference_type: str
    raw_phrase: str
    confidence: float
    resolution_method: str


class TopicSegment(BaseModel):
    model_config = ConfigDict(strict=True)

    segment_id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    utterance_ids: list[int]
    confidence: float = 0.8
    continues_segment_id: str | None = None


class DiscussionPoint(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    utterance_ids: list[int]
    speaker: str = ""

    @field_validator("utterance_ids")
    @classmethod
    def non_empty_ids(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("utterance_ids must not be empty")
        return v


class ActionItem(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    owner: str | None = None
    deadline: datetime | None = None
    confidence: float = 0.7
    source_utterance_ids: list[int]
    identified_by_agent: IdentifiedByAgent = IdentifiedByAgent.ACTION_ITEM
    source_doc_refs: list[str] = Field(default_factory=list)
    source_key_moment_ids: list[str] = Field(default_factory=list)

    @field_validator("source_utterance_ids")
    @classmethod
    def non_empty_ids(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("source_utterance_ids must not be empty")
        return v


class Decision(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    confidence: float = 0.7
    source_utterance_ids: list[int]
    identified_by_agent: IdentifiedByAgent = IdentifiedByAgent.DECISION

    @field_validator("source_utterance_ids")
    @classmethod
    def non_empty_ids(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("source_utterance_ids must not be empty")
        return v


class RiskItem(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    blocker: bool = False
    dependency: str | None = None
    confidence: float = 0.7
    source_utterance_ids: list[int]
    identified_by_agent: IdentifiedByAgent = IdentifiedByAgent.RISK

    @field_validator("source_utterance_ids")
    @classmethod
    def non_empty_ids(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("source_utterance_ids must not be empty")
        return v


class TemporalMention(BaseModel):
    model_config = ConfigDict(strict=True)

    utterance_id: tuple[int, ...]
    raw_text: str
    parsed_candidate: str | None = None
    context_before_ids: list[int] = Field(default_factory=list)
    context_after_ids: list[int] = Field(default_factory=list)
    interpretation: TemporalInterpretation = TemporalInterpretation.VAGUE_REFERENCE
    resolved_datetime: datetime | None = None
    confidence: float = 0.5
    calendar_action: CalendarAction = CalendarAction.NONE

    @field_validator("utterance_id", mode="before")
    @classmethod
    def ensure_tuple_id(cls, v: Any) -> tuple[int, ...]:
        if isinstance(v, tuple):
            return v
        if isinstance(v, list):
            return tuple(int(x) for x in v)
        if isinstance(v, (int, float)):
            return (int(v),)
        if isinstance(v, str):
            try:
                return (int(v),)
            except ValueError:
                return (0,)
        return (0,)


class SegmentAgentOutput(BaseModel):
    model_config = ConfigDict(strict=True)

    segment_id: str
    summary: str = ""
    discussion_points: list[DiscussionPoint] = Field(default_factory=list)
    actions: list[ActionItem] = Field(default_factory=list)
    decisions: list[Decision] = Field(default_factory=list)
    risks: list[RiskItem] = Field(default_factory=list)


class TopicReport(BaseModel):
    model_config = ConfigDict(strict=True)

    segment_id: str
    title: str
    summary: str
    discussion_points: list[DiscussionPoint] = Field(default_factory=list)
    actions: list[ActionItem] = Field(default_factory=list)
    decisions: list[Decision] = Field(default_factory=list)
    risks: list[RiskItem] = Field(default_factory=list)


class MeetingReport(BaseModel):
    model_config = ConfigDict(strict=True)

    meeting_id: str
    gist: str
    topics: list[TopicReport] = Field(default_factory=list)
    all_actions: list[ActionItem] = Field(default_factory=list)
    all_decisions: list[Decision] = Field(default_factory=list)
    all_risks: list[RiskItem] = Field(default_factory=list)
    temporal_mentions: list[TemporalMention] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class Meeting(BaseModel):
    model_config = ConfigDict(strict=True)

    meeting_id: str = Field(default_factory=lambda: str(uuid4()))
    metadata: MeetingMetadata = Field(default_factory=MeetingMetadata)
    utterances: list[Utterance] = Field(default_factory=list)
    attachments: list[Attachment] = Field(default_factory=list)
    attachment_chunks: list[AttachmentChunk] = Field(default_factory=list)
    doc_references: list[MeetingDocReference] = Field(default_factory=list)
    segments: list[TopicSegment] = Field(default_factory=list)
    report: MeetingReport | None = None
    raw_filename: str | None = None
    raw_content: bytes | None = None

    @model_validator(mode="before")
    @classmethod
    def strip_raw_for_json(cls, data: Any) -> Any:
        return data


class TranscriptWindow(BaseModel):
    model_config = ConfigDict(strict=True)

    window_index: int
    utterances: list[Utterance]
    rendered_text: str
    utterance_ids: list[int]


class RunningSummary(BaseModel):
    model_config = ConfigDict(strict=True)

    text: str
    covered_utterance_ids: list[int] = Field(default_factory=list)
    window_count: int = 0

class IntegrationOptions(BaseModel):
    linear: bool = False
    calendar: bool = False
    tasks: bool = False
    email: bool = False

class ExportRequest(BaseModel):
    meeting_id: str
    meeting_json: Any
    options: IntegrationOptions

class IntegrationResult(BaseModel):
    status: str                         
    resource_id: str | None = None
    url: str | None = None
    reason: str | None = None
    extra: dict[str, Any] = {}

class ExportResponse(BaseModel):
    meeting_id: str
    results: dict[str, Any]
    skipped_low_confidence: list[str] = []
