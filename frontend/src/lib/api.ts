export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface MeetingListItem {
  id: string;
  title: string;
  recorded_at: string;
  status: string;
  duration: string;
  participants: string[];
  summary: string;
  action_items: { id: string; text: string; owner?: string; deadline?: string }[];
  tags?: string[];
}

export interface MeetingDetail {
  id: string;
  title: string;
  recorded_at: string;
  status: string;
  duration: string;
  participants: string[];
  raw_vtt_content?: string;
  transcript: { id: string; speaker: string; start: number; end: number; text: string; raw_text?: string; source_doc_refs?: { doc_chunk_id: string; chunk_text: string; page_number?: number; attachment_id?: string; filename?: string; mime_type?: string; snippet?: string }[] }[];
  key_moments: { id: string; type: string; text: string; confidence: number; source_ids: string[]; source_doc_refs?: string[] }[];
  topics_data: { overall_topic?: string; overall_description?: string; topics?: any[] };
  markdown_report: string;
  citations_used: string[];
  action_items: { id: string; text: string; owner?: string; deadline?: string; confidence: number; source_utterance_ids: string[]; source_key_moment_ids: string[]; source_doc_refs?: string[] }[];
  inferred_insights: { discussion_insights?: any[]; risks_and_blockers?: any[]; follow_up_points?: any[] };
  knowledge_facts: { id: string; text: string; source_key_moment_ids: string[]; tags?: string[] }[];
  team_prep: { team_announcements?: any[]; structured_assignments?: any[] };
  team_analysis: { collaboration_dynamics?: string[]; decision_drivers?: any[]; overall_sentiment?: string; individual_feedback?: { speaker: string; speaker_type: string; key_moments_count: number; individual_feedback: string; }[] };
  participation: { participants?: string[]; total_duration_seconds?: number; metrics?: any[] };
  workflow_traces: { id: string; step_name: string; status: string; input_summary?: string; output_summary?: string; output_data?: any; execution_time_ms: number; created_at: string }[];
  attachments?: { id: string; filename: string; mime_type: string; status: string; slide_count?: number; page_count?: number; outline?: string; doc_summary?: string; storage_path?: string; }[];
  attachment_chunks?: { chunk_id: string; attachment_id: string; locator_type: string; locator_value: string; title: string; text: string; }[];
  doc_references?: { id: string; utterance_id: string; speaker: string; attachment_id: string; chunk_id: string; reference_type: string; raw_phrase: string; confidence: number; resolution_method: string; }[];
  cross_meeting_links?: { target_meeting_id: string; similarity_score: number; reason: string }[];
  semantic_chunks?: { id: string; chunk_type: string; text: string; metadata_dict: any }[];
  tags?: string[];
}

export const BASE_URL = 'http://localhost:8000';

export const DUMMY_MEETING_ID = "test-dummy-meeting";

export const DUMMY_MEETING_LIST_ITEM: MeetingListItem = {
  id: DUMMY_MEETING_ID,
  title: "🚀 Project Titan: Q3 Architecture & LangGraph Alignment",
  recorded_at: new Date().toISOString(),
  status: "Fully Processed",
  duration: "45m",
  participants: ["Sarah Jenkins", "Alex Chen", "David Miller", "Elena Rostova"],
  summary: "Comprehensive architectural review of the Q3 LangGraph workflow engine. Covered key technical decisions, action items for database migration, and resolved blocker items.",
  action_items: [
    { id: "act-1", text: "Finalize the Q3 database migration schema and review with the DevOps team", owner: "Alex Chen", deadline: "Friday 5 PM" },
    { id: "act-2", text: "Integrate LangGraph checkpoint recovery mechanism for long-running workflows", owner: "Elena Rostova", deadline: "Next Tuesday" }
  ]
};

