import { useState, useCallback, useRef, useMemo, useEffect } from "react"
import { Flow } from "@cloudflare/kumo"
import JsonView from "@uiw/react-json-view"
import { darkTheme } from "@uiw/react-json-view/dark"
import { lightTheme } from "@uiw/react-json-view/light"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
    Play,
    Copy,
    Check,
    RotateCcw,
    FlaskConical,
    Upload,
    Eraser,
    LayoutGrid,
    Layers,
    Route,
    CalendarClock,
    NotebookPen,
    Lightbulb,
    Scale,
    ShieldAlert,
    ListChecks,
    Database,
    Users,
    FileUp,
    Sparkles,
    CheckCircle2,
    BarChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { API_BASE_URL } from "@/lib/env"
import { SpeakerMappingDialog } from "@/components/speaker-mapping-dialog"

import sampleIngestVtt from "@/sample/ingest.vtt?raw"
import samplePreprocess from "@/sample/preprocess.json"
import sampleCleanup from "@/sample/cleanup.json"
import sampleTopics from "@/sample/topics.json"
import sampleHighli from "@/sample/highli.json"
import sampleSegregate from "@/sample/segregate.json"
import sampleTracing from "@/sample/tracing.json"
import sampleSummary from "@/sample/summary.json"
import sampleParticipation from "@/sample/participation.json"

// --------------- Types ---------------

interface StageConfig {
    id: string
    label: string
    description: string
    defaultInputs: { name: string; data: unknown }[]
    endpoint?: string
}

// --------------- Sample Data ---------------

const SAMPLE_RAW_UTTERANCES = [
    { speaker: "Alice", start: 1.0, end: 4.5, text: "Good morning everyone. Let's get started with the sprint sync.", raw_text: "Good morning everyone. Let's get started with the sprint sync." },
    { speaker: "Bob", start: 5.0, end: 9.2, text: "Sure. I finished the auth module yesterday and pushed to staging.", raw_text: "Sure. I finished the auth module yesterday and pushed to staging." },
    { speaker: "Alice", start: 9.5, end: 14.0, text: "Great. Any blockers on the deployment side?", raw_text: "Great. Any blockers on the deployment side?" },
    { speaker: "Carol", start: 14.5, end: 19.0, text: "Yes, the CI pipeline is failing on the integration tests. I need Bob's help to fix the env variables.", raw_text: "Yes, the CI pipeline is failing on the integration tests. I need Bob's help to fix the env variables." },
    { speaker: "Bob", start: 19.5, end: 24.0, text: "I can look at that today. Should be a quick fix.", raw_text: "I can look at that today. Should be a quick fix." },
    { speaker: "Alice", start: 24.5, end: 30.0, text: "Perfect. Let's also discuss the timeline for the Q3 features. We committed to delivering the dashboard by next Tuesday.", raw_text: "Perfect. Let's also discuss the timeline for the Q3 features. We committed to delivering the dashboard by next Tuesday." },
    { speaker: "Carol", start: 30.5, end: 36.0, text: "I think that's tight. The design review hasn't happened yet and we have a dependency on the analytics API.", raw_text: "I think that's tight. The design review hasn't happened yet and we have a dependency on the analytics API." },
    { speaker: "Alice", start: 36.5, end: 41.0, text: "That's a risk. Bob, can you escalate the API dependency to the platform team?", raw_text: "That's a risk. Bob, can you escalate the API dependency to the platform team?" },
    { speaker: "Bob", start: 41.5, end: 45.0, text: "Will do. I'll set up a meeting with them this afternoon.", raw_text: "Will do. I'll set up a meeting with them this afternoon." },
    { speaker: "Alice", start: 45.5, end: 50.0, text: "Good. Let's reconvene on Thursday to check progress. Meeting adjourned.", raw_text: "Good. Let's reconvene on Thursday to check progress. Meeting adjourned." },
]

