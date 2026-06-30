# Meet-Ink Agent Architecture — Deep Dive Report

---

## 1. Overview

Meet-Ink's intelligence layer is a **multi-tier LLM agent system** built on LangGraph + LangChain. It is responsible for two distinct roles:

| Role | Agent | Framework |
|---|---|---|
| **Query Answering** | ReAct RAG Agent (`rag_agent.py`) | `langgraph.prebuilt.create_react_agent` |
| **Knowledge Grouping** | Group Synthesis Mini-Graph (`group_synthesis_agent.py`) | `langgraph.graph.StateGraph` |
| **Structured Extraction** | Per-stage LLM calls via `client.py` schemas | LangChain `with_structured_output` |

---

## 2. LLM Provider Layer — `client.py`

### 2.1 Provider Routing Logic

`get_chat_model()` implements a **priority cascade** with four providers and a mock fallback:

```
1. LLM_MOCK=true                → MockChatModel()             [no API call, instant]
2. llm_provider == "groq"       → ChatGroq (llama-3.3-70b)   [temperature=0.0]
3. llm_provider == "openai"     → ChatOpenAI (gpt-4o-mini)   [temperature=0.0, custom base_url]
4. llm_provider == "gemini"     → ChatGoogleGenerativeAI     [temperature=0.0]
5. llm_provider == "ollama"     → ChatOllama (local)         [temperature=0.0]
6. Fallback: any groq_api_key   → ChatGroq
7. Fallback: any openai_api_key → ChatOpenAI
8. Ultimate fallback             → MockChatModel()
```

**Key Design Decision**: All providers use `temperature=0.0` — the agent is tuned for **deterministic, factual retrieval**, not creative generation.

**SSL bypass**: All HTTP clients are instantiated with `verify=False, trust_env=False` to bypass corporate SSL inspection (specific to this deployment environment).

### 2.2 Embedding Model — `get_embedding_model()`

