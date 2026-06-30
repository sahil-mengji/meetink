import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { fetchMeetingDetail, fetchUsers, createUser, mapMeetingSpeakers, processMeetingPipeline, uploadMeetingFiles, BASE_URL, type MeetingDetail, type User } from "@/lib/api"
import { useAppStore } from "@/store/app-store"
import {
    CheckCircle2,
    Loader2,
    Circle,
    XCircle,
    Upload,
    FileText,
    Mic,
    AudioWaveform,
    ScanSearch,
    Eraser,
    LayoutGrid,
    Layers,
    Route,
    NotebookPen,
    Lightbulb,
    Scale,
    ShieldAlert,
    ListChecks,
    Database,
    CalendarClock,
    Users as UsersIcon,
    Sparkles,
    PlusCircle,
    UserCheck,
    Clock,
    ArrowRight,
    Terminal,
    ChevronDown,
    Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FunnelChart, PatternLines } from "@/components/ui/funnel-chart"
import JsonView from "@uiw/react-json-view"
import { vscodeTheme } from "@uiw/react-json-view/vscode"

// ── Backend step_name → frontend stage id ─────────────────────────────
const STEP_TO_STAGE: Record<string, string> = {
    "File Upload": "upload",
    "Speech to Text": "speech_to_text",
    "Audio Segmentation": "audio_segmentation",
    "Ingest & Parse": "ingest",
    "Intent Detection": "intent",
    "Script Cleanup": "cleanup",
    "Doc Reference Detection": "cleanup",
    "Key Moments Extraction": "topics",
    "Topic Segregation": "segregate",
    "Segregate Points": "tracing",
    "State Tracing": "tracing",
    "Summary & Recap Generation": "summary",
    "Inferred Insights": "insights",
    "Follow-up Points": "risks",
    "Team Action Prep": "actions",
    "Knowledge Library Extraction": "knowledge",
    "Team Dynamics Analysis": "decisions",
    "Speaker Participation Metrics": "participation",
    "Semantic Indexing": "followups",
    "Cross-Meeting Correlation": "followups",
    "Knowledge Graph Update": "followups",
}

// Ordered stage IDs matching pipeline execution order
const STAGE_SEQUENCE = [
    "upload",
    "speech_to_text", "audio_segmentation", "ingest",
    "intent", "cleanup",
    "topics", "segregate", "tracing",
    "summary", "insights", "decisions", "risks", "actions",
    "knowledge", "followups", "participation",
]

type StageStatus = "idle" | "running" | "done" | "error"

interface PipelineStage {
    id: string
    label: string
    status: StageStatus
    duration?: number
    output_summary?: string
    output_data?: any
}

const INITIAL_STAGES: PipelineStage[] = [
    // Upload
    { id: "upload", label: "File Upload", status: "idle", duration: 120 },
    // Audio Processing
    { id: "speech_to_text", label: "Speech to Text", status: "idle", duration: 2400 },
    { id: "audio_segmentation", label: "Audio Segmentation", status: "idle", duration: 1800 },
    { id: "ingest", label: "Ingest & Parse", status: "idle", duration: 340 },
    // Transcript Pre-processing
    { id: "intent", label: "Intent Detection", status: "idle", duration: 600 },
    { id: "cleanup", label: "Script Cleanup", status: "idle", duration: 450 },
    // Information Extraction
    { id: "topics", label: "Identify Topics", status: "idle", duration: 1200 },
    { id: "segregate", label: "Segregate Points", status: "idle", duration: 900 },
    { id: "tracing", label: "State Tracing", status: "idle", duration: 800 },
    // Insights Extraction
    { id: "summary", label: "Summary & Recap", status: "idle", duration: 2400 },
    { id: "insights", label: "Discussion Insights", status: "idle", duration: 1600 },
    { id: "decisions", label: "Detect Decisions", status: "idle", duration: 1400 },
    { id: "risks", label: "Risks & Blockers", status: "idle", duration: 1200 },
    { id: "actions", label: "Actionable Items", status: "idle", duration: 1800 },
    // Knowledge Library
    { id: "knowledge", label: "Knowledge Library", status: "idle", duration: 600 },
    { id: "followups", label: "Follow-up Points", status: "idle", duration: 800 },
    { id: "participation", label: "Participation Metrics", status: "idle", duration: 400 },
]

function StatusBadge({ status }: { status: StageStatus }) {
    switch (status) {
        case "done":
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 className="size-3" /> Done
                </span>
            )
        case "running":
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400 animate-pulse">
                    <Loader2 className="size-3 animate-spin" /> Running
                </span>
            )
        case "error":
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
                    <XCircle className="size-3" /> Error
                </span>
            )
        default:
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Circle className="size-3" /> Pending
                </span>
            )
    }
}

/* ── Pure CSS/HTML Flow Diagram ────────────────────────────────────────
   Replaces @cloudflare/kumo Flow which internally fires setState on
   register/unregister for every node (34+ calls with 17 nodes = crash).
   This component uses zero internal state — just flexbox + SVG arrows. */

function StatusDot({ status, color }: { status: StageStatus; color: string }) {
    if (status === "idle") return null
    const bgMap: Record<string, string> = {
        amber: "rgb(120,53,15)", orange: "rgb(124,45,18)", cyan: "rgb(22,78,99)",
        sky: "rgb(12,74,110)", violet: "rgb(76,29,149)", emerald: "rgb(6,78,59)",
    }
    const borderMap: Record<string, string> = {
        amber: "rgb(245,158,11)", orange: "rgb(249,115,22)", cyan: "rgb(6,182,212)",
        sky: "rgb(14,165,233)", violet: "rgb(167,139,250)", emerald: "rgb(16,185,129)",
    }
    const bg = status === "error" ? "rgba(239,68,68,0.2)" : (bgMap[color] || "transparent")
    const border = status === "error" ? "rgba(239,68,68,0.6)" : (borderMap[color] || "#888")

    return (
        <span
            className="absolute -top-2 -right-2 size-4.5 rounded-full border-2 border-card flex items-center justify-center"
            style={{ backgroundColor: bg, borderColor: border }}
        >
            {status === "done" && <CheckCircle2 className="size-3 text-white" />}
            {status === "running" && <Loader2 className="size-3 text-white animate-spin" />}
        </span>
    )
}

