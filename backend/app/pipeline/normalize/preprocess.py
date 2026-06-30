"""Text preprocessing utilities for transcript cleanup.

Applied after ingest, before normalization. Cleans filler words, VTT artifacts,
normalizes speaker names, and absorbs backchannel utterances.
"""

from __future__ import annotations

import re

from rapidfuzz import fuzz

from app.pipeline.ingest.adapters.vtt import RawUtterance


# ── Filler words (standalone or repeated) ─────────────────────────────
_FILLERS = re.compile(
    r"\b(um+|uh+|er+|ah+|hm+|mm+|hmm+|mhm+|uhh+|ehh+|like,?\s+like"
    r"|you know|I mean|sort of|kind of|basically|actually|literally)\b",
    re.I,
)

# ── VTT / transcript artifacts ────────────────────────────────────────
_ARTIFACTS = re.compile(
    r"\[(Music|Applause|Laughter|Silence|Inaudible|Crosstalk|Background noise"
    r"|Phone ringing|Coughing|Pause)\]",
    re.I,
)

# ── Whitespace normalization ──────────────────────────────────────────
_MULTI_SPACE = re.compile(r"\s{2,}")
_TRAILING_PUNCT = re.compile(r"([,;:\s])+$")
_LEADING_PUNCT = re.compile(r"^([,;:\s])+")

# ── Backchannel tokens (case-insensitive full-match) ──────────────────
_BACKCHANNELS = {
    "yeah", "yes", "yep", "yup", "ya", "yea",
    "no", "nope", "nah",
    "ok", "okay", "k",
    "right", "sure", "exactly", "absolutely",
    "mm-hmm", "mm hmm", "mhm", "mmhmm", "uh-huh", "uh huh",
    "hmm", "hm", "ah", "oh",
    "got it", "i see", "fair enough",
    "thanks", "thank you",
}


# ===================== Text Cleanup =====================


def clean_text(text: str) -> str:
    """Strip fillers, artifacts, and normalize whitespace."""
    text = _ARTIFACTS.sub("", text)
    text = _FILLERS.sub("", text)
    text = _MULTI_SPACE.sub(" ", text)
    text = _LEADING_PUNCT.sub("", text)
    text = _TRAILING_PUNCT.sub("", text)
    return text.strip()


def clean_utterances(utterances: list[RawUtterance]) -> list[RawUtterance]:
    """Apply text cleanup to all utterances. Drops utterances that become empty."""
    cleaned = []
    for u in utterances:
        new_text = clean_text(u.text)
        if not new_text:
            continue
        cleaned.append(
            RawUtterance(
                id=u.id, speaker=u.speaker, start=u.start, end=u.end,
                text=new_text, raw_text=u.raw_text,
            )
        )
    return cleaned


# ===================== Backchannel Absorption =====================


def is_backchannel(text: str) -> bool:
    """Check if an utterance is a short backchannel response."""
    return text.strip().lower().rstrip(".!?,") in _BACKCHANNELS


def absorb_backchannels(utterances: list[RawUtterance]) -> list[RawUtterance]:
    """Remove backchannel utterances that interrupt a speaker's flow.

    If A speaks, B says "Yeah", A continues — the "Yeah" is dropped.
    """
    if len(utterances) < 3:
        return list(utterances)

    result: list[RawUtterance] = []
    i = 0
    while i < len(utterances):
        u = utterances[i]
        if (
            is_backchannel(u.text)
            and 0 < i < len(utterances) - 1
            and utterances[i - 1].speaker == utterances[i + 1].speaker
            and utterances[i - 1].speaker != u.speaker
        ):
            i += 1
            continue
        result.append(u)
        i += 1
    return result


# ===================== Speaker Name Normalization =====================


def normalize_speaker_names(
    utterances: list[RawUtterance],
    similarity_threshold: int = 80,
) -> tuple[list[RawUtterance], dict[str, str]]:
    """Normalize inconsistent speaker names to canonical short forms.

    Groups similar names, extracts a short name (like first name),
    and attributes "Unknown" speakers sandwiched between same-speaker turns.
    Returns (normalized_utterances, participant_map).
    """
    all_names = sorted({u.speaker for u in utterances if u.speaker != "Unknown"})
    if not all_names:
        return list(utterances), {}

    # Build canonical name map using fuzzy matching
    groups: list[list[str]] = []
    for name in all_names:
        matched = False
        for group in groups:
            if any(
                fuzz.ratio(name.lower(), g.lower()) >= similarity_threshold
                or fuzz.partial_ratio(name.lower(), g.lower()) >= 90
                for g in group
            ):
                group.append(name)
                matched = True
                break
        if not matched:
            groups.append([name])

    canonical_map: dict[str, str] = {}
    participant_map: dict[str, str] = {}
    used_short_names = set()

    for group in groups:
        canonical_long = max(group, key=len)
        candidate_short = canonical_long.split()[0] if canonical_long else ""

        if not candidate_short or candidate_short in used_short_names:
            short_name = canonical_long
        else:
            short_name = candidate_short

        used_short_names.add(short_name)
        participant_map[short_name] = canonical_long

        for name in group:
            canonical_map[name] = short_name

    # Apply canonical names
    result = [
        RawUtterance(
            id=u.id,
            speaker=canonical_map.get(u.speaker, u.speaker),
            start=u.start, end=u.end, text=u.text, raw_text=u.raw_text,
        )
        for u in utterances
    ]

    # Attribute "Unknown" between same-speaker turns
    for i in range(1, len(result) - 1):
        if (
            result[i].speaker == "Unknown"
            and result[i - 1].speaker == result[i + 1].speaker
            and result[i].start - result[i - 1].end < 3.0
        ):
            result[i] = RawUtterance(
                id=result[i].id,
                speaker=result[i - 1].speaker,
                start=result[i].start, end=result[i].end,
                text=result[i].text, raw_text=result[i].raw_text,
            )

    return result, participant_map


# ===================== Combined Pipeline =====================


def preprocess(utterances: list[RawUtterance]) -> tuple[list[RawUtterance], dict[str, str]]:
    """Full preprocessing: speaker normalization -> text cleanup -> backchannel absorption."""
    utterances, p_map = normalize_speaker_names(utterances)
    utterances = clean_utterances(utterances)
    utterances = absorb_backchannels(utterances)
    return utterances, p_map