export const DUMMY_MEETING_DETAIL: MeetingDetail = {
  id: DUMMY_MEETING_ID,
  title: "🚀 Project Titan: Q3 Architecture & LangGraph Alignment",
  recorded_at: new Date().toISOString(),
  status: "Fully Processed",
  duration: "45m",
  participants: ["Sarah Jenkins", "Alex Chen", "David Miller", "Elena Rostova"],
  raw_vtt_content: `WEBVTT

00:00:01.000 --> 00:00:10.000
Sarah Jenkins: Welcome everyone to the Q3 Architecture alignment. Today we need to lock in our decisions for the LangGraph workflow engine and the database migration.

00:00:11.000 --> 00:00:25.000
Alex Chen: Thanks Sarah. I looked at the current Postgres schema. If we are going to support high-throughput checkpointing, we need to finalize the Q3 database migration schema and review it with DevOps before Friday.

00:00:26.000 --> 00:00:40.000
Elena Rostova: I agree. On the LangGraph side, we also need to integrate the checkpoint recovery mechanism for long-running workflows so we don't lose state during server restarts. I can take that by next Tuesday.

00:00:41.000 --> 00:00:55.000
David Miller: One major risk we should track is the third-party API rate limits during peak synchronization. If we hit the cap, the entire workflow queues up. We should add an exponential backoff circuit breaker.`,
  transcript: [
    { id: "1", speaker: "Sarah Jenkins", start: 1, end: 10, text: "Welcome everyone to the Q3 Architecture alignment. Today we need to lock in our decisions for the LangGraph workflow engine and the database migration." },
    { id: "2", speaker: "Alex Chen", start: 11, end: 25, text: "Thanks Sarah. I looked at the current Postgres schema. If we are going to support high-throughput checkpointing, we need to finalize the Q3 database migration schema and review it with DevOps before Friday." },
    { id: "3", speaker: "Elena Rostova", start: 26, end: 40, text: "I agree. On the LangGraph side, we also need to integrate the checkpoint recovery mechanism for long-running workflows so we don't lose state during server restarts. I can take that by next Tuesday." },
    { id: "4", speaker: "David Miller", start: 41, end: 55, text: "One major risk we should track is the third-party API rate limits during peak synchronization. If we hit the cap, the entire workflow queues up. We should add an exponential backoff circuit breaker." }
  ],
  key_moments: [
    { id: "km-1", type: "Key Moment", text: "Need to lock in decisions for LangGraph workflow engine and database migration.", confidence: 0.95, source_ids: ["1", "2", "3", "4"] },
    { id: "km-2", type: "Key Moment", text: "Database migration schema must support high-throughput checkpointing.", confidence: 0.92, source_ids: ["2"] },
    { id: "km-3", type: "Key Moment", text: "LangGraph checkpoint recovery mechanism needed to prevent state loss during restarts.", confidence: 0.96, source_ids: ["3"] },
    { id: "km-4", type: "Key Moment", text: "Identified API rate limits as a blocker during peak synchronization.", confidence: 0.94, source_ids: ["4"] }
  ],
  topics_data: {
    overall_topic: "Project Titan: Q3 Architecture & LangGraph Alignment",
    overall_description: "Strategic alignment on high-throughput database schemas, LangGraph checkpoint recovery, and API rate limiting circuit breakers.",
    topics: [
      { name: "Database & Checkpointing Schema", description: "Discussion on scaling Postgres for high-throughput workflow states.", source_ids: ["2"] },
      { name: "LangGraph State Recovery", description: "Implementing robust recovery mechanisms for server restarts.", source_ids: ["3"] },
      { name: "API Rate Limiting & Circuit Breakers", description: "Mitigating risks associated with peak synchronization bottlenecks.", source_ids: ["4"] }
    ]
  },
  markdown_report: `**Tags:** \`Architecture\` \`Postgres\` \`Database\` \`LangGraph\` \`Reliability\`

The team convened to finalize the Q3 architectural direction, specifically focusing on scaling the LangGraph workflow engine and ensuring high-availability state persistence [km-1]. Major technical vectors were established across database migration, state recovery, and API risk mitigation.

## 🏛️ Architecture & Database Migration

To support high-throughput checkpointing without database bottlenecks, the Postgres migration schema must be finalized and vetted by the DevOps team [km-2]. This represents the critical path for Q3 deliverables.

- **Primary Action**: Finalize schema and conduct DevOps review [act-1].
- **Owner**: Alex Chen (Due Friday 5 PM)

## 🔄 LangGraph Checkpoint Recovery

Unplanned server restarts pose a risk to long-running asynchronous agent workflows. The team agreed to integrate a dedicated checkpoint recovery mechanism [km-3]. This ensures full state preservation and zero data loss during restarts.

- **Primary Action**: Integrate checkpoint recovery mechanism [act-2].
- **Owner**: Elena Rostova (Due Next Tuesday)

## ⚠️ Risks & Circuit Breakers

During peak synchronization windows, third-party API rate limits pose a systemic bottleneck [km-4]. 

> **Technical Decision**: Implement an exponential backoff circuit breaker to prevent cascade queuing across agent workers [ii-1].

## 📊 Quick Reference Table

| Objective Area | Assigned Lead | Target Deadline | Key Reference |
| :--- | :--- | :--- | :--- |
| Database Migration Schema | Alex Chen | Friday 5 PM | [km-2] |
| Checkpoint Recovery Engine | Elena Rostova | Next Tuesday | [km-3] |
| API Circuit Breaker | David Miller | Q3 Backlog | [ii-1] |
`,
  citations_used: ["km-1", "km-2", "km-3", "km-4", "act-1", "act-2", "ii-1"],
  action_items: [
    { id: "act-1", text: "Finalize the Q3 database migration schema and review with the DevOps team", owner: "Alex Chen", deadline: "Friday 5 PM", confidence: 0.95, source_utterance_ids: ["2"], source_key_moment_ids: ["km-2"] },
    { id: "act-2", text: "Integrate LangGraph checkpoint recovery mechanism for long-running workflows", owner: "Elena Rostova", deadline: "Next Tuesday", confidence: 0.94, source_utterance_ids: ["3"], source_key_moment_ids: ["km-3"] }
  ],
  inferred_insights: {
    discussion_insights: [
      { insight: "Database checkpointing requires dedicated schema validation to avoid locking issues.", source_ids: ["2"] },
      { insight: "Long-running workflows must survive server restarts via state hydration.", source_ids: ["3"] }
    ],
    risks_and_blockers: [
      { risk: "Third-party API rate limits could cause workflow queue backup during peak synchronization. Need exponential backoff circuit breaker.", source_ids: ["4"] }
    ],
    follow_up_points: []
  },
  knowledge_facts: [
    { id: "kf-1", text: "Current Postgres schema requires adjustments for high-throughput checkpointing.", source_key_moment_ids: ["km-2"], tags: ["Architecture", "Postgres", "Database"] },
    { id: "kf-2", text: "LangGraph workflows can lose in-memory state during restarts if uncheckpointed.", source_key_moment_ids: ["km-3"], tags: ["LangGraph", "Architecture", "Reliability"] }
  ],
  team_prep: {
    team_announcements: [
      { announcement: "All Q3 architectural proposals must be submitted before Friday.", source_ids: ["1"] }
    ]
  },
  team_analysis: {
    collaboration_dynamics: [
      "Highly collaborative session with direct ownership alignment across engineering pillars.",
      "Clear, actionable takeaways were established without major conflict."
    ],
    decision_drivers: [
      { driver: "Architectural reliability and state persistence during server restarts.", source_ids: ["3"] },
      { driver: "High throughput performance under peak synchronization loads.", source_ids: ["2", "4"] }
    ],
    overall_sentiment: "Optimistic & Action-Oriented",
    individual_feedback: [
      { speaker: "Sarah Jenkins", speaker_type: "Facilitator", key_moments_count: 1, individual_feedback: "Steered the conversation expertly, ensuring decisions were finalized." },
      { speaker: "Alex Chen", speaker_type: "Driver", key_moments_count: 3, individual_feedback: "Drove the schema migration discussion efficiently." },
      { speaker: "David Miller", speaker_type: "Subject Matter Expert", key_moments_count: 1, individual_feedback: "Raised critical points on rate limiting and system boundaries." },
      { speaker: "Elena Rostova", speaker_type: "Driver", key_moments_count: 2, individual_feedback: "Took strong ownership of the checkpoint recovery mechanism." }
    ]
  },
  participation: {
    participants: ["Sarah Jenkins", "Alex Chen", "David Miller", "Elena Rostova"],
    total_duration_seconds: 2700,
    metrics: [
      { participant: "Sarah Jenkins", speaking_time_seconds: 300, percentage: 25 },
      { participant: "Alex Chen", speaking_time_seconds: 350, percentage: 30 },
      { participant: "Elena Rostova", speaking_time_seconds: 320, percentage: 25 },
      { participant: "David Miller", speaking_time_seconds: 280, percentage: 20 }
    ]
  },
  workflow_traces: [
    { id: "tr-1", step_name: "Audio VTT Ingestion", status: "SUCCESS", input_summary: "4 speaker utterances", output_summary: "VTT parsed successfully", execution_time_ms: 120, created_at: new Date().toISOString() },
    { id: "tr-2", step_name: "Key Moments Extraction", status: "SUCCESS", input_summary: "4 utterances", output_summary: "Found 4 key moments", execution_time_ms: 450, created_at: new Date().toISOString() },
    { id: "tr-3", step_name: "Topic Segregation", status: "SUCCESS", input_summary: "4 key moments", output_summary: "Categorized 3 major topics", execution_time_ms: 380, created_at: new Date().toISOString() },
    { id: "tr-4", step_name: "Summary & Recap Generation", status: "SUCCESS", input_summary: "Topics & Highlights", output_summary: "Markdown executive report generated with 7 citations", execution_time_ms: 890, created_at: new Date().toISOString() }
  ]
};

