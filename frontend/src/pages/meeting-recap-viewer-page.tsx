import { useState, useEffect, Fragment, cloneElement } from "react"
import { motion, AnimatePresence } from "motion/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useNavigate, useSearchParams } from "react-router-dom"
import { BASE_URL } from '@/lib/api';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import {
  MessageSquare, ArrowRight, CheckCircle2, ShieldAlert, Users,
  ArrowUpRight, FileText, ListChecks, Layers, X, Route, ArrowLeft, Calendar, Clock,
  ArrowDownRight,
  ArrowDown,
  ArrowUp,
  PlayCircle,
  Paperclip,
  Camera,
  Folder,
  Trash2,
  CheckCircle,
  XCircle,
  Send
} from "lucide-react"

import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";

import { ShareDialog } from "@/components/share-dialog";
import { IntegrationDispatchPanel } from "@/components/integration-dispatch-panel";

import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CaretDownIcon, CaretUpIcon, SparkleIcon } from "@phosphor-icons/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchMeetingDetail, deleteMeeting, dispatchMeetingSummaries, type MeetingDetail } from "@/lib/api"
import { lookupCitationSources } from "@/lib/citation-lookup"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

const SourceSentenceItem = ({ src, isLast }: { src: any; isLast: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get("meetingId");

  return (
    <div>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group p-3  rounded-2xl hover:my-3 duration-400 transition-all hover:bg-muted/30 ${!isLast ? "border-b border-border/40" : ""}`}
      >
        {src.time !== "Doc Ref" && (
          <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground gap-3">
            <span className="text-foreground dark:font-thin font-light text-sm mb-1">{src.speaker || src.fallbackTitle || "Speaker"}</span>
          </div>
        )}
        {src.time === "Doc Ref" ? (
          src.storagePath ? (
            <div className="mt-2 w-full border border-border/50 overflow-hidden flex justify-center relative h-auto group/doc rounded-xl">
              <Document
                file={`${BASE_URL}${src.storagePath}`}
                loading={<div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground animate-pulse p-4">Loading document...</div>}
                error={<div className="absolute inset-0 flex items-center justify-center text-xs text-destructive p-4">Failed to load document</div>}
              >
                <Page
                  pageNumber={parseInt(src.locatorValue) || 1}
                  width={350}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-background/80 backdrop-blur-md translate-y-full group-hover/doc:translate-y-0 transition-transform duration-300 flex items-center justify-between border-t border-border/50">
                <span className="text-foreground text-xs font-medium truncate pr-2">{src.fallbackTitle}</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-muted/40 rounded-xl border border-border/50 max-h-[150px] overflow-y-auto scrollbar-thin">
              <p className="text-foreground/80 font-mono text-xs whitespace-pre-wrap">{src.text || src.fallbackText}</p>
            </div>
          )
        ) : (
          <p className="text-foreground font-regular leading-relaxed text-sm">"{src.text || src.fallbackText}"</p>
        )}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ height: 0, opacity: 0, margin: 0 }}
              animate={{ height: "1.75rem", opacity: 1, margin: "0.25rem 0 0 0" }}
              exit={{ height: 0, opacity: 0, margin: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between overflow-hidden"
            >
              {src.time && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs font-light text-primary"
                >
                  {src.time}
                </motion.span>
              )}
              <motion.span
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  if (meetingId && src.id) {
                    navigate(`/app/meeting-detail/transcript?meetingId=${meetingId}&utteranceId=${src.id}`);
                  } else if (meetingId) {
                    navigate(`/app/meeting-detail/transcript?meetingId=${meetingId}`);
                  }
                }}
                className="inline-block ml-auto bg-accent px-2.5 py-1 rounded-2xl border border-border text-foreground text-xs font-medium text-right cursor-pointer hover:bg-accent/80 shadow-xs"
              >
                Go to Source →
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!isLast ? <div className="w-full h-[0.5px] mx-4 bg-linear-to-r from-transparent via-foreground/40 to-transparent"></div> : null}
    </div>
  );
};

const renderTextWithPills = (text: string, meeting: MeetingDetail | null) => {
  // Regex to match [km-1], [act-2], [tp-3], [1], [chunk-uuid], etc.
  const regex = /(\[[a-zA-Z0-9,\s-]{1,40}\])/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      const cleanTag = part.slice(1, -1);
      const sources = lookupCitationSources(cleanTag, meeting);
      const isDoc = sources.some(src => src.time === "Doc Ref");
      return (
        <Tooltip key={i} >
          <TooltipTrigger className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs mx-1 cursor-pointer transition-all transform select-none ${isDoc ? 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent hover:border-border/60' : 'bg-primary/5 text-primary hover:bg-primary/25 border border-transparent hover:border-primary/50'}`}>
            {isDoc ? <FileText className="w-3 h-3 text-blue-500 shrink-0" /> : <SparkleIcon className="w-3 h-3 text-primary shrink-0" />}
            {isDoc ? "Doc" : cleanTag}
          </TooltipTrigger>
          <TooltipContent hideArrow={true} side="bottom" className="cursor-pointer bg-background/0   dark:bg-red-200/0 relative max-w-md p-6 text-xs text-foreground  rounded-3xl z-50 space-y-3 animate-in fade-in-0 zoom-in-95 duration-200 ">
            <div className="bg-[#dfe9fb]/90  dark:bg-[#22222a]/90  blur-lg inset-0 absolute bg-lg"></div>
            <div className="bg-background/0  dark:bg-[#22222a]/0 backdrop-blur-2xl rounded-4xl inset-8 absolute bg-lg"></div>

            <div className=" overflow-y-auto pr-1 z-10 scrollbar-none">
              {sources.length > 0 ? (
                sources.map((src, sIdx) => (
                  <SourceSentenceItem key={sIdx} src={src} isLast={sIdx === sources.length - 1} />
                ))
              ) : (
                <div className="text-muted-foreground italic text-xs bg-muted/40 backdrop-blur-md p-3 rounded-xl border border-border/50">No direct transcript sentences found for this reference.</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }
    return part;
  });
};

