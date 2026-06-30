import React, { useState, useRef, useEffect, Fragment } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import { SparkleIcon } from "@phosphor-icons/react"
import { Sparkles, Loader2, FileIcon, MessageSquare, ArrowUp, X, Network, Zap, Mic, BotIcon, ArrowRight, Paperclip, FileText, ChevronDown, Terminal, Cpu, ChevronRight, Copy, ThumbsUp, ThumbsDown, RefreshCcw, Database, Target, TrendingUp, CalendarDays, ExternalLink } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep, ChainOfThoughtSearchResults, ChainOfThoughtSearchResult, ChainTimelineColumn } from "@/components/ui/chain-of-thought"
import { Agent, AgentContent, AgentHeader, AgentInstructions, AgentOutput, AgentTool, AgentTools } from "@/components/ai-elements/agent"
import { Sources, SourcesContent, Source, SourcesTrigger } from "@/components/ai-elements/sources"
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "@/components/ai-elements/task"
import { Shimmer } from "@/components/ui/shimmer"
import { Timeline, TimelineItem, TimelineHeader, TimelineTitle, TimelineIndicator, TimelineSeparator, TimelineContent, TimelineDate } from "@/components/ui/timeline"
import { BASE_URL, fetchMeetings, fetchMeetingDetail, fetchGroups } from "@/lib/api"
import { lookupCitationSources, formatCitationTime, CITATION_REGEX, isCitationBracket, parseCitationTag } from "@/lib/citation-lookup"
import { cn } from "@/lib/utils"
import type { KnowledgeGroup } from "@/lib/api"
import remarkGfm from "remark-gfm"

const RECENT_DOCUMENTS = [
  { id: "d1", title: "q3_roadmap_planning_deck.pdf", type: "Document", time: "5 months ago" },
  { id: "d2", title: "eng_sync_architecture_notes.pdf", type: "Document", time: "5 months ago" },
  { id: "d3", title: "database_migration_guide.pdf", type: "Document", time: "5 months ago" },
]

const HISTORY_ITEMS = [
  { id: "h0", query: "Sample Preview Chat", agent: "Knowledge AI", time: "Just now", isSample: true },
  { id: "h1", query: "hi", agent: "Knowledge AI", time: "28 days ago" },
  { id: "h2", query: "What are the key provisions in Q3 roadmap?", agent: "Knowledge AI", time: "5 months ago" },
  { id: "h3", query: "Who is assigned to PostgreSQL load test?", agent: "Knowledge AI", time: "5 months ago" },
]

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  toolCalls?: any[];
  toolResults?: { name: string; content: string; timeTaken?: string }[];
  awaitingToolResult?: boolean;
  isStreaming?: boolean;
  startTime?: number;
  endTime?: number;
  scopedMeeting?: { id: string; title: string };
}