export async function fetchMeetings(): Promise<MeetingListItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/meetings`);
    if (!res.ok) throw new Error('Failed to fetch meetings');
    return await res.json();
  } catch (err) {
    console.warn("Backend fetch failed, returning empty meeting list", err);
    return [];
  }
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/meetings/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(name: string, email?: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/meetings/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

export async function uploadVttFile(file: File): Promise<{ meeting_id: string; filename: string; speakers: string[]; utterances?: { id: string; speaker: string; text: string; start: number; end: number }[] }> {
  return uploadMeetingFiles(file, []);
}

export async function uploadMeetingFiles(transcriptFile: File, attachmentFiles: File[]): Promise<{ meeting_id: string; filename: string; speakers: string[]; attachments?: any[] }> {
  const formData = new FormData();
  formData.append('file', transcriptFile);
  attachmentFiles.forEach(file => {
    formData.append('attachments', file);
  });
  
  const res = await fetch(`${BASE_URL}/meetings/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload meeting files');
  return res.json();
}

export async function mapMeetingSpeakers(meetingId: string, mappings: Record<string, string>): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}/speaker-mappings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mappings }),
  });
  if (!res.ok) throw new Error('Failed to map speakers');
  return res.json();
}

export async function processMeetingPipeline(meetingId: string): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}/process`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to process meeting pipeline');
  return res.json();
}

export async function fetchMeetingDetail(meetingId: string): Promise<MeetingDetail> {
  try {
    const res = await fetch(`${BASE_URL}/meetings/${meetingId}`);
    if (!res.ok) throw new Error('Failed to fetch meeting detail');
    return await res.json();
  } catch (err) {
    console.warn(`Backend fetch failed for ${meetingId}`, err);
    throw err;
  }
}

export async function deleteMeeting(meetingId: string): Promise<{ status: string }> {
  if (meetingId === DUMMY_MEETING_ID) {
    return { status: "deleted dummy meeting" };
  }
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete meeting');
  return res.json();
}

export async function dispatchMeetingSummaries(meetingId: string): Promise<{ status: string; dispatched: { participant: string; email: string; status: string }[] }> {
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}/dispatch-summaries`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to dispatch meeting summaries');
  return res.json();
}