- **Model**: `all-MiniLM-L6-v2` (HuggingFace)
- **Source**: Locally cloned at `backend/all-MiniLM-L6-v2/` — completely offline, no network dependency
- **Dimensionality**: 768-float vectors
- **MockEmbeddingModel**: Returns `[0.0] * 768` — all vectors identical, meaning cosine distance comparisons will be non-differentiating in mock mode (prevents crashes, data just won't be meaningful)
- **Used by**: `search_meetings`, `generate_timeline`, `resolve_conflicting_information`

### 2.3 Structured Output Schemas (LLM Extraction Contracts)

Every pipeline stage uses `llm.with_structured_output(Schema)` to force typed Pydantic output. These schemas are the **contracts** between the LLM and the pipeline:

| Schema | Purpose | Key Fields |
|---|---|---|
| `KeyMomentsResponse` | Extract decisions/action items/risks from transcript windows | `key_moments[].type`, `confidence`, `source_utterance_ids` |
| `TopicSegregationResponse` | Hierarchical topic clustering | `overall_topic`, `topics[].sub_topics[].points` |
| `SummaryRecapResponse` | Full markdown meeting report | `markdown_report`, `action_items[]`, `citations_used` |
| `InferredInsightsResponse` | Risk & insight analysis | `risk_dimensions`, `insight_dimensions`, `risks_and_blockers`, `follow_up_points` |
| `KnowledgeExtractResponse` | Permanent organizational facts | `permanent_facts[].fact`, `.category` |
| `TeamPrepResponse` | Structured task handoff | `team_announcements`, `structured_assignments[].tasks` |
| `TeamAnalysisResponse` | Participant behavior analysis | `individual_feedback[].speaker_type`, `collaboration_dynamics`, `overall_sentiment` |
| `TemporalInterpretResponse` | Date/time resolution from mentions | `interpretation` (enum), `resolved_datetime`, `calendar_action` |
| `ActionItemsResponse` | Action item extraction | `actions[].owner`, `.deadline`, `.confidence` |
| `DecisionsResponse` | Decision extraction | `decisions[].confidence`, `.source_utterance_ids` |
| `RisksResponse` | Risk extraction | `risks[].blocker` (bool), `.dependency` |
| `HighlightsResponse` | Multi-class key moment extraction | `highlights[].type` (action_item/decision/risk/key_point) |
| `SegmentLabelResponse` | Auto-label a transcript segment | `title`, `confidence` |
| `GistResponse` | One-paragraph meeting gist | `gist` |
| `CompressSummaryResponse` | Rolling window compression | `summary` |

### 2.4 Mock Mode — `MockStructuredRunnable`

In mock mode, `_build_response()` dispatches on schema class name and returns hand-crafted fixture data. Key mock thresholds:

| Schema | Mock Confidence Values |
|---|---|
| `KeyMomentsResponse` | 0.9 (decision), 0.85 (action_item) |
| `ActionItemsResponse` | 0.75 (keyword-triggered), 0.5 (fallback) |
| `DecisionsResponse` | 0.8 |
| `RisksResponse` | 0.75 |
| `HighlightsResponse` | 0.9 (action_item), 0.85 (decision), 0.75 (risk), 0.7 (fallback) |
| `TemporalInterpretResponse` | 0.8 |
| `SegmentLabelResponse` | 0.75 |

Mock action item detection keywords: `"will "`, `"need to"`, `"action:"`, `"by next"`, `"take "`
Mock decision detection keywords: `"decided"`, `"decision"`, `"agreed"`, `"go with"`
Mock risk detection keywords: `"risk"`, `"blocker"`, `"dependency"`, `"concern"`, `"delay"`

---

## 3. The ReAct RAG Agent — `rag_agent.py`

### 3.1 Agent Type

Built using `langgraph.prebuilt.create_react_agent` — this creates a standard **ReAct (Reason + Act)** loop:

```
User Query
    ↓
[THINK] Plan which tools to call
    ↓
[ACT] Call tool → get ToolMessage result
    ↓
[OBSERVE] Incorporate result into context
    ↓
[THINK] Decide: call another tool OR generate final answer
    ↓
Final Answer (streamed)
```

**Recursion limit**: `30` iterations per query — prevents runaway loops.
**Tool call limit**: The system prompt enforces a **maximum of 3 tool call attempts** per query.

### 3.2 Chain of Thought Protocol

The system prompt mandates explicit reasoning using XML tags in the AI's text content:

```xml
<plan>...high-level plan for which tools to call and why...</plan>
<thought>...step-by-step reasoning for each tool call...</thought>
<confidence>...self-assessed confidence 0-100%...</confidence>
```

This is outputted in the AI message **before** any tool call, giving the streaming UI a visible reasoning trace.

### 3.3 Tool Inventory — All 15 Tools

#### Tool 1: `search_meetings`
**When to use**: First tool called for nearly any query about meeting content.
**Mechanism**: Vector cosine distance search on `MeetingSemanticChunk` table.
**Limit**: Returns top **10** chunks (configurable via SQLAlchemy `.limit(10)`)
**Scope**: Optional `meeting_id` filter for scoped searches
**Output**: Formatted result blocks with citation tags ready for verbatim copying

> **Threshold**: Results ranked by cosine distance — no explicit score threshold, relies on top-k retrieval.

---

#### Tool 2: `fetch_transcript_context`
**When to use**: After `search_meetings` finds a key moment, to get the raw conversation around it.
**Mechanism**: Given specific `target_utterance_ids`, expands a **±5 utterance window** (configurable via `context_window=5`) from the cleaned transcript JSONB.
**Output**: Raw utterance lines with `-->` arrows pointing to target utterances

> **Threshold**: `context_window=5` — fetches 5 utterances before and after the target for disambiguation context.

---

#### Tool 3: `fetch_document_reference`
**When to use**: When a key moment has `source_doc_refs` pointing to an attached slide or PDF.
**Mechanism**: Direct chunk_id lookup in `AttachmentChunk` table, then joins to `MeetingAttachment` for filename.
**Output**: Document name + page/slide locator + chunk text

---

#### Tool 4: `get_meeting_metadata`
**When to use**: Fetching high-level meeting facts without touching the vector index.
**Mechanism**: Direct SQL lookup on `Meeting` table — no embedding computation.
**Output**: Meeting ID, Title, Date, Duration, Participants list

---

#### Tool 5: `search_exact_transcript`
**When to use**: When semantic search fails to find proper nouns, acronyms, or exact phrases.
**Mechanism**: Case-insensitive substring (`in text.lower()`) scan of all cleaned_transcript JSONB arrays.
**Context window**: ±1 utterance around each match
**Limit**: Returns top **15 hits** to avoid overwhelming the LLM context window

> **Threshold**: Hard cap at 15 results. Any more risks exceeding context budget.

---

#### Tool 6: `list_action_items_by_person`
**When to use**: "What does [person] need to do?" queries.
**Mechanism**: SQL `ilike(f"%{person_name}%")` partial match on `MeetingActionItem.owner` column.
**Output**: Numbered list with citation tags `[act-N]` and verbatim `source_utterance_ids`

---

#### Tool 7: `generate_timeline`
**When to use**: Cross-meeting project tracking ("How has X evolved over time?")
**Mechanism**:
1. Embeds the topic string using `get_embedding_model()`
2. Searches across **ALL meetings** (no meeting_id filter) for top **15** most relevant semantic chunks
3. Joins each chunk to its meeting's `recorded_at` timestamp
4. Sorts events **chronologically** (`events.sort(key=lambda x: x["date"])`)
**Output**: Chronological timeline with `[date] (Meeting: title) [TYPE]: content`

> **Threshold**: 15 cross-meeting chunks retrieved — broader than single-meeting search (10) to capture topic evolution.

---

#### Tool 8: `speaker_activity_summary`
**When to use**: "What did [person] say in this meeting?"
**Mechanism**: Speaker name case-insensitive substring match on `cleaned_transcript` utterances.
**Output**: All utterances by that speaker, with `[id] text` format

---

#### Tool 9: `trace_reference_context` ⭐ (Unique Tool)
**When to use**: Resolving ambiguous pronouns ("that", "it", "he", "the project") found in search results.
**Mechanism** — Two-phase resolution:
1. **Phase 1**: Find target utterance index in cleaned transcript
2. **Phase 2**: Extract up to `max_lookback=20` preceding utterances as context
3. **Phase 3**: Feed context + target utterance to the LLM with a specialized pronoun resolution system prompt: *"You are a linguistic reference resolution AI..."*
4. LLM returns the resolved referent
**Output**: `"Resolution for [utterance_id]: [the referent]"`

> **Threshold**: `max_lookback=20` utterances of lookback. Enough for conversational pronoun chains but not unbounded.

---

#### Tool 10: `resolve_conflicting_information` ⭐ (Unique Tool)
**When to use**: When two extracted facts contradict each other (e.g., conflicting deadlines).
**Mechanism** — Three-phase conflict resolution:
1. Embeds both conflicting statements independently
2. Retrieves top **3** semantic chunks matching each statement (`limit(3)` per statement = up to 6 chunks total)
3. Deduplicates the combined context set
4. Calls LLM with: *"You are an AI conflict resolution agent..."* — determines which statement overrides the other based on temporal context in the transcript
**Output**: Conflict resolution explanation with ground truth

---

#### Tool 11: `get_related_meetings`
**When to use**: Establishing cross-meeting project context before a scoped search.
**Mechanism**: Direct SQL query on `MeetingLink` table (pre-computed similarity links) for `source_meeting_id`.
**Output**: Linked meetings with title, ID, date, and similarity score formatted to 2 decimal places

---

#### Tool 12: `get_meeting_summary`
**When to use**: User asks for "summary", "recap", "what happened" — fast, pre-computed answer.
**Mechanism**: Direct SQL lookup on `MeetingSummaryRecap` table — returns the cached `markdown_report`.
**Output**: Full markdown report (no LLM call needed)

> **Design**: This is the **highest-fidelity** summary tool — avoids hallucination by returning exactly what was computed by the summarization pipeline stage.

---

#### Tool 13: `get_meeting_insights_and_risks`
**When to use**: User asks about risks, concerns, insights, follow-ups.
**Mechanism**: Direct SQL lookup on `MeetingInferredInsight.insights_data` (JSONB) — returns `json.dumps(insights_data, indent=2)`.
**Output**: Formatted JSON of risk dimensions, insight dimensions, individual risks/blockers, follow-up points

---

#### Tool 14: `get_meeting_topics`
**When to use**: Understanding meeting agenda structure or topic hierarchy.
**Mechanism**: Direct SQL lookup on `MeetingTopic.topics_data` (JSONB).
**Output**: Full hierarchical topic JSON with sub-topics and points

---

#### Tool 15: `get_meetings_by_tag`
**When to use**: "Show me meetings about X" or grouping queries.
**Mechanism**:
1. Full scan of `MeetingKnowledgeFact.tags` column
2. Case-insensitive substring match: `tag_lower in t.lower() for t in f.tags`
3. Collects unique `meeting_ids` that match
4. Joins to `Meeting` table for title and date
**Output**: List of matching meetings with IDs

> **Limitation**: Full table scan (no tag index) — acceptable for small datasets but won't scale to thousands of meetings without an index.

---

### 3.4 Tool Selection Intelligence

The system prompt provides the agent with **explicit tool routing rules**:

| Query Type | Preferred First Tool |
|---|---|
| General meeting question | `search_meetings` |
| "Summary / What happened" | `get_meeting_summary` |
| "Risks / Concerns" | `get_meeting_insights_and_risks` |
| "Topics / Agenda" | `get_meeting_topics` |
| "Action items for [person]" | `list_action_items_by_person` |
| Exact phrase / name lookup | `search_exact_transcript` |
| Cross-meeting evolution | `generate_timeline` |
| Ambiguous pronoun in result | `trace_reference_context` |
| "Meetings about [tag]" | `get_meetings_by_tag` |
| Need granular conversation | `fetch_transcript_context` (after semantic search) |
| Document/slide reference | `fetch_document_reference` |
| Scoped query first step | `get_related_meetings` |

---

### 3.5 Citation System

The citation system enforces **verifiable, traceable answers**. Rules injected via system prompt:

| Citation Type | Format | Source |
|---|---|---|
| Transcript utterance | `[0]`, `[15]` (0-based, verbatim) | `source_utterance_ids` from tool results |
| Document chunk | `[doc-abc123]` or UUID | `chunk_id` from `fetch_document_reference` |
| Key Moment | `[km-1]`, `[km-2]` | `key_moment_id` from metadata |
| Action Item | `[act-1]`, `[act-2]` | 1-based index in list |
| Topic | `[tp-1]` | 1-based index |
| Insight/Risk | `[ii-1]`, `[ii-2]` | 1-based index |
| Knowledge Fact | `[kf-1]` | 1-based index |
| Summary | `[sum]` | Whole summary reference |
| **Multi-meeting** | `[meeting-uuid:km-1]` | Prefixed with meeting ID |

**Critical rule enforced**: Transcript IDs are **0-based and verbatim** — the agent must never renumber them as ordinal positions.

`_format_citation_block()` in `rag_agent.py` pre-formats the citation metadata per chunk so the LLM receives ready-to-copy citation tags, minimizing hallucinated citations.

---

### 3.6 Scoping Logic

When a `meeting_id` or `referred_meeting_ids` is provided in the API request, the system prompt is dynamically augmented:

```
[STRICT SCOPING ENABLED]
The user has explicitly scoped this query to: [uuid1, uuid2].
First step: use get_related_meetings on these IDs for broader context.
DO NOT search the general database outside of this scope.
```

Deduplication is applied: `target_ids = list(set(target_ids))`.

---

### 3.7 Conversation Context (Multi-Turn)

- Last **6 messages** from chat history are injected before the current query
- User messages → `HumanMessage`, AI messages → `AIMessage`
- Pronoun resolution rule: Agent must **explicitly substitute** pronouns with actual entity names before calling any search tool
- Never queries with `"the individual in question"` — always resolves to the real name first

---

### 3.8 Streaming Architecture

`POST /query` streams a **Newline-Delimited JSON (NDJSON)** response:

```python
StreamingResponse(generate(), media_type="application/x-ndjson")
```

Each streamed JSON line has a `type` field:

| Type | Content |
|---|---|
| `"ai"` | AI reasoning text + any pending `tool_calls` array |
| `"tool_result"` | Tool name + tool output string |
| `"error"` | Exception message |

The agent uses `astream(inputs, config={"recursion_limit": 30}, stream_mode="updates")` — each graph node update is emitted as it completes, giving the frontend real-time visibility into the agent's reasoning steps and tool calls.

---

## 4. Group Synthesis Mini-Graph — `group_synthesis_agent.py`

A separate, single-node **LangGraph StateGraph** used for generating group metadata when meetings are clustered by tag.

### Architecture

```
Input State: { tag, meeting_summaries[] }
       ↓
  [synthesize node]
       ↓
Output State: { group_title, group_description, group_goal, progress_gist }
       ↓
      END
```

### Context Building

For each meeting in the group:
- Takes first 600 characters of the `markdown_report`
- Takes `topics_data.overall_description`
- Formats as numbered blocks

### LLM Prompt

Direct freeform prompt (no structured output schema) requesting JSON with 4 fields:
- `group_title`: 5-8 words, thematic (not just the tag name)
- `group_description`: 1-2 sentences on collective theme
- `group_goal`: 1 sentence on overarching objective
- `progress_gist`: 3-8 words (e.g., "3 meetings, architecture decided")

### Robustness

- JSON extracted via regex `\{[\s\S]*\}` — tolerates markdown fences and preamble
- Full fallback to defaults on any LLM exception
- Singleton graph instance via `_graph` module-level cache (`get_group_synthesis_graph()`)

---

## 5. Full Data Flow Summary

```
User Query (Frontend)
        │
        ▼
POST /query  [query.py]
        │
        ├── Build chat history (last 6 msgs)
        ├── Inject system prompt (citations, CoT, scoping, tool routing rules)
        ├── Append meeting scope if provided
        │
        ▼
get_rag_agent_executor()  [rag_agent.py]
        │
        ├── get_chat_model()  → GPT-4o-mini / Llama-3.3-70b / Gemini / Ollama / Mock
        ├── Tool list: 15 tools registered
        └── create_react_agent(llm, tools)
                │
                ▼
          ReAct Loop  [langgraph]
                │
                ├── [THINK] Output <plan><thought><confidence> to stream
                ├── [ACT]  Call tool → DB query / embedding search / LLM sub-call
                ├── [OBSERVE] Incorporate ToolMessage into message state
                ├── [THINK] Plan next step or generate final answer
                │   (max 3 tool calls, 30 recursion limit)
                │
                ▼
          Final AI Answer (Markdown, with verbatim citation tags)
                │
                ▼
        NDJSON Stream → Frontend Knowledge Graph Chat
```

---

## 6. Confidence Thresholds Reference Table

| Stage / Component | Threshold | Effect |
|---|---|---|
| Semantic search | top-k=10 | No score cutoff, top 10 returned regardless |
| Cross-meeting timeline | top-k=15 | Wider net for temporal coverage |
| Conflict resolution | top-k=3 per statement | Focused evidence gathering |
| Transcript context window | ±5 utterances | Default neighborhood for granular fetch |
| Reference trace lookback | 20 utterances max | Pronoun resolution lookback depth |
| Exact transcript results | 15 hits cap | Prevents LLM context overflow |
| Mock action item confidence | 0.75 (hit), 0.5 (fallback) | Quality signal in mock mode |
| Mock decision confidence | 0.80 | |
| Mock risk confidence | 0.75 | |
| Mock highlight (action) | 0.90 | Highest priority signal |
| Chat history injected | last 6 messages | Recency-weighted context window |
| ReAct recursion limit | 30 iterations | Prevents infinite tool call loops |
| Max tool calls (enforced via prompt) | 3 per query | Latency + cost control |
| LLM temperature (all providers) | 0.0 | Fully deterministic output |