const JsonNestedList = ({ data }: { data: any }) => {
  if (typeof data !== "object" || data === null) {
    return <span className="text-muted-foreground">{String(data)}</span>;
  }
  if (Array.isArray(data)) {
    return (
      <ul className="list-disc pl-4 mt-1 space-y-1 marker:text-muted-foreground/50">
        {data.map((item, i) => (
          <li key={i}><JsonNestedList data={item} /></li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-1 mt-1">
      {Object.entries(data).map(([key, val]) => (
        <li key={key}>
          <span className="font-semibold text-foreground/70 capitalize text-xs tracking-wider">{key.replace(/_/g, " ")}:</span>{" "}
          <div className="pl-3 border-l-2 border-border/40 ml-1.5 mt-1 mb-2">
            <JsonNestedList data={val} />
          </div>
        </li>
      ))}
    </ul>
  );
};

const TOOL_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  search_meetings:               { label: "Semantic Knowledge Search",        icon: Network,      color: "text-blue-400"    },
  search_exact_transcript:       { label: "Exact Transcript Search",          icon: MessageSquare,color: "text-cyan-400"    },
  fetch_transcript_context:      { label: "Transcript Context Extraction",    icon: MessageSquare,color: "text-indigo-400"  },
  fetch_document_reference:      { label: "Document Reference Lookup",        icon: FileText,     color: "text-amber-400"   },
  get_meeting_metadata:          { label: "Meeting Metadata",                 icon: FileIcon,     color: "text-slate-400"   },
  get_meeting_summary:           { label: "Structured Summary Retrieval",     icon: Zap,          color: "text-emerald-400" },
  get_meeting_insights_and_risks:{ label: "Insights & Risk Analysis",         icon: TrendingUp,   color: "text-rose-400"    },
  get_meeting_topics:            { label: "Topic Hierarchy Retrieval",        icon: Network,      color: "text-violet-400"  },
  get_related_meetings:          { label: "Cross-Meeting Correlation",        icon: ArrowRight,   color: "text-teal-400"    },
  get_meetings_by_tag:           { label: "Meetings by Tag",                  icon: Target,       color: "text-orange-400"  },
  generate_timeline:             { label: "Chronological Timeline Build",     icon: CalendarDays, color: "text-yellow-400"  },
  list_action_items_by_person:   { label: "Action Items by Person",           icon: Database,     color: "text-pink-400"    },
  speaker_activity_summary:      { label: "Speaker Activity Analysis",        icon: Mic,          color: "text-purple-400"  },
  trace_reference_context:       { label: "Reference Disambiguation",         icon: Cpu,          color: "text-sky-400"     },
  resolve_conflicting_information:{ label: "Conflict Resolution",             icon: Zap,          color: "text-red-400"     },
}

const MEETING_IDENTIFY_TOOLS = new Set([
  "search_meetings",
  "search_exact_transcript",
  "get_related_meetings",
  "get_meetings_by_tag",
  "get_meeting_metadata",
])

function parseSearchResults(raw: string) {
  const blocks = raw.split(/---\s*Result \d+\s*---/).filter(Boolean)
  return blocks.map(block => {
    const meeting = block.match(/Meeting:\s*(.+)/)?.[1]?.trim() ?? "Unknown Meeting"
    const meetingId = block.match(/Meeting ID:\s*(.+)/)?.[1]?.trim() ?? ""
    const date = block.match(/Date:\s*(.+)/)?.[1]?.trim() ?? ""
    const type = block.match(/Type:\s*(.+)/)?.[1]?.trim() ?? ""
    const content = block.match(/Content:\s*([\s\S]*?)(?:\nAvailable Citations:|\nMetadata:|$)/)?.[1]?.trim() ?? ""
    return { meeting, meetingId, date, type, content }
  })
}

type ReferencedMeeting = { id: string; title: string; date?: string }

function meetingsFromToolResult(name: string, content: string): ReferencedMeeting[] {
  if (name === "search_meetings") {
    return [...new Map(
      parseSearchResults(content)
        .filter(r => r.meetingId)
        .map(r => [r.meetingId, { id: r.meetingId, title: r.meeting, date: r.date }])
    ).values()]
  }
  if (name === "search_exact_transcript") {
    const ids = [...new Set([...content.matchAll(/Meeting ID:\s*(\S+)/g)].map(m => m[1]))]
    return ids.map(id => ({ id, title: `Meeting ${id.slice(0, 8)}…` }))
  }
  if (name === "get_related_meetings") {
    return parseRelatedMeetings(content)
      .filter(r => r.id)
      .map(r => ({ id: r.id, title: r.title, date: r.date }))
  }
  if (name === "get_meetings_by_tag") {
    return content.split("\n").filter(l => l.startsWith("- Meeting:")).map(l => ({
      id: l.match(/ID: ([a-f0-9-]+)/)?.[1] ?? "",
      title: l.match(/Meeting: (.+?) \(/)?.[1] ?? "Meeting",
      date: l.match(/Date: (.+?)$/)?.[1] ?? "",
    })).filter(m => m.id)
  }
  if (name === "get_meeting_metadata") {
    const id = content.match(/Meeting ID:\s*(.+)/)?.[1]?.trim()
    const title = content.match(/Title:\s*(.+)/)?.[1]?.trim()
    if (id && title) {
      const date = content.match(/Date:\s*(.+)/)?.[1]?.trim()
      return [{ id, title, date }]
    }
  }
  return []
}

function collectReferencedMeetings(
  toolResults: { name: string; content: string }[] | undefined,
  scopedMeeting?: { id: string; title: string } | null
): ReferencedMeeting[] {
  const map = new Map<string, ReferencedMeeting>()
  if (scopedMeeting?.id) {
    map.set(scopedMeeting.id, { id: scopedMeeting.id, title: scopedMeeting.title })
  }
  toolResults?.forEach(tr => {
    meetingsFromToolResult(tr.name, tr.content).forEach(m => {
      if (m.id) map.set(m.id, { ...map.get(m.id), ...m })
    })
  })
  return [...map.values()]
}

function parseRelatedMeetings(raw: string) {
  const blocks = raw.split(/\n\n/).filter(Boolean)
  return blocks.map(block => {
    const title = block.match(/Linked Meeting:\s*(.+?)\s*\(/)?.[1]?.trim() ?? "Unknown"
    const id = block.match(/ID:\s*([a-f0-9-]+)/)?.[1]?.trim() ?? ""
    const date = block.match(/Date:\s*(.+?)\)/)?.[1]?.trim() ?? ""
    const reason = block.match(/Reason:\s*(.+)/)?.[1]?.trim() ?? ""
    const score = block.match(/Similarity Score:\s*([\d.]+)/)?.[1] ?? ""
    return { title, id, date, reason, score }
  })
}

function parseTranscriptLines(raw: string) {
  return raw.split("\n").filter(Boolean).map(line => {
    const isTarget = line.startsWith("-->")
    const clean = line.replace(/^-->\s*|^\s*/, "")
    const idMatch = clean.match(/^\[(\d+)\]/)
    const id = idMatch?.[1] ?? ""
    const rest = clean.replace(/^\[\d+\]\s*/, "")
    const colonIdx = rest.indexOf(":")
    const speaker = colonIdx > -1 ? rest.slice(0, colonIdx).trim() : ""
    const text = colonIdx > -1 ? rest.slice(colonIdx + 1).trim() : rest
    return { id, speaker, text, isTarget }
  })
}

function parseActionItems(raw: string) {
  const items: { meeting: string; deadline: string; action: string }[] = []
  let cur: any = {}
  for (const line of raw.split("\n")) {
    if (/^\d+\./.test(line.trim())) { if (cur.action) items.push(cur); cur = {} }
    if (line.includes("Meeting:")) cur.meeting = line.replace(/.*Meeting:/, "").trim()
    if (line.includes("Deadline:")) cur.deadline = line.replace(/.*Deadline:/, "").trim()
    if (line.includes("Action:")) cur.action = line.replace(/.*Action:/, "").trim()
  }
  if (cur.action) items.push(cur)
  return items
}

function parseTimeline(raw: string) {
  return raw.split("\n")
    .filter(l => l.startsWith("- ["))
    .map(line => {
      const date = line.match(/\[(.+?)\]/)?.[1] ?? ""
      const meeting = line.match(/Meeting: (.+?)\)/)?.[1] ?? ""
      const type = line.match(/\[([A-Z_]+)\]/)?.[1] ?? ""
      const content = line.replace(/- \[.+?\].+?\[.+?\]:\s*/, "").trim()
      return { date, meeting, type, content }
    })
}

const chunkTypeColor: Record<string, string> = {
  key_moment: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  topic: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  action_item: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  insight: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  summary: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  knowledge_fact: "bg-teal-500/15 text-teal-300 border-teal-500/20",
  transcript: "bg-slate-500/15 text-slate-300 border-slate-500/20",
}

const MeetingPill = ({ title, date, id, navigate }: { title: string; date?: string; id?: string; navigate: (path: string) => void }) => (
  <ChainOfThoughtSearchResult
    onClick={() => id && navigate(`/app/meeting-detail?meetingId=${id}`)}
    disabled={!id}
    className={!id ? "opacity-60 cursor-default" : undefined}
  >
    <FileIcon className="size-3 shrink-0 text-primary/60" />
    <span>{title}</span>
    {date && (
      <span className="text-muted-foreground/50 shrink-0">
        {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
    )}
    {id && <ExternalLink className="size-2.5 shrink-0 text-muted-foreground/40" />}
  </ChainOfThoughtSearchResult>
)

const ReferencedMeetingsBar = ({
  meetings,
  navigate,
  loading,
  isLast = false,
}: {
  meetings: ReferencedMeeting[]
  navigate: (path: string) => void
  loading?: boolean
  isLast?: boolean
}) => {
  if (meetings.length === 0 && !loading) return null
  return (
    <div className="flex gap-3 text-sm animate-in fade-in-0 duration-300">
      <ChainTimelineColumn isLast={isLast} />
      <div className={cn("min-w-0 flex-1 px-3 py-2.5 pt-0 space-y-2", isLast ? "pb-2" : "pb-6")}>
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
          {loading ? "Identifying meetings…" : "Referenced meetings"}
        </p>
        <ChainOfThoughtSearchResults>
          {meetings.map(m => (
            <MeetingPill key={m.id} id={m.id} title={m.title} date={m.date} navigate={navigate} />
          ))}
          {loading && meetings.length === 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground/60">
              <Loader2 className="size-3 animate-spin" />
              Searching knowledge base
            </span>
          )}
        </ChainOfThoughtSearchResults>
      </div>
    </div>
  )
}

const ActiveMeetingIdentifyPreview = ({
  scopedMeeting,
  knownMeetings,
  navigate,
}: {
  scopedMeeting?: { id: string; title: string } | null
  knownMeetings: ReferencedMeeting[]
  navigate: (path: string) => void
}) => (
  <div className="space-y-2">
    <ChainOfThoughtSearchResults>
      {scopedMeeting && (
        <MeetingPill id={scopedMeeting.id} title={scopedMeeting.title} navigate={navigate} />
      )}
      {knownMeetings.map(m => (
        <MeetingPill key={m.id} id={m.id} title={m.title} date={m.date} navigate={navigate} />
      ))}
      {!scopedMeeting && knownMeetings.length === 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/50 bg-muted/20 px-2.5 py-1 text-[11px] text-muted-foreground/60">
          <Loader2 className="size-3 animate-spin shrink-0" />
          Scanning meetings…
        </span>
      )}
    </ChainOfThoughtSearchResults>
  </div>
)

const ToolResultContent = ({ name, content, navigate }: { name: string; content: string; navigate: (path: string) => void }) => {
  if (name === "search_meetings" || name === "search_exact_transcript") {
    const results = parseSearchResults(content)
    if (results.length === 0) return <p className="text-xs text-muted-foreground italic">{content}</p>
    const uniqueMeetings = [...new Map(results.map(r => [r.meetingId, r])).values()]

    return (
      <div className="space-y-3 mt-1">
        <div>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5">Referenced Meetings</p>
          <ChainOfThoughtSearchResults>
            {uniqueMeetings.map(r => (
              <MeetingPill key={r.meetingId} title={r.meeting} date={r.date} id={r.meetingId} navigate={navigate} />
            ))}
          </ChainOfThoughtSearchResults>
        </div>

        <div className="relative max-h-44 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
          <div className="overflow-y-auto space-y-1.5 pr-1 pb-8 scrollbar-thin">
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-border/30 bg-muted/20 px-3 py-2 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  {r.type && (
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider ${chunkTypeColor[r.type] ?? "bg-muted/30 text-muted-foreground border-border/30"}`}>
                      {r.type.replace(/_/g, " ")}
                    </span>
                  )}
                  <span className="text-muted-foreground/50 text-[10px] font-mono">{r.meeting}</span>
                </div>
                <p className="text-foreground/75 leading-relaxed line-clamp-2">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (name === "fetch_transcript_context" || name === "speaker_activity_summary" || name === "trace_reference_context") {
    const lines = parseTranscriptLines(content)
    if (lines.length === 0) return <p className="text-xs text-muted-foreground font-mono">{content}</p>
    return (
      <div className="mt-1 relative max-h-44 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
        <div className="overflow-y-auto space-y-1 pr-1 pb-8 scrollbar-thin">
          {lines.map((line, i) => (
            <div key={i} className={`flex gap-2 text-xs px-2 py-1 rounded-md transition-colors ${line.isTarget ? "bg-primary/10 border border-primary/20" : ""}`}>
              {line.id && <span className="text-muted-foreground/40 font-mono shrink-0 text-[10px] mt-px">[{line.id}]</span>}
              {line.speaker && <span className="font-semibold text-foreground/70 shrink-0 min-w-[60px]">{line.speaker}</span>}
              <span className={line.isTarget ? "text-foreground" : "text-muted-foreground/70"}>{line.text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (name === "get_related_meetings") {
    const related = parseRelatedMeetings(content)
    if (related.length === 0) return <p className="text-xs text-muted-foreground italic">No related meetings found.</p>
    return (
      <div className="mt-1 space-y-3">
        <ChainOfThoughtSearchResults>
          {related.map(r => (
            <MeetingPill key={r.id} title={r.title} date={r.date} id={r.id} navigate={navigate} />
          ))}
        </ChainOfThoughtSearchResults>
        <div className="relative max-h-36 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
          <div className="overflow-y-auto space-y-2 pb-8 scrollbar-thin">
            {related.map((r, i) => (
              <div key={i} className="rounded-lg border border-border/30 bg-muted/20 px-3 py-2 space-y-1">
                {r.reason && <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{r.reason}</p>}
                {r.score && (
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded-full px-1.5">
                    {(parseFloat(r.score) * 100).toFixed(0)}% match
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (name === "get_meetings_by_tag") {
    const lines = content.split("\n").filter(l => l.startsWith("- Meeting:"))
    const tag = content.match(/tag '(.+?)'/)?.[1]
    return (
      <div className="mt-1 space-y-2">
        {tag && (
          <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] text-primary font-medium">
            #{tag}
          </span>
        )}
        <div className="flex flex-wrap gap-1.5">
          {lines.map((l, i) => {
            const title = l.match(/Meeting: (.+?) \(/)?.[1] ?? "Meeting"
            const id = l.match(/ID: ([a-f0-9-]+)/)?.[1] ?? ""
            const date = l.match(/Date: (.+?)$/)?.[1] ?? ""
            return <MeetingPill key={i} title={title} date={date} id={id} navigate={navigate} />
          })}
        </div>
      </div>
    )
  }

  if (name === "generate_timeline") {
    const events = parseTimeline(content)
    if (events.length === 0) return <p className="text-xs text-muted-foreground font-mono">{content}</p>
    return (
      <div className="mt-1 relative max-h-48 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
        <div className="overflow-y-auto space-y-2 pr-1 pb-8 scrollbar-thin">
          {events.map((e, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary/60 mt-0.5 shrink-0" />
                {i < events.length - 1 && <div className="w-px flex-1 bg-border/40 mt-1" />}
              </div>
              <div className="pb-3 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground/60">{e.date.slice(0, 10)}</span>
                  {e.type && <span className="text-[9px] uppercase tracking-wider text-primary/60 bg-primary/10 px-1.5 rounded">{e.type}</span>}
                  <span className="text-[10px] text-muted-foreground/50 truncate max-w-[120px]">{e.meeting}</span>
                </div>
                <p className="text-xs text-foreground/75 leading-relaxed">{e.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (name === "list_action_items_by_person") {
    const items = parseActionItems(content)
    if (items.length === 0) return <p className="text-xs text-muted-foreground italic">{content}</p>
    return (
      <div className="mt-1 relative max-h-44 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
        <div className="overflow-y-auto space-y-1.5 pr-1 pb-8 scrollbar-thin">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-border/30 bg-muted/20 px-3 py-2 space-y-1">
              <p className="text-xs text-foreground/85 leading-relaxed">{item.action}</p>
              <div className="flex gap-3 text-[10px] text-muted-foreground/60">
                {item.meeting && <span className="truncate max-w-[160px]">📋 {item.meeting}</span>}
                {item.deadline && item.deadline !== "None" && <span>⏰ {item.deadline}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (name === "get_meeting_summary") {
    return (
      <div className="mt-1 relative max-h-40 overflow-hidden rounded-xl border border-border/50 bg-muted/20 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
        <div className="p-3 overflow-y-auto prose prose-invert prose-sm pb-8">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    )
  }

  if (name === "get_meeting_topics" || name === "get_meeting_insights_and_risks") {
    try {
      const data = typeof content === "string" ? JSON.parse(content) : content
      return (
        <div className="mt-1 relative max-h-44 overflow-hidden rounded-xl border border-border/40 bg-muted/10 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
          <div className="p-3 overflow-y-auto pb-8">
            <JsonNestedList data={data} />
          </div>
        </div>
      )
    } catch { }
  }

  if (name === "get_meeting_metadata") {
    const fields = content.split("\n").filter(Boolean)
    return (
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        {fields.map((f, i) => {
          const [key, ...rest] = f.split(":")
          const val = rest.join(":").trim()
          if (!val) return null
          return (
            <div key={i} className="rounded-lg bg-muted/20 border border-border/30 px-2.5 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-semibold">{key.trim()}</p>
              <p className="text-xs text-foreground/80 mt-0.5 truncate">{val}</p>
            </div>
          )
        })}
      </div>
    )
  }

  if (name === "resolve_conflicting_information") {
    return (
      <div className="mt-1 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{content.replace("Conflict Resolution:\n", "")}</p>
      </div>
    )
  }

  if (name === "fetch_document_reference") {
    const doc = content.match(/Document: (.+)/)?.[1] ?? ""
    const locator = content.match(/Page\/Slide: (.+)/)?.[1] ?? ""
    const title = content.match(/Title: (.+)/)?.[1] ?? ""
    const text = content.match(/Content: ([\s\S]+)/)?.[1] ?? content
    return (
      <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {doc && <span className="text-[11px] font-medium text-amber-300">{doc}</span>}
          {locator && <span className="text-[10px] text-muted-foreground/60 font-mono">p.{locator}</span>}
        </div>
        {title && <p className="text-[11px] font-semibold text-foreground/80">{title}</p>}
        <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-3">{text}</p>
      </div>
    )
  }

  return (
    <div className="mt-1 relative max-h-32 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
      <p className="text-muted-foreground/80 font-mono text-[10px] whitespace-pre-wrap">{content}</p>
    </div>
  )
}

function getChainStatusLabel(msg: ChatMessage): string {
  const pendingName = msg.awaitingToolResult
    ? (msg.toolCalls?.[0]?.name ?? msg.toolCalls?.[0]?.function?.name)
    : undefined;

  if (pendingName) {
    const cfg = TOOL_CONFIG[pendingName];
    return cfg?.label ? `Calling ${cfg.label}…` : "Calling tool…";
  }

  const lastTool = msg.toolResults?.[msg.toolResults.length - 1];
  if (lastTool && msg.isStreaming) {
    const cfg = TOOL_CONFIG[lastTool.name];
    if (cfg?.label) return `Reviewing ${cfg.label} results…`;
  }

  if (msg.isStreaming && (msg.toolResults?.length ?? 0) > 0) {
    return "Planning next step…";
  }

  if (msg.isStreaming) {
    return "Thinking…";
  }

  const planMatch = msg.content?.match(/<plan>([\s\S]*?)(?:<\/plan>|$)/);
  if (planMatch?.[1]?.trim()) {
    const plan = planMatch[1].trim().replace(/\s+/g, " ");
    return plan.length > 72 ? `${plan.slice(0, 69)}…` : plan;
  }

  const thoughtMatch = msg.content?.match(/<thought>([\s\S]*?)(?:<\/thought>|$)/);
  if (thoughtMatch?.[1]?.trim()) {
    const thought = thoughtMatch[1].trim().replace(/\s+/g, " ");
    return thought.length > 72 ? `${thought.slice(0, 69)}…` : thought;
  }

  return "Thinking…";
}

function formatElapsedMs(ms: number): string {
  const secs = Math.max(0, ms) / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem < 0.05 ? `${mins}m` : `${mins}m ${rem.toFixed(1)}s`;
}

function parseTimeTakenSeconds(timeTaken?: string): number {
  if (!timeTaken) return 0;
  const match = timeTaken.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function getCompletedChainHeaderLabel(msg: ChatMessage, statusLabel: string): string {
  const totalMs =
    msg.startTime && msg.endTime ? msg.endTime - msg.startTime : undefined;
  if (totalMs === undefined) {
    return statusLabel !== "Thinking…" ? statusLabel.replace(/…$/, "") : "Completed";
  }

  const duration = formatElapsedMs(totalMs);
  const toolCount = msg.toolResults?.length ?? 0;
  const toolMs = (msg.toolResults ?? []).reduce(
    (sum, tr) => sum + parseTimeTakenSeconds(tr.timeTaken) * 1000,
    0,
  );
  const reasoningMs = Math.max(0, totalMs - toolMs);
  const hasPlanSummary = statusLabel !== "Thinking…";
  const summary = hasPlanSummary ? statusLabel.replace(/…$/, "") : undefined;

  const segments: string[] = [];
  if (summary) segments.push(summary);
  else if (toolCount > 0) segments.push(`Processed in ${duration}`);
  else segments.push(`Thought for ${duration}`);

  if (toolCount > 0) {
    if (summary) segments.push(`${duration} total`);
    segments.push(`${toolCount} ${toolCount === 1 ? "tool" : "tools"}`);
    if (toolMs >= 100) segments.push(`${formatElapsedMs(toolMs)} in tools`);
    if (reasoningMs >= 100) segments.push(`${formatElapsedMs(reasoningMs)} reasoning`);
  } else if (summary) {
    segments.push(`${duration} total`);
  }

  return segments.join(" · ");
}

const MessageChainOfThought = ({ msg, navigateFn, scopedMeeting }: { msg: ChatMessage; navigateFn: (path: string) => void; scopedMeeting?: { id: string; title: string } | null }) => {
  const [isChainOpen, setIsChainOpen] = useState(!!msg.isStreaming);
  const [isAgentOpen, setIsAgentOpen] = useState(!msg.toolResults || msg.toolResults.length === 0);
  const [isTaskOpen, setIsTaskOpen] = useState(true);
  const [elapsedLabel, setElapsedLabel] = useState("");

  useEffect(() => {
    if (msg.isStreaming) {
      setIsChainOpen(true);
      return;
    }
    if (msg.endTime) {
      setIsChainOpen(false);
      setIsAgentOpen(false);
      setIsTaskOpen(false);
    }
  }, [msg.isStreaming, msg.endTime]);

  useEffect(() => {
    if (!msg.isStreaming || !msg.startTime) {
      setElapsedLabel("");
      return;
    }
    const tick = () => setElapsedLabel(formatElapsedMs(Date.now() - msg.startTime!));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [msg.isStreaming, msg.startTime]);

  useEffect(() => {
    if (msg.isStreaming && msg.toolResults && msg.toolResults.length > 0) {
      setIsAgentOpen(false);
    }
  }, [msg.isStreaming, msg.toolResults?.length]);

  const planMatch = msg.content?.match(/<plan>([\s\S]*?)(?:<\/plan>|$)/);
  const thoughtMatch = msg.content?.match(/<thought>([\s\S]*?)(?:<\/thought>|$)/);
  const confidenceMatch = msg.content?.match(/<confidence>([\s\S]*?)(?:<\/confidence>|$)/);

  const planText = planMatch ? planMatch[1].trim() : "Synthesizing response";
  const thoughtText = thoughtMatch ? thoughtMatch[1].trim() : "";
  const confidenceText = confidenceMatch ? confidenceMatch[1].trim() : "";
  const hasThought = !!planMatch || !!thoughtMatch;
  const isAllExpanded = isAgentOpen && isTaskOpen;

  const referencedMeetings = collectReferencedMeetings(msg.toolResults, scopedMeeting);
  const pendingName = msg.awaitingToolResult
    ? (msg.toolCalls?.[0]?.name ?? msg.toolCalls?.[0]?.function?.name)
    : undefined;
  const isIdentifyingMeetings = pendingName && MEETING_IDENTIFY_TOOLS.has(pendingName);
  const showTopMeetingsBar =
    referencedMeetings.length > 0 ||
    (msg.awaitingToolResult && isIdentifyingMeetings);
  const hasPendingStep = !!(msg.awaitingToolResult && msg.toolCalls?.[0]);
  const hasTaskBlock = !msg.isStreaming && hasThought;
  const completedStepCount = msg.toolResults?.length ?? 0;

  const chainTail =
    hasTaskBlock ? "task"
    : hasPendingStep ? "pending"
    : completedStepCount > 0 ? `step-${completedStepCount - 1}`
    : showTopMeetingsBar ? "meetings"
    : "agent";

  const handleToggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isChainOpen) { setIsChainOpen(true); setIsAgentOpen(true); setIsTaskOpen(true); }
    else { const s = !isAllExpanded; setIsAgentOpen(s); setIsTaskOpen(s); }
  };

  const statusLabel = getChainStatusLabel(msg);
  const streamingLabel = elapsedLabel ? `${statusLabel} (${elapsedLabel})` : statusLabel;

  return (
    <div className="mb-6 w-full rounded-3xl p-4 shadow-xs">
      <ChainOfThought open={isChainOpen} onOpenChange={setIsChainOpen}>
        <ChainOfThoughtHeader className="w-full pr-2">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="min-w-0 flex-1 font-medium">
              {msg.isStreaming ? (
                <span className="text-foreground">
                  <Shimmer duration={1.5}>{streamingLabel}</Shimmer>
                </span>
              ) : (
                <span className="block text-muted-foreground text-sm leading-snug">
                  {getCompletedChainHeaderLabel(msg, statusLabel)}
                </span>
              )}
            </span>
            <div
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50 cursor-pointer"
              onClick={handleToggleAll}
            >
              {isAllExpanded && isChainOpen ? "Collapse all" : "Expand all"}
            </div>
          </div>
        </ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          {/* Agent Init Card */}
          <div className="flex gap-3 text-sm text-foreground animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <ChainTimelineColumn isFirst isLast={chainTail === "agent"}>
              <div className="size-4 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <BotIcon className="size-2.5 text-primary/80" />
              </div>
            </ChainTimelineColumn>
            <div className={cn("min-w-0 flex-1", chainTail === "agent" ? "pb-2" : "pb-6")}>
              <div className="group/agent relative">
                <div className="rounded-xl px-3 py-2.5 transition-colors group-hover/agent:border-border/70 group-hover/agent:bg-muted/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-foreground/90">Meet-Ink Research Agent</span>
                      <span className="text-[9px] font-mono text-primary/60 bg-primary/10 border border-primary/20 rounded-full px-1.5 py-px shrink-0">ready</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0 group-hover/agent:text-muted-foreground/70 transition-colors">
                      {Object.keys(TOOL_CONFIG).length} tools
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1">
                    Searching your meeting knowledge base.
                  </p>
                </div>
                <div className="absolute left-0 right-0 top-full z-30 pt-1.5 opacity-0 invisible pointer-events-none transition-opacity duration-150 group-hover/agent:opacity-100 group-hover/agent:visible group-hover/agent:pointer-events-auto">
                  <div className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-sm shadow-lg px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2">Available tools</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(TOOL_CONFIG).map(([key, cfg]) => {
                        const Icon = cfg.icon
                        return (
                          <span key={key} className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground/80 whitespace-nowrap">
                            <Icon className={`size-2.5 shrink-0 ${cfg.color}`} />
                            {cfg.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showTopMeetingsBar && (
            <ReferencedMeetingsBar
              meetings={referencedMeetings}
              navigate={navigateFn}
              loading={!!msg.awaitingToolResult && isIdentifyingMeetings}
              isLast={chainTail === "meetings"}
            />
          )}

          {/* One step per completed tool result */}
          {msg.toolResults && msg.toolResults.map((tr: any, idx: number) => {
            const cfg = TOOL_CONFIG[tr.name] ?? { label: "Agent Tool", icon: Zap, color: "text-muted-foreground" }
            const Icon = cfg.icon
            const stepKey = `step-${idx}`

            return (
              <ChainOfThoughtStep
                key={`done-${idx}-${tr.name}`}
                label={cfg.label}
                status="complete"
                timeTaken={tr.timeTaken}
                stepIndex={idx}
                isLast={chainTail === stepKey}
                icon={({ className }: any) => <Icon className={`${className} ${cfg.color}`} />}
              >
                <ToolResultContent
                  name={tr.name}
                  content={tr.content}
                  navigate={navigateFn}
                />
              </ChainOfThoughtStep>
            )
          })}

          {/* In-flight step — expanded with inner content while running */}
          {msg.awaitingToolResult && msg.toolCalls?.[0] && (() => {
            const cfg = TOOL_CONFIG[pendingName!] ?? { label: pendingName ?? "Running tool", icon: Zap, color: "text-muted-foreground" }
            const Icon = cfg.icon
            const pendingIdx = msg.toolResults?.length ?? 0
            const stepLabel = isIdentifyingMeetings
              ? "Identifying referenced meetings"
              : cfg.label
            return (
              <ChainOfThoughtStep
                key={`pending-${pendingIdx}-${pendingName}`}
                label={stepLabel}
                status="active"
                stepIndex={pendingIdx}
                isLast={chainTail === "pending"}
                icon={({ className }: any) => <Icon className={`${className} ${cfg.color}`} />}
              >
                {isIdentifyingMeetings ? (
                  <ActiveMeetingIdentifyPreview
                    scopedMeeting={scopedMeeting}
                    knownMeetings={referencedMeetings}
                    navigate={navigateFn}
                  />
                ) : null}
              </ChainOfThoughtStep>
            )
          })()}

          {hasTaskBlock && (
            <div className="flex gap-3 text-sm fade-in-0 slide-in-from-top-2 animate-in">
              <ChainTimelineColumn isLast>
                <Sparkles className="size-4 text-primary/70" />
              </ChainTimelineColumn>
              <div className="min-w-0 flex-1 pb-2">
                <Task className="w-full" open={isTaskOpen} onOpenChange={setIsTaskOpen}>
                  <TaskTrigger title={planText} />
                  <TaskContent className="space-y-2">
                    {thoughtText && <TaskItem>{thoughtText}</TaskItem>}
                    {confidenceText && (
                      <TaskItem>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Confidence: {confidenceText}
                        </span>
                      </TaskItem>
                    )}
                  </TaskContent>
                </Task>
              </div>
            </div>
          )}
        </ChainOfThoughtContent>
      </ChainOfThought>
    </div>
  );
};

export function KnowledgeLibraryPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  const [meetingsList, setMeetingsList] = useState<any[]>([])
  const [groups, setGroups] = useState<KnowledgeGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [selectedGlobalMeeting, setSelectedGlobalMeeting] = useState<{ id: string; title: string } | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchMeetings().then(res => setMeetingsList(res)).catch(console.error)
    setGroupsLoading(true)
    fetchGroups().then(res => {
      setGroups(res)
      // Auto-expand first group
      if (res.length > 0) setExpandedGroups(new Set([res[0].id]))
    }).catch(console.error).finally(() => setGroupsLoading(false))
  }, [])

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (!shouldAutoScrollRef.current) return
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" })
  }

  const handleChatScroll = () => {
    const el = chatScrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    shouldAutoScrollRef.current = distFromBottom < 150
  }

  useEffect(() => {
    const isStreaming = messages.some((m) => m.isStreaming)
    scrollToBottom(isStreaming ? "auto" : "smooth")
  }, [messages])

  const allTags = Array.from(new Set(groups.map(g => g.tag))).sort()
  const displayedGroups = selectedTag ? groups.filter(g => g.tag === selectedTag) : groups

  const slashIndex = query.lastIndexOf('/')
  const showPicker = !selectedGlobalMeeting && slashIndex !== -1
  const filterText = showPicker ? query.slice(slashIndex + 1).toLowerCase() : ""
  const filteredPickerMeetings = showPicker ? meetingsList.filter(m => m.title.toLowerCase().includes(filterText)) : []

  const handleSelectMeeting = (m: { id: string; title: string }) => {
    setSelectedGlobalMeeting(m)
    setQuery(query.slice(0, slashIndex))
  }

  const handleSearch = async (searchStr?: string) => {
    const q = searchStr || query
    if (!q.trim() || isLoading) return

    setQuery("")

    shouldAutoScrollRef.current = true

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: q.trim(),
    }

    const agentMessageId = (Date.now() + 1).toString()
    let lastStepTime = Date.now();

    const initialAgentMessage: ChatMessage = {
      id: agentMessageId,
      role: "agent",
      content: "",
      toolResults: [],
      isStreaming: true,
      startTime: lastStepTime,
      scopedMeeting: selectedGlobalMeeting ?? undefined,
    }

    setMessages((prev) => [...prev, userMessage, initialAgentMessage])
    setIsLoading(true)

    try {
      const res = await fetch(`${BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content, meeting_id: selectedGlobalMeeting?.id || null }),
      }).catch(() => null);

      if (!res || !res.ok) throw new Error("Backend not available");

      const reader = res.body?.getReader()
      const decoder = new TextDecoder("utf-8")

      if (reader) {
        let buffer = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data = JSON.parse(line)
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id !== agentMessageId) return msg
                  if (data.type === "tool_result") {
                    const now = Date.now();
                    const timeTaken = ((now - lastStepTime) / 1000).toFixed(1) + "s";
                    lastStepTime = now;
                    return {
                      ...msg,
                      toolResults: [...(msg.toolResults || []), { name: data.name, content: data.content, timeTaken }],
                      awaitingToolResult: false,
                    }
                  } else if (data.type === "ai") {
                    const hasToolCalls = Array.isArray(data.tool_calls) && data.tool_calls.length > 0
                    return {
                      ...msg,
                      content: data.content,
                      toolCalls: data.tool_calls,
                      awaitingToolResult: hasToolCalls,
                    }
                  } else if (data.type === "error") {
                    return { ...msg, content: `Error: ${data.content}` }
                  }
                  return msg
                })
              )
            } catch (e) { console.error("Error parsing NDJSON chunk", e) }
          }
        }
      }

      setMessages((prev) => prev.map((msg) => msg.id === agentMessageId ? { ...msg, isStreaming: false, endTime: Date.now() } : msg));
      setIsLoading(false);

    } catch (error: any) {
      console.error(error)
      setMessages(prev => prev.map(msg => msg.id === agentMessageId ? { ...msg, isStreaming: false, content: "Error connecting to AI.", endTime: Date.now() } : msg));
      setIsLoading(false);
    }
  }

  const SUGGESTED_QUERIES = [
    { icon: TrendingUp,   color: "text-emerald-400", text: "What were the key decisions last week?" },
    { icon: Target,       color: "text-rose-400",    text: "Show me all open action items" },
    { icon: CalendarDays, color: "text-blue-400",    text: "Build a timeline for the product roadmap" },
    { icon: Network,      color: "text-violet-400",  text: "Which meetings discuss database migration?" },
    { icon: Database,     color: "text-amber-400",   text: "Who is responsible for the Q3 launch?" },
    { icon: Zap,          color: "text-pink-400",    text: "What are the biggest risks right now?" },
  ]

  const isEmpty = messages.length === 0
  const isAgentRunning = isLoading || messages.some((m) => m.isStreaming)

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">

      {/* ── CHAT THREAD (only when messages exist) ── */}
      <AnimatePresence>
        {!isEmpty && (
          <motion.div
            key="chat"
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto w-full relative scrollbar-none"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 4%, black 96%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 4%, black 96%, black 100%)'
            }}
          >
            <div
              className={cn(
                "max-w-3xl mx-auto space-y-6 pt-10 relative z-10 px-6 transition-[padding] duration-300",
                isAgentRunning ? "pb-[max(22rem,42vh)]" : "pb-40",
              )}
            >
              {messages.map((msg) => {
                const getEffectiveMeetingId = () => {
                  if (msg.scopedMeeting?.id) return msg.scopedMeeting.id;
                  if (!msg.toolResults) return undefined;
                  const searchResults = msg.toolResults.filter(tr => tr.name === "search_meetings" || tr.name === "search_exact_transcript");
                  const ids = new Set<string>();
                  searchResults.forEach(tr => {
                    const results = parseSearchResults(tr.content);
                    results.forEach(r => { if (r.meetingId) ids.add(r.meetingId); });
                  });
                  if (ids.size > 0) return Array.from(ids)[0];
                  return undefined;
                };
                const effectiveMeetingId = getEffectiveMeetingId();

                return (
                <div key={msg.id} className={`flex gap-4 w-full py-6 border-b border-border/30 last:border-0 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="shrink-0 pt-1">
                    {msg.role === "user" ? (
                      <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-secondary-foreground shadow-sm">S</div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className={`min-w-0 flex-1 text-foreground leading-relaxed ${msg.role === "user" ? "text-right max-w-[85%]" : "text-left w-full"}`}>
                    {msg.role === "agent" && (msg.isStreaming || (msg.toolResults && msg.toolResults.length > 0)) && (
                      <MessageChainOfThought msg={msg} navigateFn={navigate} scopedMeeting={msg.scopedMeeting} />
                    )}
                    <div className="text-foreground/90 text-base leading-relaxed">
                      {msg.role === "user" ? (
                        <div className="inline-block bg-muted/60 rounded-2xl px-4 py-2.5 text-sm text-foreground/90 max-w-prose text-left">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-foreground/90">{renderWithCitations(children, effectiveMeetingId)}</p>,
                              li: ({ children }) => <li className="mb-1 text-foreground/80">{renderWithCitations(children, effectiveMeetingId)}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{renderWithCitations(children, effectiveMeetingId)}</strong>,
                              em: ({ children }) => <em className="italic">{renderWithCitations(children, effectiveMeetingId)}</em>,
                              h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-4">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-3">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
                              table: ({ children }) => <div className="overflow-x-auto mb-4"><table className="min-w-full divide-y divide-border/30">{children}</table></div>,
                              th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">{children}</th>,
                              td: ({ children }) => <td className="px-3 py-2 text-sm border-t border-border/20">{children}</td>,
                              a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">{children}</a>,
                            }}
                          >
                            {msg.content?.replace(/<plan>[\s\S]*?<\/plan>/g, '').replace(/<thought>[\s\S]*?<\/thought>/g, '').replace(/<confidence>[\s\S]*?<\/confidence>/g, '').trim()}
                          </ReactMarkdown>
                          {/* References Block at the bottom */}
                          {(() => {
                            if (msg.role !== "agent" || !msg.content) return null;
                            const matches = msg.content.match(CITATION_REGEX);
                            if (!matches) return null;
                            const uniqueTags = [...new Set(matches.map(m => m.slice(1, -1)))];
                            
                            if (uniqueTags.length === 0) return null;
                            return (
                              <div className="mt-8 pt-5 border-t border-border/20">
                                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-3 font-semibold">References & Citations</p>
                                <div className="flex flex-wrap gap-2">
                                  {uniqueTags.map(tag => (
                                    <CitationTooltip key={tag} tag={tag} defaultMeetingId={effectiveMeetingId} showFullLabel />
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          {msg.isStreaming && (
                            <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-sm ml-1 animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                    {/* Action buttons for agent messages */}
                    {msg.role === "agent" && !msg.isStreaming && msg.content && (
                      <div className="flex items-center gap-1 mt-3 opacity-0 hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Copy response">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
              <div
                ref={messagesEndRef}
                aria-hidden
                className={cn("shrink-0 transition-[height] duration-300", isAgentRunning ? "h-32" : "h-0")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EMPTY STATE: hero + groups + suggestions (disappears after first message) ── */}
      <AnimatePresence>
        {isEmpty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
            className="flex-1 overflow-y-auto scrollbar-none"
          >
            {/* Hero */}
            <div className="text-card-foreground flex flex-col items-center justify-center gap-4 relative overflow-hidden w-full pt-16 pb-8 px-6">
              <div className="absolute inset-0 pointer-events-none">
                <div className="rounded-[50%] absolute right-[-10%] top-[-30%] w-[80%] h-full bg-sky-500/8 blur-[120px]" />
                <div className="rounded-[50%] absolute left-[-10%] bottom-[-20%] w-[60%] h-full bg-primary/5 blur-[100px]" />
              </div>
              <div className="relative z-10 flex items-center gap-2 bg-muted/40 border border-border/50 rounded-full px-4 py-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Meet-Ink Agentic RAG</span>
              </div>
              <h1 className="relative z-10 text-3xl md:text-4xl font-medium tracking-tight text-foreground text-center">
                What would you like to know?
              </h1>
              <p className="relative z-10 text-sm text-muted-foreground text-center max-w-md">
                Search across all your meetings, transcripts and documents with AI-powered insight.
              </p>
            </div>

            <div className="max-w-3xl mx-auto px-6 pb-10 space-y-8">

              {/* Suggested queries */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-3">Suggested Queries</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUERIES.map((q, i) => {
                    const Icon = q.icon
                    return (
                      <button
                        key={i}
                        onClick={() => handleSearch(q.text)}
                        className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-border/60 px-3.5 py-2.5 text-left transition-all group"
                      >
                        <Icon className={`size-4 shrink-0 ${q.color}`} />
                        <span className="text-sm text-foreground/75 group-hover:text-foreground transition-colors">{q.text}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Knowledge Graph Groups */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Knowledge Graph</p>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">{groups.length} groups · {meetingsList.length} meetings</span>
                </div>
                {/* Tag filters */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${selectedTag === null ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  >All</button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize transition-all ${selectedTag === tag ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >{tag}</button>
                  ))}
                </div>
                {/* Groups */}
                {groupsLoading ? (
                  <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                    <span className="text-sm">Loading knowledge graph...</span>
                  </div>
                ) : displayedGroups.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    <Database className="w-8 h-8 text-muted-foreground/20" />
                    <p className="text-sm">No groups yet. Process meetings to build the graph.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/40 bg-muted/10 divide-y divide-border/20 overflow-hidden">
                    {displayedGroups.map(group => {
                      const isOpen = expandedGroups.has(group.id)
                      return (
                        <div key={group.id}>
                          <button
                            onClick={() => toggleGroup(group.id)}
                            className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-foreground truncate">{group.group_title}</h3>
                                  <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    {group.progress_gist}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/50">{group.meeting_count} meeting{group.meeting_count !== 1 ? 's' : ''}</span>
                                  <span className="text-[10px] capitalize font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded-full border border-primary/10">{group.tag}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 bg-muted/10">
                                  {group.group_description && (
                                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 pt-2 border-t border-border/20">{group.group_description}</p>
                                  )}
                                  <Timeline className="ml-1">
                                    {group.meetings.map((meeting, idx) => {
                                      const isLast = idx === group.meetings.length - 1
                                      const dateStr = meeting.recorded_at
                                        ? new Date(meeting.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                        : ''
                                      return (
                                        <TimelineItem key={meeting.id} className="group-data-[orientation=vertical]/timeline:ms-6">
                                          {!isLast && <TimelineSeparator className="bg-primary/20" />}
                                          <TimelineHeader className="gap-2">
                                            <TimelineIndicator className="w-5 h-5 border-primary/30 bg-background shadow-sm">
                                              <div className="w-2 h-2 rounded-full bg-primary" />
                                            </TimelineIndicator>
                                            <div className="flex-1 min-w-0">
                                              <button onClick={() => navigate(`/app/meeting-detail?meetingId=${meeting.id}`)} className="text-left group/link w-full">
                                                <TimelineTitle className="text-[12px] font-medium text-foreground group-hover/link:text-primary transition-colors line-clamp-2 leading-snug flex items-start gap-1">
                                                  {meeting.title}
                                                  <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover/link:opacity-60 transition-opacity" />
                                                </TimelineTitle>
                                              </button>
                                              <TimelineDate className="text-[10px] mt-0.5 flex items-center gap-2">
                                                <CalendarDays className="w-3 h-3" />{dateStr}
                                              </TimelineDate>
                                              {meeting.tags && meeting.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                  {meeting.tags.slice(0, 3).map(t => (
                                                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize border border-border/40">{t}</span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </TimelineHeader>
                                          <TimelineContent />
                                        </TimelineItem>
                                      )
                                    })}
                                  </Timeline>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING SEARCH BAR ── */}
      <div className={`transition-all duration-500 ease-in-out z-40 w-full max-w-2xl flex flex-col gap-2 p-4 rounded-3xl mx-auto ${isEmpty ? "relative mb-6" : "absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/95 border border-border/50 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]"}`}>
        {showPicker && (
          <div className="absolute bottom-full left-4 mb-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-b border-slate-700">Select a meeting</div>
            <div className="max-h-48 overflow-y-auto">
              {filteredPickerMeetings.length === 0 ? (
                <div className="px-3 py-4 text-sm text-center text-slate-500">No meetings found.</div>
              ) : (
                filteredPickerMeetings.map(m => (
                  <button key={m.id} type="button" onClick={() => handleSelectMeeting(m)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0 truncate">
                    {m.title}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        <div className={`flex items-center gap-2 w-full rounded-2xl border border-border/50 bg-background/50 backdrop-blur-md px-4 ${isEmpty ? "shadow-xl" : ""}`}>
          {selectedGlobalMeeting && (
            <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30 whitespace-nowrap max-w-[150px] shrink-0">
              <span className="truncate">{selectedGlobalMeeting.title}</span>
              <button type="button" onClick={() => setSelectedGlobalMeeting(null)} className="rounded-full p-0.5 hover:bg-fuchsia-500/50 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={selectedGlobalMeeting ? "Search within this meeting..." : "Ask questions, or use / to scope to a specific meeting..."}
            className="w-full bg-transparent border-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/70 px-2 shadow-none h-12 outline-none text-foreground"
          />
          <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
            <button className="hover:text-foreground transition-colors" title="Voice Input"><Mic className="w-4 h-4" /></button>
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !query}
              className="w-8 h-8 rounded-lg bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center disabled:opacity-50 disabled:hover:bg-muted disabled:hover:text-muted-foreground text-foreground shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

const formatTime = formatCitationTime;

const renderTextWithCitations = (text: string, defaultMeetingId?: string) => {
  const parts = text.split(CITATION_REGEX);
  return (
    <span className="group inline leading-relaxed transition-colors">
      {parts.map((part, j) => {
        if (isCitationBracket(part)) {
          const cleanTag = part.slice(1, -1);
          return <CitationTooltip key={j} tag={cleanTag} defaultMeetingId={defaultMeetingId} />;
        }
        return (
          <span key={j} className="transition-colors duration-300 group-hover:bg-primary/20 dark:group-hover:bg-primary/25 rounded-sm">
            {part}
          </span>
        );
      })}
    </span>
  );
};

const renderWithCitations = (children: any, defaultMeetingId?: string): any => {
  if (typeof children === 'string') {
    return renderTextWithCitations(children, defaultMeetingId);
  }
  if (Array.isArray(children)) {
    return children.map((child, idx) => (
      <Fragment key={idx}>{renderWithCitations(child, defaultMeetingId)}</Fragment>
    ));
  }
  return children;
};

function CitationTooltip({ tag, defaultMeetingId, showFullLabel = false }: { tag: string; defaultMeetingId?: string; showFullLabel?: boolean }) {
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const parsed = parseCitationTag(tag, defaultMeetingId);
  let meetingId = parsed.meetingId;
  const entityId = parsed.entityId;
  const timeHintSeconds = parsed.timeHintSeconds;

  let type = "utterance";
  let displayLabel = tag;
  if (/^\d+$/.test(entityId)) {
    type = "utterance";
    displayLabel = timeHintSeconds !== undefined
      ? formatCitationTime(timeHintSeconds)
      : "Speaker";
  } else if (entityId.startsWith("doc-")) {
    type = "doc";
    displayLabel = "Doc";
  } else if (entityId.startsWith("km-")) {
    type = "key_moment";
    displayLabel = "Key Moment";
  } else if (entityId.startsWith("act-")) {
    type = "action_item";
    displayLabel = "Action";
  } else if (entityId.startsWith("tp-")) {
    type = "topic";
    displayLabel = "Topic";
  } else if (entityId.startsWith("ii-")) {
    type = "insight";
    displayLabel = "Insight";
  } else if (entityId === "sum") {
    type = "summary";
    displayLabel = "Summary";
  } else {
    displayLabel = "Ref";
  }

  const handleMouseEnter = async () => {
    if (!meeting && meetingId && meetingId !== "dummy-meeting") {
      setLoading(true);
      try {
        const data = await fetchMeetingDetail(meetingId);
        setMeeting(data);
      } catch (err) {
        console.error("Failed to fetch meeting for citation", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getSource = () => {
    if (!meeting) return null;

    const sources = lookupCitationSources(entityId, meeting);
    if (sources.length === 0) return null;

    const primary = sources[0];
    if (primary.speaker && primary.text) {
      return { speaker: primary.speaker, text: primary.text, time: primary.time };
    }
    if (primary.time === "Doc Ref") {
      return { text: primary.fallbackText, time: primary.fallbackTitle || "Document" };
    }
    return {
      text: primary.fallbackText || primary.text || `Reference ${entityId}`,
      time: primary.fallbackTitle || meeting.title || "Meeting",
    };
  };

  const source = getSource();

  return (
    <Tooltip>
      <TooltipTrigger
        onMouseEnter={handleMouseEnter}
        className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs mx-1 cursor-pointer transition-all transform select-none ${type === "doc" ? 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent hover:border-border/60' : 'bg-primary/5 text-primary hover:bg-primary/25 border border-transparent hover:border-primary/50'}`}
      >
        {type === "doc" ? <FileText className="w-3 h-3 text-blue-500 shrink-0" /> : <SparkleIcon className="w-3 h-3 text-primary shrink-0" />}
        {showFullLabel ? `[${tag}] ${displayLabel}` : `[${tag}]`}
      </TooltipTrigger>
      <TooltipContent hideArrow={true} side="bottom" className="cursor-pointer bg-background/0 dark:bg-red-200/0 relative max-w-md p-6 text-xs text-foreground rounded-3xl z-50 space-y-3 animate-in fade-in-0 zoom-in-95 duration-200 ">
        <div className="bg-[#dfe9fb]/90 dark:bg-[#22222a]/90 blur-lg inset-0 absolute bg-lg"></div>
        <div className="bg-background/0 dark:bg-[#22222a]/0 backdrop-blur-2xl rounded-4xl inset-8 absolute bg-lg"></div>

        <div className=" overflow-y-auto pr-1 z-10 scrollbar-none relative">
          {loading ? (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading context...</span>
            </div>
          ) : source ? (
            <div className="w-full">
              <div
                className="group p-3 rounded-2xl hover:my-3 duration-400 transition-all hover:bg-muted/30 border border-transparent hover:border-border/40"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {source.speaker && (
                  <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground gap-3">
                    <span className="text-foreground dark:font-thin font-light text-sm mb-1">{source.speaker}</span>
                  </div>
                )}
                {type === "doc" ? (
                  <div className="mt-2 p-3 bg-muted/40 rounded-xl border border-border/50 max-h-[150px] overflow-y-auto scrollbar-thin">
                    <p className="text-foreground/80 font-mono text-xs whitespace-pre-wrap">{source.text}</p>
                  </div>
                ) : (
                  <p className="text-foreground font-regular leading-relaxed text-sm">{type === "utterance" ? `"${source.text}"` : source.text}</p>
                )}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "1.75rem", opacity: 1, marginTop: "0.25rem" }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between overflow-hidden"
                    >
                      {source.time && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs font-light text-primary"
                        >
                          {source.time}
                        </motion.span>
                      )}
                      <motion.span
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        transition={{ duration: 0.2 }}
                        className="inline-block ml-auto bg-accent px-2.5 py-1 rounded-2xl border border-border text-foreground text-xs font-medium text-right cursor-pointer hover:bg-accent/80 shadow-xs"
                      >
                        Go to Source →
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground italic text-xs bg-muted/40 backdrop-blur-md p-3 rounded-xl border border-border/50">Context not found.</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