export interface VoiceProfile {
  id: string;
  user_id: string;
  name: string;
}

export async function enrollVoiceProfile(userId: string, file: File): Promise<{ id: string; user_id: string; name: string; status: string }> {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/voice/enroll`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to enroll voice profile');
  return res.json();
}

export async function fetchVoiceProfiles(): Promise<VoiceProfile[]> {
  try {
    const res = await fetch(`${BASE_URL}/voice/profiles`);
    if (!res.ok) throw new Error('Failed to fetch voice profiles');
    return await res.json();
  } catch (err) {
    console.warn("Backend fetch failed for voice profiles, returning empty list", err);
    return [];
  }
}

export interface KnowledgeGroupMeeting {
  id: string;
  title: string;
  recorded_at: string;
  duration: string;
  status: string;
  participants: string[];
  tags: string[];
}

export interface KnowledgeGroup {
  id: string;
  tag: string;
  group_title: string;
  group_description: string;
  group_goal: string;
  progress_gist: string;
  meeting_count: number;
  updated_at: string;
  meetings: KnowledgeGroupMeeting[];
}

export async function fetchGroups(): Promise<KnowledgeGroup[]> {
  try {
    const res = await fetch(`${BASE_URL}/meetings/groups`);
    if (!res.ok) throw new Error('Failed to fetch groups');
    return await res.json();
  } catch (err) {
    console.warn("Backend fetch failed for groups, returning empty list", err);
    return [];
  }
}