const renderWithCitations = (children: any, meeting: MeetingDetail | null): any => {
  if (typeof children === 'string') {
    return renderTextWithPills(children, meeting);
  }
  if (Array.isArray(children)) {
    return children.map((child, idx) => (
      <Fragment key={idx}>{renderWithCitations(child, meeting)}</Fragment>
    ));
  }
  if (children && typeof children === 'object' && children.props && children.props.children) {
    return cloneElement(children, { ...children.props }, renderWithCitations(children.props.children, meeting));
  }
  return children;
};

export function AvatarGroup({ participants }: { participants: string[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="t-avatar-group flex items-center -space-x-2 mr-2" onMouseLeave={() => setActiveIdx(null)}>
      {participants.map((p, i) => {
        let shift = 0;
        let scaleActive = 1;
        if (activeIdx !== null) {
          const distance = Math.abs(activeIdx - i);
          shift = -4 * Math.pow(0.45, distance);
          if (activeIdx === i) scaleActive = 1.05;
        }

        return (
          <TooltipProvider key={i} delay={100}>
            <Tooltip>
              <TooltipTrigger>
                <div
                  onMouseEnter={() => setActiveIdx(i)}
                  className="t-avatar w-8 h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shadow-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-default z-10 hover:z-20 relative"
                  style={{
                    '--shift': `${shift.toFixed(3)}px`,
                    '--scale-active': scaleActive,
                    transitionTimingFunction: activeIdx !== null ? 'var(--avatar-ease-in)' : 'var(--avatar-ease-out)'
                  } as React.CSSProperties}
                >
                  {p.charAt(0).toUpperCase()}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium px-2 py-1 bg-foreground text-background rounded shadow-md">
                {p}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

export function MeetingRecapViewerPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingId = searchParams.get("meetingId")
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
  const [isQAOpen, setIsQAOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)
  const [dispatchingSummaries, setDispatchingSummaries] = useState(false)
  const [dispatchedList, setDispatchedList] = useState<{ participant: string; email: string; status: string }[] | null>(null)

  useEffect(() => {
    if (meetingId) {
      setLoading(true)
      fetchMeetingDetail(meetingId).then(res => {
        setMeeting(res)
        setLoading(false)
      }).catch(err => {
        console.error(err)
        setError(true)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [meetingId])

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Main Summary Section Skeleton */}
        <div className="  text-card-foreground p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          {/* Header & Badge Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-1/3 rounded-xl bg-muted/60" />
            <Skeleton className="h-6 w-28 rounded-lg bg-muted/60" />
          </div>
          {/* Subtitle / Description Skeleton */}
          <Skeleton className="h-5 w-2/3 rounded-lg bg-muted/60" />
          <div className="w-full h-px bg-border/40 my-2"></div>

          {/* Sentence / Paragraph Text-Level Skeletons */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-full rounded-md bg-muted/50" />
            <Skeleton className="h-4 w-11/12 rounded-md bg-muted/50" />
            <Skeleton className="h-4 w-5/6 rounded-md bg-muted/50" />
            <Skeleton className="h-4 w-3/4 rounded-md bg-muted/50" />
          </div>

          <div className="space-y-3 pt-4">
            <Skeleton className="h-6 w-1/4 rounded-lg bg-muted/60 mb-2" />
            <div className="space-y-2.5 pl-4 border-l-2 border-border/40">
              <Skeleton className="h-4 w-5/6 rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-4/5 rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-11/12 rounded-md bg-muted/50" />
            </div>
          </div>
        </div>

        {/* Grid Section Skeletons (Bento Grid text-level simulation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="lg:col-span-2   text-card-foreground p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-2xl bg-muted/60 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-1/2 rounded-lg bg-muted/60" />
                <Skeleton className="h-3 w-1/3 rounded-md bg-muted/40" />
              </div>
            </div>
            <div className="space-y-2.5 pt-2">
              <Skeleton className="h-4 w-full rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-5/6 rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-3/4 rounded-md bg-muted/50" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="lg:col-span-2 text-card-foreground p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-2xl bg-muted/60 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-1/2 rounded-lg bg-muted/60" />
                <Skeleton className="h-3 w-1/3 rounded-md bg-muted/40" />
              </div>
            </div>
            <div className="space-y-2.5 pt-2">
              <Skeleton className="h-4 w-full rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-11/12 rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-4/5 rounded-md bg-muted/50" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto mt-12 border border-border/50 rounded-3xl bg-muted/20 space-y-4">
        <h2 className="text-xl font-medium text-foreground">Failed to Load Meeting</h2>
        <p className="text-xs text-muted-foreground">
          {error ? "There was an error retrieving meeting details from the backend." : "No meeting ID was provided or the meeting does not exist."}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const displayMarkdown = meeting.markdown_report || "No markdown report generated for this meeting yet."
  const displayActions = meeting.action_items || []
  const displayParticipants = meeting.participants || []
  const displayRisks = meeting.inferred_insights?.risks_and_blockers || []
  const displayInsights = meeting.inferred_insights?.discussion_insights || []
  const overallTopic = meeting.topics_data?.overall_topic || meeting.title || "Meeting Summary & Recap"
  const overallDescription = meeting.topics_data?.overall_description || ""
  const displayMetrics = meeting.participation?.metrics || []

  const meetingTags = meeting.tags ? meeting.tags.slice(0, 5) : []; // Limit to top 5 tags to keep UI clean

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32" id="pdf-export-content">

      {/* Global Page Static Header */}
      <div className="flex flex-col gap-6 mb-10 pt-2 relative z-10 pl-6">
        {/* <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/app")}
          className="bg-muted/50 border hover:bg-background/50 rounded-xl w-10 h-10 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button> */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            {meetingTags.length > 0 && (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {meetingTags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 capitalize font-medium">{tag}</Badge>
                ))}
              </div>
            )}

            {/* New Dispatch & Share Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsDispatchOpen(true)} className="gap-2">
                <Layers className="w-4 h-4" /> Action Panel
              </Button>
              <Button
                disabled={dispatchingSummaries || !meetingId}
                onClick={async () => {
                  if (!meetingId) return;
                  setDispatchingSummaries(true);
                  try {
                    const res = await dispatchMeetingSummaries(meetingId);
                    setDispatchedList(res.dispatched);
                  } catch (err) {
                    console.error("Failed to dispatch summaries", err);
                  } finally {
                    setDispatchingSummaries(false);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Send className="w-4 h-4" /> {dispatchingSummaries ? "Dispatching..." : "Dispatch Summaries"}
              </Button>
              <Button onClick={() => setIsShareOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                Share
              </Button>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground tracking-tight leading-tight mb-2">{overallTopic}</h1>
          {overallDescription && (
            <p className="text-muted-foreground text-lg mb-2 max-w-3xl leading-relaxed">
              {overallDescription}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {meeting?.recorded_at ? new Date(meeting.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Aug 12, 2024"}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {meeting?.duration || "45m"}</span>
            {displayParticipants.length > 0 ? (
              <div className="flex items-center ml-2 border-l border-border/50 pl-5">
                <AvatarGroup participants={displayParticipants} />
              </div>
            ) : (
              <span className="flex items-center gap-1.5 border-l border-border/50 pl-5"><Users className="w-4 h-4" /> 6 Participants</span>
            )}
          </div>
        </div>
      </div>

      {dispatchedList && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-6 bg-card border border-emerald-500/30 rounded-3xl shadow-sm space-y-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Dispatched Summaries & Reports to Member Participants
            </h2>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">Email Sent Successfully</Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Successfully looked up member participant email addresses from the user management registry and transmitted the executive markdown report and action summaries.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {dispatchedList.map((d, i) => (
              <div key={i} className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-full border border-background bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shadow-xs shrink-0">
                  {d.participant.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <div className="text-xs font-bold text-foreground truncate">{d.participant}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">{d.email}</div>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">{d.status}</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 4-Column Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">

        {/* ----------------- Block 1: Expandable Summary (Col Span 2) ----------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.7 }}
          style={{
            height: isSummaryExpanded ? "auto" : "300px"
          }}
          className="lg:col-span-3 text-card-foreground p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between "
        >
          <motion.div className={`absolute ${isSummaryExpanded ? "bottom-0" : "bottom-5"} w-full flex justify-center left-0 z-20 transition-all duration-300`}>
            <div
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="text-xs mx-auto bg-muted border px-4 py-2 rounded-full cursor-pointer hover:bg-accent transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isSummaryExpanded ? <CaretUpIcon className="w-3.5 h-3.5" /> : <CaretDownIcon className="w-3.5 h-3.5" />}
              <span>{isSummaryExpanded ? "Show Less" : "Expand Full Summary"}</span>
            </div>
          </motion.div>

          <div
            className="flex-1 overflow-hidden relative transition-all duration-300 min-h-0"
            style={{
              maskImage: !isSummaryExpanded ? "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)" : "linear-gradient(to bottom, rgba(0,0,0,1) 100%, rgba(0,0,0,1) 100%)",
              WebkitMaskImage: !isSummaryExpanded ? "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)" : "linear-gradient(to bottom, rgba(0,0,0,1) 100%, rgba(0,0,0,1) 100%)"
            }}
          >
            <div className="space-y-4">
              <motion.div className="text-foreground/90 text-base leading-relaxed space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-medium text-foreground flex items-center gap-2"><SparkleIcon className="text-primary" />  Summary</h2>
                  <div className="flex items-center gap-2">
                    {meetingId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await deleteMeeting(meetingId)
                            navigate("/app")
                          } catch (err) {
                            console.error("Failed to delete meeting", err)
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg text-xs h-7 px-2 gap-1"
                      >
                        {/* <Trash2 className="w-3.5 h-3.5" /> Delete Meeting */}
                      </Button>
                    )}
                  </div>
                </div>

                {/* {overallDescription && (
                  <p className="text-sm text-muted-foreground italic border-l-2 border-primary/50 pl-3 py-1 bg-muted/10 rounded-r-lg">
                    {overallDescription}
                  </p>
                )} */}
                <div className="w-full h-px bg-linear-to-r from-transparent via-foreground/10 to-transparent"></div>

                <div className="text-foreground/90 text-base leading-relaxed">
                  <TooltipProvider delay={100}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-8 mb-4 pb-2 border-b border-border/60 flex items-center gap-2">{renderWithCitations(props.children, meeting)}</h1>,
                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-foreground tracking-tight mt-7 mb-3 pb-1 border-b border-border/40 flex items-center gap-2">{renderWithCitations(props.children, meeting)}</h2>,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-foreground tracking-tight mt-6 mb-2 flex items-center gap-1.5">{renderWithCitations(props.children, meeting)}</h3>,
                        h4: ({ node, ...props }) => <h4 className="text-base font-semibold text-foreground mt-4 mb-2">{renderWithCitations(props.children, meeting)}</h4>,
                        h5: ({ node, ...props }) => <h5 className="text-sm font-semibold text-foreground mt-3 mb-1">{renderWithCitations(props.children, meeting)}</h5>,
                        h6: ({ node, ...props }) => <h6 className="text-xs font-semibold text-muted-foreground mt-3 mb-1 uppercase tracking-wider">{renderWithCitations(props.children, meeting)}</h6>,
                        ul: ({ node, ...props }) => <ul className="text-sm text-muted-foreground space-y-2 my-3 list-disc pl-5 marker:text-primary/60" {...props} />,
                        ol: ({ node, ...props }) => <ol className="text-sm text-muted-foreground space-y-2 my-3 list-decimal pl-5 marker:text-primary/60 font-medium" {...props} />,
                        li: ({ node, ...props }) => <li className="my-1.5 leading-relaxed pl-1">{renderWithCitations(props.children, meeting)}</li>,
                        p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-sm text-foreground/90 last:mb-0">{renderWithCitations(props.children, meeting)}</p>,
                        strong: ({ node, ...props }) => <strong className="font-bold text-foreground tracking-wide">{renderWithCitations(props.children, meeting)}</strong>,
                        em: ({ node, ...props }) => <em className="italic text-muted-foreground">{renderWithCitations(props.children, meeting)}</em>,
                        a: ({ node, ...props }) => <a className="text-primary underline underline-offset-4 font-medium hover:text-primary/80 transition-colors" target="_blank" rel="noreferrer">{renderWithCitations(props.children, meeting)}</a>,
                        blockquote: ({ node, ...props }) => <blockquote className="my-6 pl-4 pr-3 py-3 bg-muted/20 border-l-4 border-primary rounded-r-2xl italic text-sm text-muted-foreground/90 shadow-sm overflow-hidden relative">{renderWithCitations(props.children, meeting)}</blockquote>,
                        pre: ({ node, ...props }) => <pre className="my-4 bg-transparent p-0 overflow-visible" {...props} />,
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code className="font-mono text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full shadow-xs mx-0.5" {...props} />
                          ) : (
                            <code className="font-mono text-xs text-foreground block p-4 bg-muted/30 rounded-2xl border border-border/50 overflow-x-auto my-4 shadow-inner" {...props} />
                          ),
                        table: ({ node, ...props }) => (
                          <div className="my-6 w-full overflow-x-auto rounded-2xl border border-border/50 shadow-sm">
                            <table className="w-full text-left border-collapse text-sm" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider" {...props} />,
                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-border/40 bg-card/20" {...props} />,
                        tr: ({ node, ...props }) => <tr className="hover:bg-muted/10 transition-colors" {...props} />,
                        th: ({ node, ...props }) => <th className="px-4 py-3 font-medium text-foreground">{renderWithCitations(props.children, meeting)}</th>,
                        td: ({ node, ...props }) => <td className="px-4 py-3 text-muted-foreground leading-relaxed text-xs">{renderWithCitations(props.children, meeting)}</td>
                      }}
                    >
                      {displayMarkdown}
                    </ReactMarkdown>
                  </TooltipProvider>
                </div>
              </motion.div>
            </div>
          </div>

        </motion.div>

        {/* ----------------- Block 2: Full Transcript Teaser (Col Span 1) ----------------- */}

        <div className="lg:col-span-1 h-fit sticky  top-6  lg:self-start  z-10 flex flex-col gap-3 w-[calc(100%+300px)] pr-[300px]">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigate(meetingId ? `/app/meeting-detail/transcript?meetingId=${meetingId}` : "/app/meeting-detail/transcript")}

            className="w-[calc(100%+300px)] pr-[300px] bg-card border text-card-foreground shadow-sm p-6 rounded-3xl flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors group overflow-hidden relative z-10"
          >
            {/* Decorative background lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-8 left-6 right-6 h-px bg-foreground" />
              <div className="absolute top-14 left-6 right-12 h-px bg-foreground" />
              <div className="absolute top-20 left-6 right-8 h-px bg-foreground" />
            </div>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
                <PlayCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">Watch Meeting Recording</h3>
              <p className="text-xs text-muted-foreground line-clamp-3 relative z-10">
                Full video capture including shared screen and active speaker views. {meeting?.duration || "45m"} duration.
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs font-semibold text-primary group-hover:underline relative z-10">
              Play Video <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </motion.div>


        </div>



        {/* ----------------- Block 4: Action Items (Col Span 4) ----------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="lg:col-span-4 text-card-foreground p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col bg-card shadow-sm border border-border/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ListChecks className="w-6 h-6" /> Action Items
            </h2>
            <Badge variant="outline" className="bg-muted/50 border-transparent text-xs"><ListChecks className="w-3 h-3 mr-1" /> {displayActions.length} Actions</Badge>
          </div>

          <div className="w-full">
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {displayActions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No action items.</p>
              ) : (
                <Stepper defaultValue={1} orientation="vertical" className="mt-2">
                  {displayActions.map((act, idx) => (
                    <StepperItem className="relative not-last:flex-1 items-start" key={act.id || idx} step={idx + 1}>
                      <StepperTrigger className="items-start rounded pb-6 last:pb-0">
                        <StepperIndicator />
                        <div className="mt-0.5 space-y-1 pl-4 pr-2 text-left">
                          <StepperTitle className="text-sm font-medium text-foreground">{act.text}</StepperTitle>
                          <StepperDescription className="text-xs">Owner: {act.owner || "Unassigned"} • Due: {act.deadline || "None"}</StepperDescription>
                        </div>
                      </StepperTrigger>
                      {idx + 1 < displayActions.length && (
                        <StepperSeparator className="-order-1 -translate-x-1/2 absolute inset-y-0 top-[calc(1.5rem+0.125rem)] left-3 m-0 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                      )}
                    </StepperItem>
                  ))}
                </Stepper>
              )}
            </div>
          </div>
        </motion.div>

        {/* ----------------- Block 5: Deep Analysis & Insights (Col Span 4) ----------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 text-card-foreground border border-border p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col bg-linear-to-b from-black/30 to-transparent shadow-[inset_0_0_20px_rgba(255,255,255,0.08)]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <SparkleIcon className="w-6 h-6" /> Deep Analysis & Insights
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-transparent text-xs"><ShieldAlert className="w-3 h-3 mr-1" /> {displayRisks.length} Risks</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 font-thin!">

            {/* Risks & Blockers Column */}
            <div className="space-y-3 ">
              <h3 className="mt-8  text-xl text-foreground border-b border-border/50 pb-2 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 " /> Risks & Blockers
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {displayRisks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No risks identified.</p>
                ) : (
                  <Stepper defaultValue={1} orientation="vertical" className="mt-2">
                    {displayRisks.map((r, idx) => (
                      <StepperItem className="relative not-last:flex-1 items-start" key={idx} step={idx + 1}>
                        <StepperTrigger className="items-start rounded pb-6 last:pb-0">
                          <StepperIndicator />
                          <div className="mt-0.5 space-y-1 pl-4 pr-2 text-left">
                            <StepperTitle className="text-xs ">{r.risk || r.text || r.title}</StepperTitle>
                          </div>
                        </StepperTrigger>
                        {idx + 1 < displayRisks.length && (
                          <StepperSeparator className="-order-1 -translate-x-1/2 absolute inset-y-0 top-[calc(1.5rem+0.125rem)] left-3 m-0 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                        )}
                      </StepperItem>
                    ))}
                  </Stepper>
                )}
              </div>
            </div>


            {/* Knowledge Facts Column */}
            <div className="space-y-3">
              <h3 className="text-sm text-foreground border-b border-border/50 pb-2 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Knowledge Facts
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {meeting.knowledge_facts?.length === 0 || !meeting.knowledge_facts ? (
                  <p className="text-xs text-muted-foreground">No facts extracted.</p>
                ) : (
                  <Stepper defaultValue={1} orientation="vertical" className="mt-2">
                    {meeting.knowledge_facts.map((kf, idx) => (
                      <StepperItem className="relative not-last:flex-1 items-start" key={idx} step={idx + 1}>
                        <StepperTrigger className="items-start rounded pb-6 last:pb-0">
                          <StepperIndicator />
                          <div className="mt-0.5 space-y-1 pl-4 pr-2 text-left">
                            <StepperTitle className="text-xs ">{kf.text}</StepperTitle>
                          </div>
                        </StepperTrigger>
                        {idx + 1 < meeting.knowledge_facts!.length && (
                          <StepperSeparator className="-order-1 -translate-x-1/2 absolute inset-y-0 top-[calc(1.5rem+0.125rem)] left-3 m-0 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                        )}
                      </StepperItem>
                    ))}
                  </Stepper>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ----------------- Block 5.5: Follow-ups & Graph Edges (Col Span 2) ----------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="lg:col-span-2 text-card-foreground p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col bg-linear-to-b from-black/30 to-transparent shadow-[inset_0_0_20px_rgba(255,255,255,0.08)] border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Route className="w-6 h-6" /> Follow-ups & Graph Edges
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Follow Ups Column */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 mb-4 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Implicit Follow-ups
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {meeting.inferred_insights?.follow_up_points?.length === 0 || !meeting.inferred_insights?.follow_up_points ? (
                  <p className="text-xs text-muted-foreground">No follow-ups.</p>
                ) : (
                  <Stepper defaultValue={1} orientation="vertical" className="mt-2">
                    {meeting.inferred_insights.follow_up_points.map((f, idx) => (
                      <StepperItem className="relative not-last:flex-1 items-start" key={idx} step={idx + 1}>
                        <StepperTrigger className="items-start rounded pb-6 last:pb-0">
                          <StepperIndicator />
                          <div className="mt-0.5 space-y-1 pl-4 pr-2 text-left">
                            <StepperTitle className="text-xs font-medium">{f.point || f.text}</StepperTitle>
                          </div>
                        </StepperTrigger>
                        {idx + 1 < meeting.inferred_insights.follow_up_points!.length && (
                          <StepperSeparator className="-order-1 -translate-x-1/2 absolute inset-y-0 top-[calc(1.5rem+0.125rem)] left-3 m-0 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                        )}
                      </StepperItem>
                    ))}
                  </Stepper>
                )}
              </div>
            </div>

            {/* Graph Edges Column */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 mb-4">Cross-Meeting Graph Edges</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {meeting?.cross_meeting_links?.length ? (
                  <Stepper defaultValue={1} orientation="vertical" className="mt-2">
                    {meeting.cross_meeting_links.map((link, idx) => (
                      <StepperItem
                        className="relative not-last:flex-1 items-start"
                        key={idx}
                        step={idx + 1}
                      >
                        <StepperTrigger className="items-start rounded pb-6 last:pb-0">
                          <StepperIndicator />
                          <div className="mt-0.5 space-y-1 pl-4 pr-2 text-left">
                            <StepperTitle className="flex justify-between w-[200px] text-xs">
                              <span className="font-mono text-primary truncate max-w-[120px]">{link.target_meeting_id}</span>
                              <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 px-2 rounded">{(link.similarity_score * 100).toFixed(1)}%</span>
                            </StepperTitle>
                            <StepperDescription className="text-xs">{link.reason}</StepperDescription>
                          </div>
                        </StepperTrigger>
                        {idx + 1 < meeting.cross_meeting_links!.length && (
                          <StepperSeparator className="-order-1 -translate-x-1/2 absolute inset-y-0 top-[calc(1.5rem+0.125rem)] left-3 m-0 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                        )}
                      </StepperItem>
                    ))}
                  </Stepper>
                ) : (
                  <div className="p-4 bg-muted/10 rounded-xl border border-border/30 text-center flex flex-col items-center justify-center h-24">
                    <Route className="w-5 h-5 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">No related meetings found in graph.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ----------------- Block 5: Behavioral & Team Metrics (Col Span 4) ----------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-4 text-card-foreground border border-border p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col bg-linear-to-b from-black/30 to-transparent shadow-[inset_0_0_20px_rgba(255,255,255,0.08)]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-medium  text-foreground flex items-center gap-2">
              {/* <Users className="w-6 h-6" />  */}
              Behavioral & Team Analytics
            </h2>
            <Badge variant="secondary" className="font-mono bg-background/50 flex items-center gap-1"><Users className="w-3 h-3 font-[]" /> {displayParticipants.length} Participants</Badge>
          </div>



          {/* Granular Table */}
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-background/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[200px] pl-4">Participant</TableHead>
                  <TableHead>Role Type</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead className="text-center">Key Moments</TableHead>
                  <TableHead className="w-[300px]">Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No participant metrics found.</TableCell>
                  </TableRow>
                ) : (
                  displayMetrics.map((m, i) => {
                    const feedbackData = meeting?.team_analysis?.individual_feedback?.find(f => f.speaker === m.speaker);
                    return (
                      <TableRow key={i} className="border-border/30 hover:bg-muted/10 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3 p-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary border border-primary/30 shrink-0">
                              {(m.speaker || "U").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-sm">{m.speaker}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {feedbackData ? (
                            <Badge variant="outline" className="bg-secondary/20">{feedbackData.speaker_type}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-full max-w-[80px] bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${m.percentage}%` }} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">{m.percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {feedbackData?.key_moments_count ?? 0}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground leading-snug ">
                          {feedbackData?.individual_feedback || "No specific feedback available."}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {/* Top-Level Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4  mt-6">
            <div className="p-4 rounded-2xl ">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overall Feedback</p>
              <p className="font-serif text-primary  text-4xl ">{meeting?.team_analysis?.overall_sentiment || "Neutral"}</p>
            </div>
            <div className="p-4 ">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Collaboration Style</p>
              {Array.isArray(meeting?.team_analysis?.collaboration_dynamics) ? (
                <ul className="list-disc pl-4 text-xs leading-relaxed space-y-1">
                  {meeting.team_analysis.collaboration_dynamics.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs leading-relaxed">{meeting?.team_analysis?.collaboration_dynamics || "No dynamics noted."}</p>
              )}
            </div>
          </div>

          {/* Announcements & Global Drivers */}
          {(meeting?.team_prep?.team_announcements?.length || meeting?.team_analysis?.decision_drivers?.length) ? (
            <div className="mt-6 flex flex-wrap gap-4">
              {meeting?.team_analysis?.decision_drivers?.map((dd, idx) => (
                <div key={idx} className="flex-1 min-w-[200px] p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs">
                  <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Decision Driver</p>
                  <p className="text-foreground">{typeof dd === 'string' ? dd : (dd.driver || dd.text)}</p>
                </div>
              ))}
              {meeting?.team_prep?.team_announcements?.map((ann, idx) => (
                <div key={idx} className="flex-1 min-w-[200px] p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-xs">
                  <p className="font-semibold text-sky-700 dark:text-sky-400 mb-1">Announcement</p>
                  <p className="text-foreground">{typeof ann === 'string' ? ann : (ann.announcement || ann.text)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>

        {/* ----------------- Block 6: Deep Backend Artifacts (Col Span 4) ----------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-4 text-card-foreground p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col bg-card shadow-sm border border-border/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Deep Backend Artifacts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workflow Traces */}
            <div className="space-y-3 col-span-1 md:col-span-1">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 mb-4">Forensic Workflow Traces</h3>
              <div className="max-h-[400px] overflow-y-auto pr-4 scrollbar-thin">
                <Timeline className="pl-4">
                  {meeting?.workflow_traces?.map((tr, idx) => (
                    <TimelineItem
                      className="group-data-[orientation=vertical]/timeline:ms-10"
                      key={idx}
                    >
                      <TimelineHeader>
                        {idx !== (meeting.workflow_traces?.length || 0) - 1 && (
                          <TimelineSeparator className="-left-7 h-[calc(100%-1.5rem-0.25rem)] translate-y-6.5" />
                        )}
                        <TimelineTitle className="mt-0.5 text-sm flex items-center justify-between w-full">
                          <span>{tr.step_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${tr.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                            {tr.status}
                          </span>
                        </TimelineTitle>
                        <TimelineIndicator className="-left-7 flex size-6 items-center justify-center border-none bg-primary/10">
                          {tr.status === 'SUCCESS' ? <CheckCircle size={14} className="text-primary" /> : <XCircle size={14} className="text-destructive" />}
                        </TimelineIndicator>
                      </TimelineHeader>
                      <TimelineContent>
                        <p className="text-muted-foreground mb-1"><span className="font-semibold text-foreground/70">Input:</span> {tr.input_summary}</p>
                        <p className="text-muted-foreground mb-1"><span className="font-semibold text-foreground/70">Output:</span> {tr.output_summary}</p>
                        <TimelineDate className="mt-2 mb-0 flex items-center justify-between">
                          <span>{new Date(tr.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          <span className="font-mono text-[10px]">{tr.execution_time_ms} ms</span>
                        </TimelineDate>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </div>
            </div>

            {/* Semantic Vectors */}
            <div className="space-y-3 col-span-1 md:col-span-1">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 mb-4">Semantic Vector Chunks (pgvector)</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {meeting?.semantic_chunks?.length ? meeting.semantic_chunks.map((sc, idx) => (
                  <div key={idx} className="p-3 bg-muted/10 rounded-xl border border-border/30 text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-primary text-[10px] bg-primary/10 px-2 py-0.5 rounded">{sc.chunk_type}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">Dim: 1536</span>
                    </div>
                    <p className="text-foreground line-clamp-3">{sc.text}</p>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground">No semantic chunks vectorized.</p>
                )}
              </div>
            </div>

          </div>
        </motion.div>

        {/* ----------------- Block 3: Processing Workflow Trace (Col Span 4) ----------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate(meetingId ? `/app/processing-flow?meetingId=${meetingId}` : "/app/processing-flow")}
          className="lg:col-span-4 text-card-foreground p-6 md:p-8 rounded-3xl flex flex-col justify-between cursor-pointer group overflow-hidden relative"
        >
          {/* Decorative nodes background */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Route className="w-48 h-48" />
          </div>

          <div className="flex items-center justify-between w-full relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">Workflow Trace</h2>
            </div>
            <Badge variant="secondary" className="font-mono bg-background/50">Trace v1.0</Badge>
          </div>
          <div className="w-full h-px bg-linear-to-r from-transparent via-foreground/10 to-transparent my-4 relative z-10"></div>

          <div className="flex items-center justify-between w-full relative z-10">
            <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
              Explore the raw processing nodes, LLM states, and extraction pipelines that built this recap.
            </p>
            <div className="hidden md:flex items-center text-sm font-semibold text-sky-500 group-hover:underline relative z-10 mr-4">
              View Pipeline <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </motion.div>

      </div>

      {/* ----------------- Floating Q&A Widget ----------------- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isQAOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-card border text-card-foreground shadow-xl rounded-2xl mb-4 w-[320px] md:w-[380px] overflow-hidden flex flex-col"
            >
              <div className="bg-muted/50 border-b border-border p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary">
                    <MessageSquare className="w-3 h-3" />
                  </div>
                  <span >Meet-Ink Assistant</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => setIsQAOpen(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="p-4 flex-1 h-[250px] overflow-y-auto space-y-4 bg-muted/10">
                <div className="bg-background border shadow-sm p-3 rounded-2xl rounded-tl-sm text-xs max-w-[85%]">
                  Hi! Ask me anything about what was discussed, decisions made, or action items carried forward.
                </div>
              </div>

              <div className="p-3 border-t bg-background">
                <div className="relative">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="pr-10 bg-muted/30 border-border/50 rounded-xl h-10 text-xs"
                  />
                  <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8 text-primary hover:bg-primary/20 rounded-lg">
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isQAOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsQAOpen(true)}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center cursor-pointer border border-primary-foreground/10"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </div>

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        meetingId={meetingId || ''}
      />

      <IntegrationDispatchPanel
        open={isDispatchOpen}
        onOpenChange={setIsDispatchOpen}
        meetingId={meetingId || ''}
        actionItems={displayActions}
      />
    </div>
  )
}
