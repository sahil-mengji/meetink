from pydantic import BaseModel, ConfigDict
from typing import Optional

class AttachmentChunkResult(BaseModel):
    model_config = ConfigDict(strict=True)
    chunk_id: str
    locator_type: str
    locator_value: str
    title: Optional[str] = None
    text: str
    char_count: int

class AttachmentIngestResult(BaseModel):
    model_config = ConfigDict(strict=True)
    attachment_id: str
    filename: str
    mime_type: str
    storage_path: Optional[str] = None
    slide_count: int = 0
    page_count: int = 0
    outline: dict = {}
    doc_summary: Optional[str] = None
    chunks: list[AttachmentChunkResult]

class VerifiedDocReference(BaseModel):
    model_config = ConfigDict(strict=True)
    reference_id: str
    utterance_id: str
    speaker: str
    attachment_id: str
    chunk_id: str
    reference_type: str
    raw_phrase: str
    confidence: float
    resolution_method: str
    reason: Optional[str] = None