const SAMPLE_NORMALIZED_UTTERANCES = [
    { id: 0, speaker: "Alice", start: 1.0, end: 4.5, text: "Good morning everyone. Let's get started with the sprint sync.", raw_text: "Good morning everyone. Let's get started with the sprint sync." },
    { id: 1, speaker: "Bob", start: 5.0, end: 9.2, text: "Sure. I finished the auth module yesterday and pushed to staging.", raw_text: "Sure. I finished the auth module yesterday and pushed to staging." },
    { id: 2, speaker: "Alice", start: 9.5, end: 14.0, text: "Great. Any blockers on the deployment side?", raw_text: "Great. Any blockers on the deployment side?" },
    { id: 3, speaker: "Carol", start: 14.5, end: 19.0, text: "Yes, the CI pipeline is failing on the integration tests. I need Bob's help to fix the env variables.", raw_text: "Yes, the CI pipeline is failing on the integration tests. I need Bob's help to fix the env variables." },
    { id: 4, speaker: "Bob", start: 19.5, end: 24.0, text: "I can look at that today. Should be a quick fix.", raw_text: "I can look at that today. Should be a quick fix." },
    { id: 5, speaker: "Alice", start: 24.5, end: 30.0, text: "Perfect. Let's also discuss the timeline for the Q3 features. We committed to delivering the dashboard by next Tuesday.", raw_text: "Perfect. Let's also discuss the timeline for the Q3 features. We committed to delivering the dashboard by next Tuesday." },
    { id: 6, speaker: "Carol", start: 30.5, end: 36.0, text: "I think that's tight. The design review hasn't happened yet and we have a dependency on the analytics API.", raw_text: "I think that's tight. The design review hasn't happened yet and we have a dependency on the analytics API." },
    { id: 7, speaker: "Alice", start: 36.5, end: 41.0, text: "That's a risk. Bob, can you escalate the API dependency to the platform team?", raw_text: "That's a risk. Bob, can you escalate the API dependency to the platform team?" },
    { id: 8, speaker: "Bob", start: 41.5, end: 45.0, text: "Will do. I'll set up a meeting with them this afternoon.", raw_text: "Will do. I'll set up a meeting with them this afternoon." },
    { id: 9, speaker: "Alice", start: 45.5, end: 50.0, text: "Good. Let's reconvene on Thursday to check progress. Meeting adjourned.", raw_text: "Good. Let's reconvene on Thursday to check progress. Meeting adjourned." },
]

const SAMPLE_SEGMENTS = [
    { segment_id: "seg-001", title: "Sprint Status Update", utterance_ids: [0, 1, 2, 3, 4], confidence: 0.92 },
    { segment_id: "seg-002", title: "Q3 Timeline & Dependencies", utterance_ids: [5, 6, 7, 8, 9], confidence: 0.88 },
]

// --------------- Stage Configs (one per node, unique) ---------------

