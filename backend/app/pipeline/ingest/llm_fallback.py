"""LLM fallback parsing for messy / unstructured transcripts, with chunking.

WHERE this runs:
    rules (adapters) -> [if quality poor] -> THIS -> normalize pipeline

WHY only here: rule adapters are great at *known structure* (VTT cues,
"Speaker:" lines) - deterministic, free, lossless. They are useless on an
unlabeled paragraph blob with no timestamps. The LLM's job is narrow:
SEGMENT the text into turns and ATTRIBUTE speakers. It never invents timestamps
(the normalize pipeline assigns synthetic ones) and every row is validated by
Pydantic, so the LLM can never widen the schema.

Long transcripts are chunked on SAFE sentence boundaries with overlap, then
stitched + de-duplicated, so no turn is cut in half and nothing is double-counted.
"""

from __future__ import annotations

import re

from langchain_core.messages import SystemMessage, HumanMessage
from app.pipeline.ingest.adapters.vtt import RawUtterance
from app.llm.client import ParsedTranscriptResponse, get_chat_model
from app.schemas.meeting import SourceType

_SYSTEM = (
    "You convert a messy meeting transcript into structured turns. "
    'Return STRICT JSON only: {"utterances":[{"speaker": string|null, "text": string}]}. '
    "Rules: (1) one object per speaking turn, in chronological order; "
    "(2) speaker = the person's name/label if identifiable, else null; "
    "(3) text must be VERBATIM - do not summarize, translate, or add words; "
    "(4) no commentary, JSON only."
)

# Sentence / line boundary - the smallest unit we will never cut across.
_SEGMENT_RE = re.compile(r"[^.!?\n]*[.!?\n]+|\S[^.!?\n]*$")
_NORM_RE = re.compile(r"[^a-z0-9 ]+")

SYNTHETIC_STEP = 3.0


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def quality_is_poor(raw: list[RawUtterance], source_type: SourceType) -> bool:
    """Decide whether the rule adapters did badly enough to warrant the LLM."""
    if len(raw) <= 1:
        return True  # whole meeting collapsed into one blob
    if source_type == SourceType.PLAIN_TEXT:
        labeled = sum(1 for r in raw if r.speaker and r.speaker != "Unknown")
        if labeled / len(raw) < 0.5:  # mostly unattributed
            return True
    return False


def _segments(content: str) -> list[str]:
    return [s.strip() for s in _SEGMENT_RE.findall(content) if s.strip()]


def chunk_text(content: str, max_tokens: int = 1200, overlap_segments: int = 2) -> list[str]:
    """Pack whole sentences into token-budgeted chunks; repeat `overlap_segments`
    sentences across each boundary so a straddling turn is seen whole somewhere."""
    segs = _segments(content)
    if not segs:
        return []
    chunks: list[str] = []
    i, n = 0, len(segs)
    while i < n:
        cur: list[str] = []
        tokens = 0
        if chunks and overlap_segments > 0:
            for seg in segs[max(0, i - overlap_segments):i]:
                cur.append(seg)
                tokens += _estimate_tokens(seg)
        j = i
        while j < n:
            t = _estimate_tokens(segs[j])
            if cur and tokens + t > max_tokens:
                break
            cur.append(segs[j])
            tokens += t
            j += 1
        chunks.append(" ".join(cur))
        if j >= n:
            break
        i = j
    return chunks


def _norm(text: str) -> str:
    return _NORM_RE.sub("", text.lower()).strip()


def _is_dup(text: str, recent: list[str]) -> bool:
    c = _norm(text)
    if not c:
        return True
    for p in recent:
        if c == p:
            return True
        if (c in p or p in c) and min(len(c), len(p)) / max(len(c), len(p)) > 0.8:
            return True
    return False


async def llm_reparse(
    content: str | bytes,
    *,
    max_chunk_tokens: int = 1200,
    overlap_segments: int = 2,
) -> list[RawUtterance]:
    """Segment messy text via the LLM (chunked if long) into RawUtterances.

    Timestamps are NOT requested from the model; we assign deterministic
    synthetic times here so ordering survives. Returns [] if the model produced
    nothing (e.g. the mock client), letting the caller keep the rule output.
    """
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="replace")

    chunks = chunk_text(content, max_chunk_tokens, overlap_segments) or [content]
    llm = get_chat_model()
    chain = llm.with_structured_output(ParsedTranscriptResponse)

    kept: list[tuple[str | None, str]] = []
    recent_norms: list[str] = []
    for chunk in chunks:
        resp = await chain.ainvoke([
            SystemMessage(content=_SYSTEM),
            HumanMessage(content=chunk)
        ])
        for u in resp.utterances:
            text = (u.text or "").strip()
            if not text or _is_dup(text, recent_norms[-4:]):
                continue
            kept.append((u.speaker, text))
            recent_norms.append(_norm(text))

    raw: list[RawUtterance] = []
    clock = 0.0
    for speaker, text in kept:
        raw.append(
            RawUtterance(
                speaker=(speaker or "Unknown").strip() or "Unknown",
                start=clock,
                end=clock + SYNTHETIC_STEP,
                text=text,
                raw_text=text,
            )
        )
        clock += SYNTHETIC_STEP
    return raw