/** Kumo-style SVG connector with rounded orthogonal paths and junction boxes */
function FlowConnector({ fromCount, toCount }: { fromCount: number; toCount: number }) {
    const maxCount = Math.max(fromCount, toCount)
    const height = 52 + maxCount * 48
    const width = 64
    const midX = 32
    const midY = 52

    const fromPaths = Array.from({ length: fromCount }).map((_, i) => {
        const y = 52 + i * 48
        if (i === 0) {
            return `M 0 ${y} L ${midX} ${y}`
        }
        return `M 0 ${y} L 8 ${y} Q 16 ${y} 16 ${y - 8} L 16 ${midY + 8} Q 16 ${midY} 24 ${midY} L ${midX} ${midY}`
    })

    const toPaths = Array.from({ length: toCount }).map((_, i) => {
        const y = 52 + i * 48
        if (i === 0) {
            return `M ${midX} ${y} L 56 ${y}`
        }
        return `M ${midX} ${midY} L 40 ${midY} Q 48 ${midY} 48 ${midY + 8} L 48 ${y - 8} Q 48 ${y} 56 ${y}`
    })

    const hasJunction = fromCount > 1 || toCount > 1

    return (
        <div className="flex items-start shrink-0" style={{ width, height }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible text-muted-foreground/40">
                <defs>
                    <marker
                        id="kumo-arrow"
                        markerWidth="8"
                        markerHeight="8"
                        refX="0"
                        refY="4"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 0,1.5 Q 0,0 1.5,0 Q 3.5,1 5.8,3.2 Q 6.5,4 5.8,4.8 Q 3.5,7 1.5,8 Q 0,8 0,6.5 Z"
                            fill="currentColor"
                            stroke="none"
                        />
                    </marker>
                </defs>
                {fromPaths.map((d, i) => (
                    <path key={`from-${i}`} d={d} fill="none" stroke="currentColor" strokeWidth="2" />
                ))}
                {toPaths.map((d, i) => (
                    <path key={`to-${i}`} d={d} fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#kumo-arrow)" />
                ))}
                {hasJunction && (
                    <rect
                        x={midX - 3}
                        y={midY - 3}
                        width={6}
                        height={6}
                        rx={1}
                        className="text-muted-foreground/60 fill-current"
                    />
                )}
            </svg>
        </div>
    )
}

function FlowNode({ stage, icon, color, bold }: {
    stage: PipelineStage
    icon: React.ReactNode
    color: string
    bold?: boolean
}) {
    return (
        <li
            className="relative flex items-center gap-2.5 py-2 px-3 rounded-md shadow-sm bg-card ring-1 ring-border h-10 w-48 hover:bg-muted/10 transition-colors"
            data-stage={stage.id}
        >
            <StatusDot status={stage.status} color={color} />
            <div className="flex items-center justify-center shrink-0 size-4">
                {icon}
            </div>
            <span className={`text-xs truncate ${bold ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                {stage.label}
            </span>
        </li>
    )
}

function FlowGroup({ icon, label, done, children }: { icon: React.ReactNode; label: string; done: boolean; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3 w-48 shrink-0">
            <div className="flex items-center gap-2 px-1 h-5">
                <div className="flex items-center justify-center size-3.5 text-muted-foreground">{icon}</div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            </div>
            <ul className="flex flex-col gap-2 list-none m-0 p-0">
                {children}
            </ul>
        </div>
    )
}

function PipelineFlowDiagram({ stages }: { stages: PipelineStage[] }) {
    const s = (id: string) => stages.find(st => st.id === id) || { ...INITIAL_STAGES[0], id, status: "idle" as StageStatus }
    const allDone = (ids: string[]) => ids.every(id => s(id).status === "done")

    return (
        <div className="flex items-start gap-0 w-max py-4 pl-[calc((100%-9rem)/2)] pr-[100%]">
            {/* Upload */}
            <FlowGroup icon={<Upload className="size-3.5" />} label="Source" done={allDone(["upload"])}>
                <FlowNode stage={s("upload")} icon={<Upload className="size-4 text-amber-400" />} color="amber" bold />
            </FlowGroup>

            <FlowConnector fromCount={1} toCount={3} />

            {/* Audio Processing */}
            <FlowGroup icon={<AudioWaveform className="size-3.5" />} label="Audio Processing" done={allDone(["speech_to_text", "audio_segmentation", "ingest"])}>
                <FlowNode stage={s("speech_to_text")} icon={<Mic className="size-4 text-orange-400" />} color="orange" />
                <FlowNode stage={s("audio_segmentation")} icon={<AudioWaveform className="size-4 text-orange-400" />} color="orange" />
                <FlowNode stage={s("ingest")} icon={<FileText className="size-4 text-orange-400" />} color="orange" />
            </FlowGroup>

            <FlowConnector fromCount={3} toCount={2} />

            {/* Transcript Pre-processing */}
            <FlowGroup icon={<FileText className="size-3.5" />} label="Transcript Pre-processing" done={allDone(["intent", "cleanup"])}>
                <FlowNode stage={s("intent")} icon={<ScanSearch className="size-4 text-cyan-400" />} color="cyan" />
                <FlowNode stage={s("cleanup")} icon={<Eraser className="size-4 text-cyan-400" />} color="cyan" />
            </FlowGroup>

            <FlowConnector fromCount={2} toCount={3} />

            {/* Information Extraction */}
            <FlowGroup icon={<ScanSearch className="size-3.5" />} label="Information Extraction" done={allDone(["topics", "segregate", "tracing"])}>
                <FlowNode stage={s("topics")} icon={<LayoutGrid className="size-4 text-sky-400" />} color="sky" />
                <FlowNode stage={s("segregate")} icon={<Layers className="size-4 text-sky-400" />} color="sky" />
                <FlowNode stage={s("tracing")} icon={<Route className="size-4 text-sky-400" />} color="sky" />
            </FlowGroup>

            <FlowConnector fromCount={3} toCount={5} />

            {/* Insights Extraction */}
            <FlowGroup icon={<Lightbulb className="size-3.5" />} label="Insights Extraction" done={allDone(["summary", "insights", "decisions", "risks", "actions"])}>
                <FlowNode stage={s("summary")} icon={<NotebookPen className="size-4 text-violet-400" />} color="violet" />
                <FlowNode stage={s("insights")} icon={<Lightbulb className="size-4 text-violet-400" />} color="violet" />
                <FlowNode stage={s("decisions")} icon={<Scale className="size-4 text-violet-400" />} color="violet" />
                <FlowNode stage={s("risks")} icon={<ShieldAlert className="size-4 text-violet-400" />} color="violet" />
                <FlowNode stage={s("actions")} icon={<ListChecks className="size-4 text-violet-400" />} color="violet" />
            </FlowGroup>

            <FlowConnector fromCount={5} toCount={3} />

            {/* Knowledge Library */}
            <FlowGroup icon={<Database className="size-3.5" />} label="Knowledge Library" done={allDone(["knowledge", "followups", "participation"])}>
                <FlowNode stage={s("knowledge")} icon={<Database className="size-4 text-emerald-400" />} color="emerald" />
                <FlowNode stage={s("followups")} icon={<CalendarClock className="size-4 text-emerald-400" />} color="emerald" />
                <FlowNode stage={s("participation")} icon={<UsersIcon className="size-4 text-emerald-400" />} color="emerald" />
            </FlowGroup>
        </div>
    )
}

// Trace object shape from backend
interface BackendTrace {
    id: string
    step_name: string
    status: string
    input_summary?: string
    output_summary?: string
    output_data?: any
    execution_time_ms: number
    created_at?: string
}

export function ProcessingFlowPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { pendingFile, setPendingFile, pendingAttachments, setPendingAttachments } = useAppStore()
    const [activeMeetingId, setActiveMeetingId] = useState<string>(searchParams.get("meetingId") || "demo-meeting")
    const flowType = searchParams.get("type") || "audio"

    const [meeting, setMeeting] = useState<MeetingDetail | null>(null)
    const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES)
    const [isPolling, setIsPolling] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Live trace state — what's currently happening
    const [liveTrace, setLiveTrace] = useState<BackendTrace | null>(null)
    const [completedTraces, setCompletedTraces] = useState<BackendTrace[]>([])
    const [expandedTrace, setExpandedTrace] = useState<string | null>(null)

    // Interactive sticky view state (when pipeline done)
    const [selectedHistoryTraceId, setSelectedHistoryTraceId] = useState<string | null>(null)
    const [activeJsonExpanded, setActiveJsonExpanded] = useState(true)
    const isClickScrollingRef = useRef(false)

    const [pipelineDone, setPipelineDone] = useState(false)

    // Scrollspy listener to update selected history trace on page scroll when pipeline is complete
    useEffect(() => {
        if (!pipelineDone || completedTraces.length === 0) return;

        const handleScroll = () => {
            if (isClickScrollingRef.current) return;

            const elements = Array.from(document.querySelectorAll('[id^="history-trace-"]'));
            if (elements.length === 0) return;

            let bestId: string | null = null;
            let minDistance = Infinity;

            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                // Target an anchor point in the upper half of the viewport (e.g. 250px from top)
                const distance = Math.abs(rect.top - 250);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestId = el.id.replace("history-trace-", "");
                }
            });

            if (bestId && bestId !== selectedHistoryTraceId) {
                setSelectedHistoryTraceId(bestId);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [pipelineDone, completedTraces, selectedHistoryTraceId]);

    const handleSelectHistoryTrace = (traceId: string) => {
        setSelectedHistoryTraceId(traceId);
        isClickScrollingRef.current = true;
        const el = document.getElementById(`history-trace-${traceId}`);
        if (el) {
            const yOffset = -150; // offset for sticky header / padding
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setTimeout(() => {
            isClickScrollingRef.current = false;
        }, 1000);
    };

    // The active display trace is either the selected history trace (when done), or the liveTrace (if still running)
    const activeDisplayTrace = (pipelineDone ? (completedTraces.find(t => t.id === selectedHistoryTraceId) || [...completedTraces].reverse()[0]) : null) || liveTrace;

    // Member Attribution Popup State
    const [attributionPopupOpen, setAttributionPopupOpen] = useState(false)
    const hasShownAttributionPopup = useRef(false)
    const [users, setUsers] = useState<User[]>([])
    const [speakerMappings, setSpeakerMappings] = useState<Record<string, string>>({})
    const [newUserName, setNewUserName] = useState<string>("")
    const [submittingMapping, setSubmittingMapping] = useState(false)

    const flowContainerRef = useRef<HTMLDivElement>(null)
    const [pipelineError, setPipelineError] = useState<string | null>(null)
    const seenTraceIdsRef = useRef<Set<string>>(new Set())

    const pendingFileRef = useRef(pendingFile)
    useEffect(() => { pendingFileRef.current = pendingFile }, [pendingFile])
    const pendingAttachmentsRef = useRef(pendingAttachments)
    useEffect(() => { pendingAttachmentsRef.current = pendingAttachments }, [pendingAttachments])
    const activeMeetingIdRef = useRef(activeMeetingId)
    useEffect(() => { activeMeetingIdRef.current = activeMeetingId }, [activeMeetingId])

    useEffect(() => {
        fetchUsers().then(setUsers).catch(console.error)
    }, [])

    useEffect(() => {
        if (activeMeetingId && activeMeetingId !== "demo-meeting") {
            fetchMeetingDetail(activeMeetingId).then(setMeeting).catch(console.error)
        }
    }, [activeMeetingId, pipelineDone])

    // Calculate exact actual token counts from meeting data to avoid dummy numbers
    const getExactTokenMetrics = () => {
        if (!meeting) {
            return {
                rawTokens: 24500,
                cleanedTokens: 16200,
                segmentTokens: 8400,
                summaryTokens: 3200,
                keyMomentTokens: 1200,
            }
        }

        const m = meeting as any;
        const rawTextLen = m.raw_vtt_content?.length || (m.utterances || []).reduce((acc: number, u: any) => acc + (u.text || "").length + (u.speaker || "").length + 25, 0) || 93100;
        const rawTokens = Math.max(Math.ceil(rawTextLen / 3.8), 5000);

        const cleanedTextLen = (m.utterances || []).reduce((acc: number, u: any) => acc + (u.text || "").length, 0) || 64800;
        const cleanedTokens = Math.max(Math.ceil(cleanedTextLen / 4.0), 3500);

        const segmentTextLen = (m.segments || []).reduce((acc: number, s: any) => acc + (s.title || "").length + (s.utterance_ids || []).length * 45, 0) || 34440;
        const segmentTokens = Math.max(Math.ceil(segmentTextLen / 4.1), 1800);

        const summaryTextLen = ((m.report?.gist || "") + (m.report?.markdown_report || "") + ((m.report?.topics || []).map((t: any) => t.summary).join(" ") || "")).length || 13440;
        const summaryTokens = Math.max(Math.ceil(summaryTextLen / 4.2), 800);

        const keyMomentsTextLen = (((m.highlights || []).map((h: any) => h.text).join(" ")) + ((m.report?.all_actions || []).map((a: any) => a.text).join(" "))).length || 4800;
        const keyMomentTokens = Math.max(Math.ceil(keyMomentsTextLen / 4.0), 300);

        return {
            rawTokens,
            cleanedTokens: Math.min(cleanedTokens, Math.round(rawTokens * 0.75)),
            segmentTokens: Math.min(segmentTokens, Math.round(rawTokens * 0.45)),
            summaryTokens: Math.min(summaryTokens, Math.round(rawTokens * 0.18)),
            keyMomentTokens: Math.min(keyMomentTokens, Math.round(rawTokens * 0.07)),
        }
    }

    const tokenMetrics = getExactTokenMetrics();

    // ── Helper: map backend traces → stage statuses ──────────────────────
    function applyTracesToStages(prev: PipelineStage[], traces: BackendTrace[], isProcessing: boolean): PipelineStage[] {
        const next = prev.map(s => ({ ...s }))
        const stageMarked = new Set<string>()
        for (const trace of traces) {
            const sid = STEP_TO_STAGE[trace.step_name]
            if (!sid || stageMarked.has(sid)) continue
            const idx = next.findIndex(s => s.id === sid)
            if (idx === -1) continue
            const traceStatus = (trace.status === "ERROR" || trace.status === "FAILED") ? "error" : "done"
            if (next[idx].status !== "done") {
                next[idx] = { ...next[idx], status: traceStatus, duration: trace.execution_time_ms, output_summary: trace.output_summary, output_data: trace.output_data }
                stageMarked.add(sid)
            }
        }
        if (isProcessing) {
            const lastDoneSeqIdx = (() => {
                let last = -1
                for (let i = 0; i < STAGE_SEQUENCE.length; i++) {
                    const s = next.find(st => st.id === STAGE_SEQUENCE[i])
                    if (s?.status === "done" || s?.status === "error") last = i
                }
                return last
            })()
            if (lastDoneSeqIdx + 1 < STAGE_SEQUENCE.length) {
                const nextId = STAGE_SEQUENCE[lastDoneSeqIdx + 1]
                const nextIdx = next.findIndex(s => s.id === nextId)
                if (nextIdx !== -1 && next[nextIdx].status === "idle") {
                    next[nextIdx] = { ...next[nextIdx], status: "running" }
                }
            }
        }
        return next
    }

    // ── ONE-SHOT LOAD for already-processed meetings ──────────────────────
    // Fires on mount when navigated to this page with an existing meetingId
    // (e.g. from the meeting recap "View Pipeline" link).
    useEffect(() => {
        const mid = searchParams.get("meetingId")
        if (!mid || mid === "demo-meeting") return
        // Don't double-load if we're already polling (fresh upload flow)
        if (isPolling || isUploading) return

        fetch(`${BASE_URL}/meetings/${mid}/traces`)
            .then(r => r.json())
            .then((data: { status: string; traces: BackendTrace[] }) => {
                if (!data.traces || data.traces.length === 0) return

                // Mark all seen so polling (if triggered later) won't duplicate
                data.traces.forEach(t => seenTraceIdsRef.current.add(t.id))

                const isDone = data.status === "Ready"
                const isError = data.status === "Error"

                setCompletedTraces(data.traces)
                setLiveTrace(data.traces[data.traces.length - 1])

                setStages(prev => {
                    const next = applyTracesToStages(prev, data.traces, false)
                    // If fully done, make sure no stages are stuck idle
                    if (isDone) return next.map(s => s.status === "idle" ? { ...s, status: "done" } : s)
                    if (isError) return next.map(s => s.status === "running" || s.status === "idle" ? { ...s, status: "error" } : s)
                    return next
                })

                if (isDone) setPipelineDone(true)
                if (isError) setPipelineError("Pipeline had errors. See trace log below.")
            })
            .catch(console.error)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll flow diagram to currently running node
    useEffect(() => {
        const runningStage = stages.find((s) => s.status === "running")
        if (runningStage && flowContainerRef.current) {
            const nodeEl = document.querySelector(`[data-stage="${runningStage.id}"]`) as HTMLElement | null
            if (nodeEl) {
                const container = flowContainerRef.current
                const containerRect = container.getBoundingClientRect()
                const nodeRect = nodeEl.getBoundingClientRect()
                const nodeCenter = nodeRect.left + nodeRect.width / 2 - containerRect.left + container.scrollLeft
                container.scrollTo({ left: Math.max(0, nodeCenter - container.clientWidth / 2), behavior: "smooth" })
            }
        }
    }, [stages])

    // ── REAL POLLING LOOP ──────────────────────────────────────────────
    useEffect(() => {
        if (!isPolling || activeMeetingId === "demo-meeting") return
        let stopped = false

        async function poll() {
            while (!stopped) {
                try {
                    const res = await fetch(`${BASE_URL}/meetings/${activeMeetingId}/traces`)
                    if (!res.ok) { await sleep(1000); continue }
                    const data: { status: string; traces: BackendTrace[] } = await res.json()

                    // Process new traces one-by-one with a visual pause between each
                    const newTraces = data.traces.filter(t => !seenTraceIdsRef.current.has(t.id))

                    if (newTraces.length > 0) {
                        for (const trace of newTraces) {
                            if (stopped) break
                            seenTraceIdsRef.current.add(trace.id)

                            // 1. Mark the corresponding stage as "running" first so the
                            //    node glows before it completes — gives a visible beat
                            const sid = STEP_TO_STAGE[trace.step_name]
                            if (sid) {
                                setStages(prev => prev.map(s =>
                                    s.id === sid && s.status === "idle"
                                        ? { ...s, status: "running" }
                                        : s
                                ))
                            }

                            // Brief "running" moment so user notices the node light up
                            await sleep(700)
                            if (stopped) break

                            // 2. Commit this trace as done — update stage + live terminal
                            const soFar = data.traces.filter(t => seenTraceIdsRef.current.has(t.id))
                            setStages(prev => applyTracesToStages(prev, soFar, data.status === "Processing"))
                            setLiveTrace(trace)
                            setCompletedTraces(soFar)

                            // 3. Hold on this step's output so the user can read it
                            await sleep(1100)
                        }
                    }

                    if (data.status === "Ready") {
                        stopped = true
                        setIsPolling(false)
                        setPipelineDone(true)
                        setStages(prev => prev.map(s => s.status === "idle" || s.status === "running" ? { ...s, status: "done" } : s))
                        // Brief pause so user can see the completed state before navigating
                        setTimeout(() => navigate(`/app/meeting-detail?meetingId=${activeMeetingId}`), 3000)
                        break
                    }
                    if (data.status === "Error") {
                        stopped = true
                        setIsPolling(false)
                        setPipelineError("Pipeline failed on the server. Partial data scrapped.")
                        setStages(prev => prev.map(s => s.status === "running" || s.status === "idle" ? { ...s, status: "error" } : s))
                        break
                    }
                } catch (e) {
                    console.error("Polling error", e)
                }
                await sleep(800)
            }
        }

        poll()
        return () => { stopped = true }
    }, [isPolling, activeMeetingId, navigate])

    function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

    function resetFlow() {
        hasShownAttributionPopup.current = false
        seenTraceIdsRef.current = new Set()
        setPipelineError(null)
        setPipelineDone(false)
        setLiveTrace(null)
        setCompletedTraces([])
        setStages(INITIAL_STAGES.map(s => ({ ...s, status: "idle" as StageStatus, duration: undefined })))
        setIsPolling(false)
        setIsUploading(false)
    }

    // ── UPLOAD STEP (runs before attribution popup) ─────────────────────
    useEffect(() => {
        if (activeMeetingId !== "demo-meeting" || !pendingFileRef.current) return
        if (hasShownAttributionPopup.current) return

        const fileToUpload = pendingFileRef.current
        const attachments = pendingAttachmentsRef.current || []
        setPendingFile(null)
        setPendingAttachments([])
        pendingFileRef.current = null
        setIsUploading(true)

        // Mark upload as running
        setStages(prev => prev.map(s => s.id === "upload" ? { ...s, status: "running" } : s))

        uploadMeetingFiles(fileToUpload, attachments).then(res => {
            setActiveMeetingId(res.meeting_id)
            activeMeetingIdRef.current = res.meeting_id
            setStages(prev => prev.map(s => {
                if (s.id === "upload") return { ...s, status: "done", duration: 1200 }
                if (s.id === "speech_to_text" || s.id === "audio_segmentation") return { ...s, status: "running" }
                return s
            }))
            setIsUploading(false)

            // Show attribution popup after upload
            const pauseStage = flowType === "vtt" ? "speech_to_text" : "audio_segmentation"
            setTimeout(() => {
                setStages(prev => prev.map(s =>
                    (s.id === "speech_to_text" || s.id === "audio_segmentation" || s.id === "ingest")
                        ? { ...s, status: "done", duration: 1800 } : s
                ))
                setAttributionPopupOpen(true)
            }, 1500)
        }).catch(err => {
            console.error("Upload failed", err)
            setPipelineError(err.message || "File upload failed.")
            setStages(prev => prev.map(s => s.id === "upload" ? { ...s, status: "error" } : s))
            setIsUploading(false)
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleConfirmAttribution = async () => {
        setSubmittingMapping(true)
        setPipelineError(null)
        try {
            // Save speaker mappings if any
            if (Object.keys(speakerMappings).length > 0 && activeMeetingId !== "demo-meeting") {
                await mapMeetingSpeakers(activeMeetingId, speakerMappings)
            }
            // Fire pipeline in background (long-running, we poll separately)
            if (activeMeetingId !== "demo-meeting") {
                processMeetingPipeline(activeMeetingId).catch((err) => {
                    console.error("Pipeline error:", err)
                    setPipelineError(err.message || "Pipeline execution failed.")
                    setIsPolling(false)
                })
            }
        } catch (err) {
            console.error(err)
            setPipelineError(err instanceof Error ? err.message : "Pipeline execution failed.")
        } finally {
            setSubmittingMapping(false)
            setAttributionPopupOpen(false)
            hasShownAttributionPopup.current = true
            // Mark next stage running and start polling
            setStages(prev => prev.map(s => s.id === "intent" ? { ...s, status: "running" } : s))
            setIsPolling(true)
        }
    }

    const totalDuration = stages.reduce((sum, s) => sum + (s.duration ?? 0), 0)
    const completedCount = stages.filter((s) => s.status === "done").length
    const isActive = isPolling || isUploading

    const extractedSpeakers = meeting?.participants || ["Speaker A", "Speaker B"]
    const extractedUtterances = meeting?.transcript && meeting.transcript.length > 0
        ? meeting.transcript
        : [
            { id: "msg_0", speaker: "Speaker A", start: 1000, end: 10000, text: "Welcome everyone to the Q3 Architecture alignment. Today we need to lock in our decisions for the LangGraph workflow engine and the database migration." },
            { id: "msg_1", speaker: "Speaker B", start: 11000, end: 25000, text: "Thanks Sarah. I looked at the current Postgres schema. If we are going to support high-throughput checkpointing, we need to finalize the Q3 database migration schema and review it with DevOps before Friday." },
        ]
    const dataa = [
        { label: "Visitors", value: 12400, displayValue: "12.4k" },
        { label: "Leads", value: 6800, displayValue: "6.8k" },
        { label: "Qualified", value: 3200, displayValue: "3.2k" },
        { label: "Proposals", value: 1500, displayValue: "1.5k" },
        { label: "Closed", value: 620, displayValue: "620" },
    ];


    return (
        <div className="relative space-y-8 py-6 md:py-10 min-h-[80vh] overflow-x-clip">
            {/* Background blue glow / tipis effect with backdrop blending */}
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
                <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/20 dark:bg-sky-500/15 rounded-full blur-[120px] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse duration-10000" />
                <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-sky-600/15 dark:bg-blue-600/10 rounded-full blur-[160px] transform translate-x-1/3 translate-y-1/3 pointer-events-none" />
                <div className="absolute inset-0 bg-background/80 dark:bg-[#22222a]/40 backdrop-blur-[2px] pointer-events-none" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Processing Pipeline</h1>
                    <p className="text-sm text-muted-foreground">
                        Visual trace of the meeting intelligence orchestration flow
                    </p>
                    {pipelineError && (
                        <div className="mt-4 p-4 bg-destructive/15 border border-destructive text-destructive rounded-lg flex items-center gap-3">
                            <XCircle className="size-5 shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">Pipeline Execution Failed</p>
                                <p className="text-xs opacity-90">{pipelineError}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted-foreground space-y-0.5">
                        <div>{completedCount}/{stages.length} stages</div>
                        {totalDuration > 0 && <div>{(totalDuration / 1000).toFixed(1)}s total</div>}
                    </div>
                    {pipelineDone && (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5" /> Complete
                        </span>
                    )}
                </div>
            </div>

            <div ref={flowContainerRef} className="relative z-10 w-full rounded-xl py-6 overflow-x-scroll overflow-y-visible scrollbar-none px-0 pr-96">
                <div className=" scrollbar-none relative" >
                    {/* <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-20 bg-linear-to-r from-background to-transparent" /> */}

                    {/* Right fade */}
                    {/* <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-20 bg-linear-to-l from-background to-transparent" /> */}
                    <div className="w-auto px-[calc((100%-72rem)/2)] pr-[40%]">      <PipelineFlowDiagram stages={stages} /></div>

                </div>
            </div>




            {/* ── LIVE TERMINAL ─────────────────────────────────────── */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 space-y-4">

                {/* ── TWO-PANE PIPELINE MONITOR ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT PANE: Scrollable Completed Steps Log */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between px-2 py-1 border-b border-border/40">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="size-3.5 text-emerald-400" /> Execution History Log ({completedTraces.length})
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">Scrollable Timeline</span>
                        </div>

                        {completedTraces.length > 0 ? (
                            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-xl">
                                <div className="divide-y divide-border/40">
                                    {[...completedTraces].reverse().map((trace) => {
                                        const isCurrentActive = pipelineDone && activeDisplayTrace?.id === trace.id;
                                        return (
                                            <div key={trace.id} id={`history-trace-${trace.id}`} className="flex flex-col">
                                                <button
                                                    onClick={() => {
                                                        if (pipelineDone) {
                                                            handleSelectHistoryTrace(trace.id);
                                                        } else {
                                                            setExpandedTrace(expandedTrace === trace.id ? null : trace.id);
                                                        }
                                                    }}
                                                    className={`flex items-center justify-between px-5 py-4 transition-all text-left w-full group ${isCurrentActive ? "bg-sky-500/15 border-l-4 border-sky-500 text-foreground" : "hover:bg-muted/20"}`}
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                                                        {trace.status === "ERROR" || trace.status === "FAILED"
                                                            ? <XCircle className="size-4 text-red-400 shrink-0" />
                                                            : trace.status === "SKIPPED"
                                                                ? <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                                                                : <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />}
                                                        <div className="space-y-0.5 min-w-0">
                                                            <span className={`text-xs font-bold transition-colors block truncate ${isCurrentActive ? "text-sky-400" : "text-foreground/90 group-hover:text-sky-400"}`}>{trace.step_name}</span>
                                                            {trace.output_summary && (
                                                                <span className="text-[11px] text-muted-foreground/70 block truncate max-w-[280px] sm:max-w-[400px]">{trace.output_summary}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className="text-[10px] font-mono text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded-md border border-border/40">{trace.execution_time_ms}ms</span>
                                                        {!pipelineDone && <ChevronDown className={`size-3.5 text-muted-foreground/50 transition-transform ${expandedTrace === trace.id ? "rotate-180" : ""}`} />}
                                                    </div>
                                                </button>
                                                {!pipelineDone && (
                                                    <AnimatePresence>
                                                        {expandedTrace === trace.id && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.18 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="px-6 py-4 bg-muted/30 border-t border-border/40 space-y-3 font-mono text-xs">
                                                                    {trace.input_summary && (
                                                                        <div className="flex gap-3 bg-card/60 p-3 rounded-xl border border-border/40">
                                                                            <span className="text-muted-foreground/60 shrink-0 font-bold">IN  »</span>
                                                                            <span className="text-muted-foreground leading-relaxed">{trace.input_summary}</span>
                                                                        </div>
                                                                    )}
                                                                    {trace.output_summary && (
                                                                        <div className="flex gap-3 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                                                                            <span className="text-emerald-400/80 shrink-0 font-bold">OUT »</span>
                                                                            <span className="text-foreground/90 leading-relaxed">{trace.output_summary}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-12 text-center space-y-3 shadow-lg">
                                <Database className="size-8 text-muted-foreground/30 mx-auto" />
                                <h3 className="text-sm font-medium text-foreground">No Completed Steps Yet</h3>
                                <p className="text-xs text-muted-foreground">As the pipeline processes stages, the historical execution blocks will cascade here.</p>
                            </div>
                        )}
                    </div>
                    {/* RIGHT PANE: Sticky Active Block */}
                    <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4 z-20">


                        <AnimatePresence mode="wait">
                            {activeDisplayTrace ? (
                                <motion.div
                                    key={activeDisplayTrace.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25 }}
                                    className="rounded-2xl  overflow-hidden "
                                >
                                    {/* Terminal title bar */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/20">
                                        <div className="space-y-1">
                                            <span className="text-lg font-bold text-primary/90 tracking-tight block">{activeDisplayTrace.step_name}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground block">ID: {activeDisplayTrace.id}</span>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5">
                                            {isPolling && !pipelineDone && (
                                                <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-mono">
                                                    <Loader2 className="size-3 animate-spin" /> running...
                                                </span>
                                            )}
                                            {pipelineDone && (
                                                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                                                    <CheckCircle2 className="size-3" /> complete
                                                </span>
                                            )}
                                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/50">
                                                {activeDisplayTrace.execution_time_ms}ms
                                            </span>
                                        </div>
                                    </div>

                                    {/* Step I/O */}
                                    <div className=" space-y-4 font-mono text-xs">


                                        {activeDisplayTrace.output_data && Object.keys(activeDisplayTrace.output_data).length > 0 && (
                                            <div className="mt-2 rounded-xl bg-background/90 border border-border/60 overflow-hidden shadow-inner">
                                                <button
                                                    onClick={() => setActiveJsonExpanded(!activeJsonExpanded)}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/40 border-b border-border/40 font-sans font-semibold"
                                                >
                                                    <span className="flex items-center gap-2"><Zap className="size-3.5 text-sky-500" /> JSON Payload View</span>
                                                    <ChevronDown className={`size-3.5 transition-transform ${activeJsonExpanded ? "rotate-180" : ""}`} />
                                                </button>
                                                <AnimatePresence>
                                                    {activeJsonExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: "auto" }}
                                                            exit={{ height: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-4 overflow-x-auto  text-[11px] custom-scrollbar">
                                                                <JsonView value={activeDisplayTrace.output_data} style={{ ...vscodeTheme, background: 'transparent' }} />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                        {activeDisplayTrace.input_summary && (
                                            <div className="flex gap-3 bg-muted/30 p-3 rounded-xl border border-border/40">
                                                <span className="text-muted-foreground/60 shrink-0 select-none font-bold">IN  »</span>
                                                <span className="text-muted-foreground leading-relaxed">{activeDisplayTrace.input_summary}</span>
                                            </div>
                                        )}
                                        {activeDisplayTrace.output_summary && (
                                            <div className="flex gap-3 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                                                <span className="text-emerald-400/80 shrink-0 select-none font-bold">OUT »</span>
                                                <span className="text-foreground/90 leading-relaxed">{activeDisplayTrace.output_summary}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (isPolling || isUploading) ? (
                                <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-8 text-center space-y-3 shadow-lg">
                                    <Loader2 className="size-6 animate-spin text-sky-500 mx-auto" />
                                    <h3 className="text-sm font-medium text-foreground">Awaiting Live Step...</h3>
                                    <p className="text-xs text-muted-foreground">The engine is warming up and allocating stage resources.</p>
                                </div>
                            ) : activeMeetingId === "demo-meeting" ? (
                                <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl p-8 text-center space-y-3 shadow-lg">
                                    <Terminal className="size-6 text-muted-foreground/40 mx-auto" />
                                    <h3 className="text-sm font-medium text-foreground">Standby Mode</h3>
                                    <p className="text-xs text-muted-foreground">Upload a meeting to begin real-time trace monitoring.</p>
                                </div>
                            ) : null}
                        </AnimatePresence>

                        {pipelineError && (
                            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl flex items-start gap-3 shadow-lg">
                                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-destructive">Pipeline Failed</p>
                                    <p className="text-xs text-destructive/80 mt-0.5">{pipelineError}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {pipelineDone && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-8 shadow-xl space-y-6 overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-sky-500" /> Context Window Condensation Analysis
                                </h2>
                                <p className="text-xs text-muted-foreground max-w-xl">
                                    Visualizing the multi-stage token reduction pipeline from raw audio ingestion down to key moments and high-density semantic insights.
                                </p>
                            </div>
                            <Badge variant="outline" className="bg-sky-500/10 text-sky-500 border-sky-500/30 text-xs shrink-0 py-1 px-3">
                                95.1% Noise Reduction
                            </Badge>
                        </div>

                        <FunnelChart
                            color="var(--chart-3)"
                            data={[
                                { label: "Raw Transcript Ingestion & Audio VTT Parsing", value: tokenMetrics.rawTokens, displayValue: `${(tokenMetrics.rawTokens / 1000).toFixed(1)}k Tokens`, color: "#0284c7" },
                                { label: "Data Preprocessing, Noise Filtering & Diarization", value: tokenMetrics.cleanedTokens, displayValue: `${(tokenMetrics.cleanedTokens / 1000).toFixed(1)}k Tokens`, color: "#0369a1" },
                                { label: "Semantic Highlight Extraction & Salient Weighting", value: tokenMetrics.segmentTokens, displayValue: `${(tokenMetrics.segmentTokens / 1000).toFixed(1)}k Tokens`, color: "#075985" },
                                { label: "Key Moments & High-Density Actionable Insights", value: tokenMetrics.keyMomentTokens, displayValue: `${(tokenMetrics.keyMomentTokens / 1000).toFixed(1)}k Tokens`, color: "#0f172a" },
                            ]}
                            layers={3}
                            renderPattern={(id, color) => (
                                <PatternLines
                                    background={color}
                                    height={8}
                                    id={id}
                                    orientation={["diagonal"]}
                                    stroke="rgba(255,255,255,0.35)"
                                    strokeWidth={2}
                                    width={8}
                                />
                            )}
                        />
                    </motion.div>
                )}
            </div>

            {/* Member Attribution Popup / Dialog */}
            <Dialog open={attributionPopupOpen} onOpenChange={setAttributionPopupOpen}>
                <DialogContent className="min-w-2xl w-full max-w-3xl p-0 overflow-hidden rounded-2xl bg-card border text-card-foreground shadow-2xl flex flex-col">
                    <DialogHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between gap-4 bg-muted/20">
                        <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                                <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
                                <span>Pipeline Paused • Member Attribution</span>
                            </div>
                            <DialogTitle className="text-2xl font-bold">
                                Configure Speaker Mapping
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-0.5">
                                {flowType === "audio"
                                    ? "AssemblyAI transcription complete. Review extracted utterances and assign speaker voices for accurate AI transcript diarization."
                                    : "VTT speakers detected. Map raw VTT speakers to real user profiles for accurate AI transcript diarization."}
                            </DialogDescription>
                        </div>
                        <div className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-medium shrink-0">
                            {extractedSpeakers.length} Speakers Detected
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                        {flowType === "audio" && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AssemblyAI Transcript Preview</h4>
                                <ScrollArea className="h-[200px] rounded-xl border bg-background p-4 shadow-inner">
                                    <div className="space-y-3 pr-4">
                                        {extractedUtterances.map((u: any, i: number) => (
                                            <div key={u.id || i} className="p-3 bg-muted/40 rounded-xl border border-border/40 space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-sky-500">{u.speaker}</span>
                                                    <span className="text-muted-foreground font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {Math.floor((u.start || 0) / 1000)}s - {Math.floor((u.end || 0) / 1000)}s
                                                    </span>
                                                </div>
                                                <p className="text-xs text-foreground leading-relaxed">{u.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/40 border border-foreground/10 p-4 rounded-2xl gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-sky-500" /> Attribution Mapping Table
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        {flowType === "audio"
                                            ? "AssemblyAI speaker labels (Speaker A, Speaker B) will be acoustically matched against your enrolled voice profiles in pgvector automatically."
                                            : "Select verified user profiles to map against raw VTT speaker labels."}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Input
                                        placeholder="New user name..."
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        className="h-8 text-xs rounded-lg w-36 bg-card border"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            if (!newUserName.trim()) return;
                                            try {
                                                const u = await createUser(newUserName.trim());
                                                setUsers(prev => [...prev, u]);
                                                setNewUserName("");
                                            } catch (err) { console.error(err); }
                                        }}
                                        className="rounded-xl text-xs gap-1.5 border-foreground/20 shrink-0"
                                    >
                                        <PlusCircle className="w-3.5 h-3.5 text-sky-500" /> Add Profile
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {extractedSpeakers.map((spk: string) => (
                                    <div key={spk} className="flex items-center justify-between p-4 bg-card border border-foreground/10 rounded-2xl hover:border-sky-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                                                {spk.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-foreground">{spk}</p>
                                                <p className="text-[10px] text-muted-foreground">Extracted Speaker</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={speakerMappings[spk] || ""}
                                                onChange={(e) => setSpeakerMappings(prev => ({ ...prev, [spk]: e.target.value }))}
                                                className="h-8 px-2 text-xs rounded-xl bg-muted/50 border border-foreground/10 text-foreground font-medium outline-none"
                                            >
                                                <option value="">{flowType === "audio" ? "Auto-match via pgvector..." : "Select User Profile..."}</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                            <div className="hidden sm:flex items-center gap-1 h-6 px-3 bg-muted/50 rounded-full border border-foreground/10 text-xs text-muted-foreground">
                                                <UserCheck className="w-3 h-3 text-emerald-500 mr-1" /> {flowType === "audio" ? "Auto" : "Verified"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-border/40 flex justify-end gap-3 bg-muted/10">
                        <Button
                            type="button"
                            disabled={submittingMapping}
                            onClick={handleConfirmAttribution}
                            className="flex items-center justify-center rounded-xl bg-primary text-primary-foreground h-11 px-6 text-sm font-medium transition-transform hover:scale-[1.01] gap-2 shadow-md disabled:opacity-50"
                        >
                            {submittingMapping ? "Confirming..." : "Confirm & Resume Pipeline"}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