const PIPELINE_STAGES: StageConfig[] = [
    {
        id: "ingest",
        label: "Ingest & Parse",
        description: "Upload .vtt/.txt file and parse into structured RawUtterances",
        endpoint: "/pipeline/ingest",
        defaultInputs: [{ name: "Sprint Sync VTT", data: sampleIngestVtt }],
    },
    {
        id: "preprocess",
        label: "Normalize & Preprocess",
        description: "Clean text, absorb backchannels, normalize and merge consecutive turns",
        endpoint: "/pipeline/normalize",
        defaultInputs: [{ name: "Ingest Output", data: samplePreprocess }],
    },
    {
        id: "key_moments",
        label: "Intent & Key Moments",
        description: "Detect intent and generate short key moments via LLM",
        endpoint: "/pipeline/key-moments",
        defaultInputs: [{ name: "Normalized Utterances", data: sampleCleanup }],
    },
    {
        id: "topics_segregation",
        label: "Topics & Segregation",
        description: "Identify high-level topics and segregate points by key moments",
        endpoint: "/pipeline/topics-segregation",
        defaultInputs: [{ name: "Key Moments", data: sampleHighli }],
    },
    {
        id: "summary_recap_report",
        label: "Summary & Recap Report",
        description: "Generate markdown report from Key Moments and Topics",
        endpoint: "/pipeline/summary-recap",
        defaultInputs: [{ name: "Topics Output", data: sampleTopics }],
    },
    {
        id: "inferred_insights",
        label: "Inferred Insights & Follow-ups",
        description: "Generate external meta-insights, risks, and logical follow-ups based on the Summary & Recap Report",
        endpoint: "/pipeline/inferred-insights",
        defaultInputs: [
            {
                name: "From Summary Recap",
                data: {
                    markdown_report: "# Executive Summary\n\nAlice stated that the team is working hard [km-10].\n\n## Timeline of Discussion\n- **10:00 AM**: Meeting started.\n- **10:15 AM**: Carol discussed dependencies.\n\n## Decisions\n| Decision | Owner |\n|---|---|\n| Delay dashboard | Bob |\n\n## Key Highlights\n- Carol explicitly raised concerns about the timeline [km-6].\n",
                    action_items: [
                        {
                            task: "Escalate API dependency to platform team",
                            owner: "Bob",
                            assigned_by: "Alice",
                            date: "2026-06-21",
                            time: "10:20 AM",
                            deadline: "2026-06-22"
                        }
                    ]
                }
            }
        ]
    },
    {
        id: "team_analysis",
        label: "Team Dynamics Analysis",
        description: "Analyze team collaboration, decision drivers, and sentiment",
        endpoint: "/pipeline/team-analysis",
        defaultInputs: [
            {
                name: "From Summary Recap",
                data: {
                    markdown_report: "# Executive Summary\n\nAlice stated that the team is working hard [km-10].\n\n## Timeline of Discussion\n- **10:00 AM**: Meeting started.\n",
                    metadata_in: { title: "Q3 Planning", participants: ["Alice", "Bob", "Carol"] }
                }
            }
        ]
    },
    {
        id: "team_prep",
        label: "Team Action Prep",
        description: "Structure action items into grouped team assignments and announcements",
        endpoint: "/pipeline/team-prep",
        defaultInputs: [
            {
                name: "From Insights & Summary",
                data: {
                    action_items: [{ task: "Fix API", owner: "Bob" }],
                    inferred_insights: { discussion_insights: [], risks_and_blockers: [], follow_up_points: [] }
                }
            }
        ]
    },
    {
        id: "knowledge",
        label: "Knowledge Library Update",
        description: "Extract permanent, long-term facts for the Knowledge Base",
        endpoint: "/pipeline/knowledge",
        defaultInputs: [
            {
                name: "From Insights & Summary",
                data: {
                    markdown_report: "...",
                    action_items: [],
                    inferred_insights: { discussion_insights: [], risks_and_blockers: [], follow_up_points: [] }
                }
            }
        ]
    },
    {
        id: "participation",
        label: "Participation Metrics",
        description: "Calculate speaker time, turn counts, interaction patterns",
        endpoint: "/pipeline/participation",
        defaultInputs: [{ name: "Normalized Utterances", data: sampleParticipation }],
    },
]

// Flow node definitions
const FLOW_NODES = [
    { id: "ingest", label: "Ingest & Parse", icon: FileUp, color: "bg-amber-500/10", iconColor: "text-amber-400" },
    { id: "preprocess", label: "Normalize & Preprocess", icon: Sparkles, color: "bg-amber-500/10", iconColor: "text-amber-400" },
    { id: "key_moments", label: "Intent & Key Moments", icon: Eraser, color: "bg-cyan-500/10", iconColor: "text-cyan-400" },
    { id: "topics_segregation", label: "Topics & Segregation", icon: Layers, color: "bg-sky-500/10", iconColor: "text-sky-400" },
    { id: "summary_recap_report", label: "Summary & Recap Report", icon: NotebookPen, color: "bg-sky-500/10", iconColor: "text-sky-400" },
    { id: "inferred_insights", label: "Inferred Insights & Risks", icon: Sparkles, color: "bg-purple-500/10", iconColor: "text-purple-400" },
    { id: "team_analysis", label: "Team Dynamics", icon: Users, color: "bg-pink-500/10", iconColor: "text-pink-400" },
    { id: "team_prep", label: "Team Action Prep", icon: CheckCircle2, color: "bg-emerald-500/10", iconColor: "text-emerald-400" },
    { id: "knowledge", label: "Knowledge Extract", icon: Database, color: "bg-amber-500/10", iconColor: "text-amber-400" },
    { id: "participation", label: "Participation Stats", icon: BarChart, color: "bg-indigo-500/10", iconColor: "text-indigo-400" },
]

function PipelineFlowDiagram({ activeNodeId, onNodeClick }: { activeNodeId: string | null; onNodeClick: (id: string) => void }) {
    return (
        <Flow align="center" canvas={false} className="text-muted-foreground/40">
            {FLOW_NODES.map((node) => {
                const Icon = node.icon
                const isActive = node.id === activeNodeId
                return (
                    <Flow.Node
                        key={node.id}
                        render={
                            <li
                                className={`flex items-center gap-2.5 rounded-lg ${node.color} px-4 py-2.5 shadow-sm cursor-pointer transition-all whitespace-nowrap ${isActive ? "ring-2 ring-primary scale-105" : "ring-1 ring-border/40 hover:ring-2 hover:ring-primary/50"}`}
                                onClick={() => onNodeClick(node.id)}
                            >
                                <Icon className={`size-4 shrink-0 ${node.iconColor}`} />
                                <span className="text-xs font-medium text-foreground/70">{node.label}</span>
                            </li>
                        }
                    />
                )
            })}
        </Flow>
    )
}

// --------------- Editor & Viewer ---------------

function JsonEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [error, setError] = useState<string | null>(null)
    const [isViewMode, setIsViewMode] = useState(true)
    const { theme } = useTheme()

    const parsedValue = useMemo(() => {
        if (!value.trim()) return null
        try {
            const parsed = JSON.parse(value)
            setError(null)
            return parsed
        } catch (e) {
            if (!value.trim().startsWith("WEBVTT")) {
                setError((e as Error).message)
            } else {
                setError(null)
            }
            return null
        }
    }, [value])

    const handleChange = (v: string) => {
        onChange(v)
    }

    return (
        <div className="flex flex-col h-full relative">
            <div className="absolute top-2 right-2 z-10 flex gap-1">
                <Button 
                    variant={isViewMode ? "default" : "outline"} 
                    size="sm" 
                    className="h-6 text-[10px] px-2 shadow-sm"
                    onClick={() => setIsViewMode(true)}
                    disabled={parsedValue === null}
                >
                    View
                </Button>
                <Button 
                    variant={!isViewMode ? "default" : "outline"} 
                    size="sm" 
                    className="h-6 text-[10px] px-2 shadow-sm"
                    onClick={() => setIsViewMode(false)}
                >
                    Edit
                </Button>
            </div>
            
            {isViewMode && parsedValue ? (
                <div className="flex-1 w-full rounded-lg border border-border bg-muted/30 overflow-auto p-2">
                    <JsonView
                        value={parsedValue}
                        style={(theme === "dark" ? darkTheme : lightTheme) as React.CSSProperties}
                        displayDataTypes={false}
                        displayObjectSize={true}
                        enableClipboard={false}
                        collapsed={2}
                    />
                </div>
            ) : (
                <textarea
                    className="flex-1 w-full rounded-lg border border-border bg-muted/30 p-3 pt-10 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    spellCheck={false}
                    placeholder="Paste JSON or select a preset..."
                />
            )}
            {error && !isViewMode && <p className="mt-1 text-[10px] text-destructive shrink-0">{error}</p>}
        </div>
    )
}

function OutputPanel({ data, loading, error, elapsedTime, estimatedTime }: { data: unknown | null; loading: boolean; error: string | null; elapsedTime?: number; estimatedTime?: number }) {
    const [copied, setCopied] = useState(false)
    const [viewMode, setViewMode] = useState<"json" | "markdown">("markdown")
    const { theme } = useTheme()

    const hasMarkdown = !!data && typeof data === "object" && "markdown_report" in data

    const handleCopy = async () => {
        const text = data ? JSON.stringify(data, null, 2) : ""
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-6">
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                    <div className="flex items-center gap-3 text-primary">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span className="text-sm font-medium">Processing Model...</span>
                    </div>
                    
                    {estimatedTime !== undefined && elapsedTime !== undefined && (
                        <div className="w-full space-y-2 mt-2">
                            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                                <span>{elapsedTime}s elapsed</span>
                                <span>~{estimatedTime}s est.</span>
                            </div>
                            <div className="h-1.5 w-full bg-border overflow-hidden rounded-full">
                                <div 
                                    className="h-full bg-primary transition-all duration-1000 ease-linear relative"
                                    style={{ width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-[9px] text-center text-muted-foreground/50 uppercase tracking-wider mt-2">
                                ETA based on context window size
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 rounded-lg border border-destructive/50 bg-destructive/5 p-4 overflow-auto">
                <p className="text-xs text-destructive font-medium mb-2">Error</p>
                <p className="text-[11px] text-destructive/80 font-mono">{error}</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                <p className="text-xs text-muted-foreground">Output will appear here after running</p>
            </div>
        )
    }

    const renderMarkdown = () => {
        if (!hasMarkdown) return null
        const report = (data as any).markdown_report as string
        let refCount = 1
        const idMap: Record<string, number> = {}
        const processedReport = report.replace(/\[(km-\d+)\]/g, (match, id) => {
            if (!idMap[id]) idMap[id] = refCount++
            return `[${idMap[id]}](cite:${id})`
        })

        return (
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 pb-8">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        a: ({ node, ...props }) => {
                            if (props.href?.startsWith("cite:")) {
                                const citeId = props.href.slice(5)
                                return (
                                    <sup className="inline-flex cursor-pointer select-none items-center rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-bold mx-0.5 hover:bg-primary hover:text-primary-foreground transition-colors" title={`Source: ${citeId}`}>
                                        {props.children}
                                    </sup>
                                )
                            }
                            return <a {...props} className="text-primary hover:underline font-medium" />
                        },
                        table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-4 border rounded-lg border-border">
                                <table className="w-full text-sm text-left m-0" {...props} />
                            </div>
                        ),
                        th: ({node, ...props}) => <th className="bg-muted px-4 py-2 font-semibold border-b border-border" {...props} />,
                        td: ({node, ...props}) => <td className="px-4 py-2 border-b border-border/50" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 border-b border-border pb-1" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="leading-7 mb-4 text-sm" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1 text-sm" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-sm" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/50 pl-4 py-1 italic bg-primary/5 my-4 rounded-r-md text-sm text-muted-foreground" {...props} />,
                    }}
                >
                    {processedReport}
                </ReactMarkdown>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 relative rounded-lg border border-border bg-muted/30 overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50 shrink-0">
                <div className="flex gap-1">
                    {hasMarkdown && (
                        <>
                            <Button 
                                variant={viewMode === "markdown" ? "default" : "outline"} 
                                size="sm" 
                                className="h-6 text-[10px] px-2" 
                                onClick={() => setViewMode("markdown")}
                            >
                                Rendered README
                            </Button>
                            <Button 
                                variant={viewMode === "json" ? "default" : "outline"} 
                                size="sm" 
                                className="h-6 text-[10px] px-2" 
                                onClick={() => setViewMode("json")}
                            >
                                Raw JSON
                            </Button>
                        </>
                    )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
            </div>
            
            <div className="flex-1 overflow-auto">
                {viewMode === "markdown" && hasMarkdown ? (
                    renderMarkdown()
                ) : (
                    <div className="p-2 h-full">
                        <JsonView
                            value={data as object}
                            style={(theme === "dark" ? darkTheme : lightTheme) as React.CSSProperties}
                            displayDataTypes={false}
                            displayObjectSize={true}
                            enableClipboard={false}
                            collapsed={2}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

// --------------- Testing Pane ---------------

function TestingPane({ stage }: { stage: StageConfig }) {
    const CACHE_KEY = `pipeline_cache_${stage.id}`
    const [inputValue, setInputValue] = useState("")
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [output, setOutput] = useState<unknown | null>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            return cached ? JSON.parse(cached) : null
        } catch {
            return null
        }
    })

    useEffect(() => {
        if (output) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(output))
        } else {
            localStorage.removeItem(CACHE_KEY)
        }
    }, [output, CACHE_KEY])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPreset, setSelectedPreset] = useState<string>("")
    const [elapsedTime, setElapsedTime] = useState(0)
    const [estimatedTime, setEstimatedTime] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isFileUploadStage = stage.id === "ingest"

    const loadPreset = (presetName: string) => {
        const preset = stage.defaultInputs.find((p) => p.name === presetName)
        if (preset) {
            setSelectedPreset(presetName)
            setOutput(null)
            setError(null)
            setUploadedFile(null)
            if (typeof preset.data === "string") {
                setInputValue(preset.data)
            } else {
                setInputValue(JSON.stringify(preset.data, null, 2))
            }
        }
    }

    const formatInput = () => {
        try {
            const parsed = JSON.parse(inputValue)
            setInputValue(JSON.stringify(parsed, null, 2))
        } catch { /* skip */ }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadedFile(file)
        setSelectedPreset("")
        const reader = new FileReader()
        reader.onload = () => {
            setInputValue(reader.result as string)
        }
        reader.readAsText(file)
    }

    const runStage = useCallback(async () => {
        setLoading(true)
        setError(null)
        setOutput(null)

        const textLength = isFileUploadStage && uploadedFile ? uploadedFile.size : inputValue.length;
        const eta = Math.max(2, Math.ceil(2 + (textLength / 4 / 60)));
        
        setEstimatedTime(eta);
        setElapsedTime(0);

        const startTime = Date.now();
        const timerId = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        try {
            if (isFileUploadStage) {
                const formData = new FormData()
                if (uploadedFile) {
                    formData.append("file", uploadedFile)
                } else {
                    const ext = inputValue.trim().startsWith("WEBVTT") ? "vtt" : "txt"
                    const blob = new Blob([inputValue], { type: ext === "vtt" ? "text/vtt" : "text/plain" })
                    formData.append("file", blob, `test-meeting.${ext}`)
                }
                formData.append("title", "Test Meeting")

                const res = await fetch(`${API_BASE_URL}${stage.endpoint}`, { method: "POST", body: formData })
                if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
                setOutput(await res.json())
            } else {
                let body: unknown
                try { body = JSON.parse(inputValue) } catch { body = inputValue }

                const res = await fetch(`${API_BASE_URL}${stage.endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                })
                if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
                setOutput(await res.json())
            }
        } catch (e) {
            setError("API unreachable — showing simulated response")
            setOutput(getSimulatedOutput(stage.id))
        } finally {
            clearInterval(timerId);
            setLoading(false)
        }
    }, [inputValue, uploadedFile, stage, isFileUploadStage])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0 flex-wrap">
                {isFileUploadStage && (
                    <>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="h-2.5 w-2.5" /> Upload .vtt/.txt
                        </Button>
                        <input ref={fileInputRef} type="file" accept=".vtt,.txt,.text" className="hidden" onChange={handleFileUpload} />
                    </>
                )}
                <span className="text-[11px] font-medium text-muted-foreground">Presets:</span>
                {stage.defaultInputs.map((preset) => (
                    <Button key={preset.name} variant={selectedPreset === preset.name ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-2" onClick={() => loadPreset(preset.name)}>
                        {preset.name}
                    </Button>
                ))}
                <div className="flex-1" />
                <Button size="sm" className="h-6 text-[10px] px-3 gap-1" onClick={runStage} disabled={loading}>
                    <Play className="h-2.5 w-2.5" /> Run
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 flex flex-col border-r border-border p-3 overflow-hidden">
                    <JsonEditor value={inputValue} onChange={setInputValue} />
                </div>
                <div className="w-1/2 flex flex-col p-3 overflow-hidden">
                    <OutputPanel data={output} loading={loading} error={error} elapsedTime={elapsedTime} estimatedTime={estimatedTime} />
                </div>
            </div>
        </div>
    )
}

// --------------- Simulated Outputs ---------------

function getSimulatedOutput(stageId: string): unknown {
    switch (stageId) {
        case "ingest":
            return { raw_utterances: SAMPLE_RAW_UTTERANCES }
        case "preprocess":
            return { raw_utterances: SAMPLE_NORMALIZED_UTTERANCES }
        case "key_moments":
            return { highlights: [{ id: "h-1", text: "Dashboard delivery next Tuesday" }] }
        case "topics_segregation":
            return { topics: [{ title: "Mock Topic" }] }
        case "summary_recap_report":
            return { markdown_report: "# Summary\n\nMeeting was productive." }
        case "inferred_insights":
            return {
                discussion_insights: [
                    { insight: "The team is highly dependent on the platform team's timeline", reasoning: "Carol raised multiple concerns about API dependencies blocking the dashboard." }
                ],
                risks_and_blockers: [
                    { risk: "Dashboard launch delayed past Q3", mitigation: "Escalate the API dependency immediately." }
                ],
                follow_up_points: [
                    { point: "Schedule a sync with the platform team", context: "To get a firm commitment on the API delivery date." }
                ]
            }
        case "team_analysis":
            return {
                collaboration_dynamics: "The team collaborated effectively but there was noticeable tension regarding the API dependencies.",
                decision_drivers: ["Alice", "Carol"],
                overall_sentiment: "Tense but ultimately productive."
            }
        case "team_prep":
            return {
                team_announcements: ["The Q3 Dashboard launch is slightly delayed due to API dependencies."],
                structured_assignments: [
                    { owner: "Bob", tasks: ["Escalate the API dependency immediately", "Follow up with platform team"] }
                ]
            }
        case "knowledge":
            return {
                permanent_facts: [
                    { fact: "The team uses a central Analytics API for all external dashboard metrics.", category: "Architecture" }
                ]
            }
        case "participation":
            return { metrics: { Alice: { speaking_time_pct: 45, turns: 5, words: 98 }, Bob: { speaking_time_pct: 30, turns: 4, words: 62 }, Carol: { speaking_time_pct: 25, turns: 2, words: 55 } }, total_duration_sec: 49 }
        default:
            return { message: "No simulated output for this stage" }
    }
}

// --------------- Page ---------------

export function PipelineTestingPage() {
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
    const [showMappingDialog, setShowMappingDialog] = useState(false)

    const handleNodeClick = (id: string) => {
        setActiveNodeId(id === activeNodeId ? null : id)
    }

    const activeStage = PIPELINE_STAGES.find((s) => s.id === activeNodeId) ?? null

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
                <FlaskConical className="h-4 w-4 text-primary" />
                <div>
                    <h1 className="text-base font-bold text-foreground">Pipeline Testing</h1>
                    <p className="text-[11px] text-muted-foreground">Click a stage to test it</p>
                </div>
                {activeStage && (
                    <div className="ml-auto flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1">
                        <span className="text-xs font-medium text-primary">{activeStage.label}</span>
                        <span className="text-[10px] text-primary/70">— {activeStage.description}</span>
                    </div>
                )}
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2 gap-1.5 h-8 text-xs" 
                    onClick={() => setShowMappingDialog(true)}
                >
                    <Users className="h-3.5 w-3.5" />
                    Test Map Speakers
                </Button>
            </div>

            {/* Flow Diagram - top, scrollable both directions */}
            <div className="shrink-0 overflow-x-auto overflow-y-auto max-h-[35vh] px-6 py-4 border-b border-border bg-muted/20 scrollbar-none">
                <div className="min-w-max">
                    <PipelineFlowDiagram activeNodeId={activeNodeId} onNodeClick={handleNodeClick} />
                </div>
            </div>

            {/* Testing Pane - bottom */}
            {activeStage ? (
                <div className="flex-1 overflow-hidden">
                    <TestingPane key={activeStage.id} stage={activeStage} />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                        <FlaskConical className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                        <p className="text-sm text-muted-foreground">Select a pipeline stage above to begin testing</p>
                    </div>
                </div>
            )}

            <SpeakerMappingDialog
                open={showMappingDialog}
                onOpenChange={setShowMappingDialog}
                meetingId="test-meeting-123"
                onConfirm={() => console.log("Mappings confirmed in testing")}
            />
        </div>
    )
}

export default PipelineTestingPage
