import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Play, Pause, SkipBack, SkipForward, FileImage, FileText, CheckCircle2, AlertTriangle, Video, VideoOff, ArrowLeft, LayoutPanelLeft } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchMeetingDetail, type MeetingDetail, BASE_URL } from "@/lib/api"
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function TranscriptViewerPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingId = searchParams.get("meetingId")
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

  // Layout states
  const [hasVideo, setHasVideo] = useState(false)
  const [showTranscriptPane, setShowTranscriptPane] = useState(true)

  // Playback & filter states
  const [isPlaying, setIsPlaying] = useState(false)
  const [highlightsOnly, setHighlightsOnly] = useState(false)
  const [transcriptVersion, setTranscriptVersion] = useState("cleaned")
  const [searchQuery] = useState("")

  // Timeline states
  const [activeLine, setActiveLine] = useState<number | null>(1)
  const [currentTime, setCurrentTime] = useState(0) // in seconds
  const [hoveredMarker, setHoveredMarker] = useState<any>(null)
  const [isTimelineHovered, setIsTimelineHovered] = useState(false)
  const [hoveredPositionPercent, setHoveredPositionPercent] = useState<number | null>(null)
  const [rulerHoverPercent, setRulerHoverPercent] = useState<number | null>(null)
  const [animatedTime, setAnimatedTime] = useState(0) // For staggered color cascade animation

  // Staggered Domino Color Cascade Effect
  useEffect(() => {
    let animationFrameId: number
    const startTime = performance.now()
    const startValue = animatedTime
    const targetValue = currentTime
    const durationMs = 350 // 350ms staggered domino cascade duration

    if (Math.abs(targetValue - startValue) < 0.5) {
      setAnimatedTime(targetValue)
      return
    }

    const update = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / durationMs)
      // Cubic easeInOut curve for buttery smooth staggered cascade
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
      const currentValue = startValue + (targetValue - startValue) * ease
      setAnimatedTime(currentValue)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update)
      }
    }

    animationFrameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animationFrameId)
  }, [currentTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0").substring(0, 2)}`
  }

  const displayTranscript = useMemo(() => {
    if (meeting?.transcript && meeting.transcript.length > 0) {
      return meeting.transcript.map((t, idx) => {
        let slideInfo: any = undefined;
        let slideName: string | undefined = undefined;
        if (t.source_doc_refs && t.source_doc_refs.length > 0) {
          const ref = t.source_doc_refs[0];
          slideName = `${ref.filename || 'Doc'} (Page ${ref.page_number || 1})`;
          
          let storagePath = undefined;
          if (meeting.attachments && ref.attachment_id) {
            const att = meeting.attachments.find(a => a.id === ref.attachment_id);
            if (att) storagePath = att.storage_path;
          }
          
          slideInfo = { ...ref, storagePath };
        }

        const rawId = String(t.id);
        
        let intent = "";
        let isHighlight = false;
        let entity = "";
        let confidence = "";

        if (meeting.action_items?.some(act => act.source_utterance_ids?.includes(rawId))) {
          intent = "Action Item";
          isHighlight = true;
          entity = "Execution";
          confidence = "95%";
        } else if (meeting.key_moments?.some(km => km.source_ids?.includes(rawId))) {
           const km = meeting.key_moments.find(km => km.source_ids?.includes(rawId));
           if (km?.type?.toLowerCase().includes("risk")) {
             intent = "Risk";
             entity = "Blocker";
           } else {
             intent = "Decision";
             entity = "Alignment";
           }
           isHighlight = true;
           confidence = `${Math.round((km?.confidence || 0.9) * 100)}%`;
        } else if (slideInfo) {
           intent = "Reference";
           isHighlight = true;
           entity = "Document";
           confidence = "99%";
        }

        return {
          id: idx + 1,
          rawId: rawId,
          speaker: t.speaker || "Speaker",
          time: formatTime(t.start || idx * 15),
          timeSec: t.start || idx * 15,
          text: transcriptVersion === "auto" ? (t.raw_text || t.text) : t.text,
          intent,
          entity,
          confidence,
          highlight: isHighlight,
          slide: slideName,
          docRef: slideInfo
        };
      })
    }
    return []
  }, [meeting, transcriptVersion])

  const displayTopics = meeting?.topics_data?.topics || []

  const displayMarkers = useMemo(() => {
    if (!meeting || displayTranscript.length === 0) return []
    const markers: any[] = []
    
    ;(meeting.action_items || []).forEach((act) => {
       const uIds = act.source_utterance_ids || [];
       if (uIds.length > 0) {
          const matchedLines = displayTranscript.filter((l: any) => uIds.includes(l.rawId));
          if (matchedLines.length > 0) {
             const timeSec = matchedLines[0].timeSec;
             markers.push({
               timeSec,
               label: `Action: ${act.owner || "Team"}`,
               type: "action",
               preview: act.text,
               intent: "Action Item"
             })
          }
       }
    });

    ;(meeting.key_moments || []).forEach((km) => {
       const uIds = km.source_ids || [];
       if (uIds.length > 0) {
          const matchedLines = displayTranscript.filter((l: any) => uIds.includes(l.rawId));
          if (matchedLines.length > 0) {
             const timeSec = matchedLines[0].timeSec;
             const isRisk = km.type?.toLowerCase().includes('risk');
             markers.push({
               timeSec,
               label: `${isRisk ? 'Risk' : 'Key Moment'}: ${km.text.substring(0, 20)}...`,
               type: isRisk ? "risk" : "decision",
               preview: km.text,
               intent: isRisk ? "Risk" : "Decision"
             })
          }
       }
    });
    return markers
  }, [meeting, displayTranscript])

  const parsedDuration = useMemo(() => {
    if (meeting?.participation?.total_duration_seconds) {
      return meeting.participation.total_duration_seconds;
    }
    if (meeting?.duration) {
       const str = String(meeting.duration);
       if (str.includes('m')) return parseInt(str) * 60;
       if (str.includes('h')) return parseInt(str) * 3600;
       if (!isNaN(Number(str))) return Number(str);
    }
    return 0;
  }, [meeting]);

  const maxTranscriptTime = displayTranscript.length > 0 ? Math.max(...displayTranscript.map(t => t.timeSec)) + 15 : 555;
  const duration = parsedDuration > 0 ? Math.max(parsedDuration, maxTranscriptTime) : maxTranscriptTime;
  const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const isAutoScrolling = useRef(false)

  // Timer Effect
  useEffect(() => {
    let interval: any
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  // Robust scroll to match sticky picture offset function
  const scrollToLine = (id: number) => {
    const el = lineRefs.current[id]
    const container = scrollAreaRef.current
    if (el && container) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()

      // Calculate how far the element's center is from the target alignment position (320px from container top, matching the lower portion of the sticky picture)
      const elCenter = elRect.top + elRect.height / 2
      const targetY = containerRect.top + 320
      const offset = elCenter - targetY

      container.scrollTo({
        top: Math.max(0, container.scrollTop + offset),
        behavior: "smooth"
      })
    }
  }

  // Sync active line of transcript with current playback time ONLY when video/audio is actively playing
  useEffect(() => {
    if (!isPlaying) return
    const matchedLine = [...displayTranscript]
      .reverse()
      .find((line) => currentTime >= line.timeSec)

    if (matchedLine && matchedLine.id !== activeLine) {
      isAutoScrolling.current = true
      setActiveLine(matchedLine.id)
      scrollToLine(matchedLine.id)
      setTimeout(() => { isAutoScrolling.current = false }, 800)
    }
  }, [currentTime, isPlaying, displayTranscript])

  // Scroll spy handler for manual scrolling
  const handleScroll = () => {
    if (isAutoScrolling.current || isPlaying) return

    const container = scrollAreaRef.current
    if (!container) return

    const containerTop = container.getBoundingClientRect().top
    const targetY = containerTop + 320 // Match the lower portion of the sticky picture offset

    let closestId: number | null = null
    let minDistance = Infinity

    Object.entries(lineRefs.current).forEach(([idStr, el]) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const elCenter = rect.top + rect.height / 2
      const distance = Math.abs(elCenter - targetY)

      if (distance < minDistance) {
        minDistance = distance
        closestId = Number(idStr)
      }
    })

    if (closestId !== null && closestId !== activeLine) {
      setActiveLine(closestId)
      const matched = displayTranscript.find(t => t.id === closestId)
      if (matched) {
        setCurrentTime(matched.timeSec)
      }
    }
  }

  const utteranceParam = searchParams.get("utteranceId")

  useEffect(() => {
    if (utteranceParam && displayTranscript.length > 0) {
      const matched = displayTranscript.find(t => t.rawId === utteranceParam)
      if (matched) {
        setTimeout(() => {
          isAutoScrolling.current = true
          setActiveLine(matched.id)
          setCurrentTime(matched.timeSec)
          scrollToLine(matched.id)
          setTimeout(() => { isAutoScrolling.current = false }, 800)
        }, 300)
      }
    }
  }, [utteranceParam, displayTranscript])

  const filteredTranscript = displayTranscript.filter((line) => {
    const matchesHighlight = !highlightsOnly || line.highlight
    const matchesSearch = searchQuery === "" ||
      line.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      line.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesHighlight && matchesSearch
  })

  // Group transcript items by slide sections for the cascading sticky layout
  const groupedTranscript = useMemo(() => {
    const groups: { slideTitle: string; image?: string; docRef?: any; lines: typeof displayTranscript }[] = []
    
    let defaultDocRef = undefined;
    if (meeting?.attachments && meeting.attachments.length > 0) {
      defaultDocRef = {
        filename: meeting.attachments[0].filename,
        page_number: 1,
        attachment_id: meeting.attachments[0].id,
        storagePath: meeting.attachments[0].storage_path,
        chunk_text: meeting.attachments[0].doc_summary || "Document preview"
      };
    }

    let currentGroup: { slideTitle: string; image?: string; docRef?: any; lines: typeof displayTranscript } = {
      slideTitle: "Introduction & Overview",
      image: undefined,
      docRef: defaultDocRef,
      lines: []
    }

    filteredTranscript.forEach((line) => {
      if (line.docRef) {
        if (currentGroup.lines.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = {
          slideTitle: line.slide || "Document",
          image: undefined,
          docRef: line.docRef,
          lines: [line]
        }
      } else {
        currentGroup.lines.push(line)
      }
    })
    if (currentGroup.lines.length > 0) {
      groups.push(currentGroup)
    }
    return groups
  }, [filteredTranscript])

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "Decision": return "bg-primary/20 text-primary border-primary/40 ring-1 ring-primary/20"
      case "Action Item": return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/40 ring-1 ring-green-500/20"
      case "Risk": return "bg-destructive/20 text-destructive border-destructive/40 ring-1 ring-destructive/20"
      case "Goal": return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 ring-1 ring-blue-500/20"
      default: return "bg-muted text-muted-foreground border-border"
    }
  }

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "decision": return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
      case "risk": return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
      case "action": return <Play className="w-3.5 h-3.5 text-green-500" />
      default: return <FileImage className="w-3.5 h-3.5 text-blue-500" />
    }
  }

  const getMarkerDotColor = (type: string) => {
    switch (type) {
      case "decision": return "bg-primary"
      case "risk": return "bg-destructive"
      case "action": return "bg-green-500"
      default: return "bg-blue-500"
    }
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = clickX / rect.width
    setCurrentTime(Math.min(duration, Math.max(0, Math.round(percent * duration))))
  }

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const percent = (mouseX / rect.width) * 100
    setHoveredPositionPercent(Math.max(0, Math.min(100, percent)))
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-background flex flex-col p-8 space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl bg-muted/60" />
        <div className="flex-1 flex gap-8">
          <Skeleton className="flex-1 h-full rounded-3xl bg-muted/60" />
          <Skeleton className="w-80 h-full rounded-3xl bg-muted/60 hidden lg:block" />
        </div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-lg border border-border/50 rounded-3xl bg-muted/20 p-12 space-y-4">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <h2 className="text-xl font-medium text-foreground">Failed to Load Transcript</h2>
          <p className="text-xs text-muted-foreground">
            {error ? "There was an error retrieving the transcript from the backend." : "No meeting ID was provided or the meeting does not exist."}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background text-foreground flex flex-col">

      {/* Unified Global Header */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center gap-3 p-4 bg-transparent border-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(meetingId ? `/app/meeting-detail?meetingId=${meetingId}` : "/app/meeting-detail")}
          className="shrink-0 w-8 h-8 rounded-md bg-muted hover:bg-muted/80 text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold leading-none">Transcript & Key Topics</span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <select
            value={transcriptVersion}
            onChange={(e) => setTranscriptVersion(e.target.value)}
            className="bg-transparent border border-border text-foreground text-xs rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-muted"
          >
            <option value="auto">Auto-generated</option>
            <option value="cleaned">Cleaned up</option>
            <option value="original">Original Audio</option>
          </select>

          <div className="flex items-center gap-2">
            <Label htmlFor="highlights" className="text-xs text-muted-foreground cursor-pointer">Highlights Only</Label>
            <Switch id="highlights" checked={highlightsOnly} onCheckedChange={setHighlightsOnly} />
          </div>

          <div className="h-6 w-px bg-border mx-2"></div>

          <div className="flex items-center gap-1">
            <Button
              variant={showTranscriptPane ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setShowTranscriptPane(!showTranscriptPane)}
              className="w-8 h-8"
              title="Toggle Transcript"
            >
              <LayoutPanelLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={hasVideo ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setHasVideo(!hasVideo)}
              className="w-8 h-8"
              title="Toggle Video"
            >
              {hasVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>

          </div>
        </div>
      </div>

      {/* Background Layers (Smooth Crossfade) */}
      <div className={`absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden pointer-events-none transition-opacity duration-700 ease-in-out ${hasVideo ? "opacity-100" : "opacity-0"}`}>
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQT4uVhQ4-UWLyjansRslmfYSLOvbm52dImPA&s"
          alt="Video Recording"
          className="w-full h-full object-cover opacity-60"
        />
        {/* Fixed Dark Gradient Overlay for text readability (stays pinned left) */}
        <div className="absolute inset-y-0 left-0 w-[800px] bg-linear-to-r from-zinc-950/95 via-zinc-950/70 to-transparent pointer-events-none" />
      </div>

      <div className={`absolute inset-0 z-0 bg-background overflow-hidden pointer-events-none transition-opacity duration-700 ease-in-out ${!hasVideo ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute top-[-350px] left-1/2 -translate-x-1/2 w-full h-[400px] bg-linear-to-r from-sky-400/40 via-blue-400/40 to-indigo-400/40 dark:from-blue-950/60 dark:via-indigo-950/60 dark:to-slate-900/60 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      {/* Main Split Content Area */}
      <div className="flex-1 w-full relative z-10 overflow-hidden">

        {/* STATIC FIXED TOP-RIGHT AI KNOWLEDGE HUB (Visible only in Read Mode, independent of scrolling snapshots) */}
        {!hasVideo && (
          <div
            className={`absolute top-20 right-6 w-[380px] z-30 hidden lg:flex flex-col items-start text-left gap-12 select-none pr-4 transition-all duration-300 mt-20 ${rulerHoverPercent !== null ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
              }`}
          >
            {(() => {
              // Dynamically pull the currently active line and its extractions
              const currentActiveLine = displayTranscript.find(l => l.id === activeLine) || displayTranscript[0] || { speaker: "No Speaker", time: "00:00", text: "No transcript available.", intent: "None" };

              return (
                <>
                  {/* 1. Static Fixed Full Topic Hierarchy (No bg/border/shadow, pure text, perfectly left-aligned) */}
                  <div className="w-full flex flex-col items-start gap-4 text-left">
                    <div className="w-full flex items-center justify-between border-b border-border/40 pb-2 text-left">
                      <span className="text-xs font-light uppercase tracking-wider text-muted-foreground">
                        {highlightsOnly ? "Key Moments" : "Topic Map"}
                      </span>
                      {/* <span className="text-[10px] font-mono text-muted-foreground">FIXED MAP</span> */}
                    </div>

                    {/* Full Topics & Subtopics Hierarchy Tree or Key Moments */}
                    <div className="w-full flex flex-col items-start gap-6  -pl-1 ml-1 overflow-y-auto max-h-[50vh] scrollbar-thin">
                      {highlightsOnly ? (
                        (meeting?.key_moments || []).map((km, idx) => {
                           const isRisk = km.type?.toLowerCase().includes("risk");
                           return (
                              <div key={idx} onClick={() => {
                                 const lineMatch = displayTranscript.find((l: any) => km.source_ids?.includes(l.rawId));
                                 if (lineMatch) {
                                   setCurrentTime(lineMatch.timeSec);
                                   setActiveLine(lineMatch.id);
                                   scrollToLine(lineMatch.id);
                                 }
                              }} className="w-full flex flex-col items-start group/item cursor-pointer">
                                <div className={`text-xs font-semibold ${isRisk ? 'text-destructive' : 'text-yellow-500'} opacity-90 group-hover/item:opacity-100 leading-tight w-full transition-all duration-300`}>
                                  - {isRisk ? 'Risk' : 'Key Moment'} ({Math.round((km.confidence || 0.9) * 100)}%)
                                </div>
                                <div className="text-[11px] text-muted-foreground pt-1 w-full leading-relaxed ml-3 group-hover/item:text-foreground transition-colors duration-300">
                                  {km.text}
                                </div>
                              </div>
                           )
                        })
                      ) : (
                        displayTopics.map((top: any, tIdx: number) => (
                          <div key={tIdx} className="w-full flex flex-col items-start gap-3">
                            {/* Level 1 Umbrella Topic */}
                            <div className="w-full flex flex-col items-start group/item cursor-pointer">
                              <div className="text-xs dark:font-thin font-light text-foreground opacity-90 group-hover/item:text-black dark:group-hover/item:text-white group-hover/item:opacity-100 leading-tight truncate w-full transition-all duration-300">- {top.title}</div>
                              <div className="grid grid-rows-[0fr] group-hover/item:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out w-full">
                                <div className="overflow-hidden">
                                  <div className="text-[10px] text-muted-foreground pt-1 w-full leading-relaxed ml-3">
                                    {top.description}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Level 2 Subtopics */}
                            <div className="w-full flex flex-col items-start gap-2 border-l border-border/60 pl-3 ml-1">
                              {(top.sub_topics || []).map((sub: any, sIdx: number) => (
                                <div key={sIdx} className="w-full flex flex-col items-start group/subitem cursor-pointer">
                                  <div className="text-[11px] dark:font-thin font-light text-foreground opacity-90 group-hover/subitem:text-black dark:group-hover/subitem:text-white group-hover/subitem:opacity-100 leading-tight truncate w-full transition-all duration-300">- {sub.title}</div>                                <div className="grid grid-rows-[0fr] group-hover/subitem:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out w-full">
                                    <div className="overflow-hidden">
                                      <div className="text-[10px] text-muted-foreground pt-1 w-full leading-relaxed ml-2">
                                        {sub.points?.[0]?.text || sub.description}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 2. Dynamic Highlighting Extractions (No bg/border/shadow, pure text, perfectly left-aligned) */}
                  {currentActiveLine.highlight && (
                    <div className="w-full flex flex-col items-start gap-3 text-left">
                      <div className="w-full flex items-center justify-between border-b border-border/40 pb-2 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs dark:font-thin font-light uppercase tracking-wider text-muted-foreground">Active Block Info</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-foreground">CONFIDENCE: {currentActiveLine.confidence}</span>
                      </div>

                      <div className="w-full flex flex-col items-start">
                        <div className="flex items-center justify-start gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground">{currentActiveLine.speaker}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{currentActiveLine.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic line-clamp-3 leading-relaxed text-left w-full">
                          "{currentActiveLine.text}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-start gap-2 pt-1 w-full">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Intent: {currentActiveLine.intent || "Clarification"}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          Entity: {currentActiveLine.entity || "Topic"}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* LEFT PANE: Transcript Container */}
        <AnimatePresence>
          {showTranscriptPane && (
            <motion.div
              initial={{ x: -480, opacity: 0 }}
              animate={{
                opacity: 1,
                left: hasVideo ? "0%" : "50%",
                x: hasVideo ? "0%" : "-50%",
                width: hasVideo ? 600 : "100%",
                maxWidth: hasVideo ? 600 : 1536 // 1536px for expansive centered Read Mode
              }}
              exit={{ x: -480, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 bottom-0 z-20 flex flex-col bg-transparent"
            >
              {/* Transcript Scroll Area */}
              <div
                ref={scrollAreaRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto px-12 pt-20 pb-4 overflow-x-visible transition-colors ${hasVideo ? "scrollbar-thin hover:scrollbar-thumb-muted-foreground/40 scrollbar-track-transparent" : "scrollbar-none [&::-webkit-scrollbar]:hidden"}`}
                style={{
                  maskImage: "linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 120px), transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 120px), transparent 100%)"
                }}
              >
                <div className="space-y-2">
                  {/* Meeting Heading */}
                  <div className={`w-full pt-8 pb-16 mb-8 border-b border-border/10 text-center  transition-all duration-500 ease-in-out ${hasVideo ? "text-left pl-3" : "text-center"}`}>
                    <h1 className={`font-semibold tracking-tight text-foreground mb-4 transition-all duration-500 mx-auto max-w-2xl ease-in-out ${hasVideo ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl lg:text-6xl"}`}>
                      {meeting?.title || "Q3 Sprint Planning"}
                    </h1>
                    <p className={`text-muted-foreground text-lg flex items-center gap-2 transition-all duration-500 ease-in-out ${hasVideo ? "justify-start" : "justify-center"}`}>
                      {meeting?.recorded_at ? new Date(meeting.recorded_at).toLocaleDateString() : "July 14, 2026"} <span className="mx-2 opacity-50">•</span> {meeting?.participants?.length || 5} Participants
                    </p>
                  </div>

                  {hasVideo ? (
                    filteredTranscript.map((line) => {
                      const isActive = activeLine === line.id
                      const itemClass = [
                        "group flex gap-3 py-2.5 px-3 cursor-pointer transition-all duration-300 ease-out border-l-2 select-none origin-left transform",
                        isActive
                          ? "border-primary scale-105 bg-muted/10 rounded-r-lg"
                          : line.highlight
                            ? "border-white/20 scale-100"
                            : "border-transparent scale-100",
                      ].join(" ")

                      const textClass = [
                        "text-md leading-relaxed transition-colors duration-300",
                        isActive
                          ? "text-foreground"
                          : line.highlight
                            ? "text-foreground/90"
                            : "text-muted-foreground group-hover:text-foreground/80",
                      ].join(" ")

                      const intentBadgeClass = [
                        "text-[9px] font-normal border-transparent px-1.5 py-0.5 rounded-full",
                        getIntentColor(line.intent),
                      ].join(" ")

                      return (
                        <div
                          key={line.id}
                          ref={(el) => { lineRefs.current[line.id] = el }}
                          onClick={() => {
                            isAutoScrolling.current = true
                            setCurrentTime(line.timeSec)
                            setActiveLine(line.id)
                            scrollToLine(line.id)
                            setTimeout(() => { isAutoScrolling.current = false }, 800)
                          }}
                          className={itemClass}
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center  gap-2">
                              <span className="text-sm dark:text-blue-300/80 text-blue-800">
                                {line.speaker}
                              </span>

                              <div className="flex gap-1.5 shrink-0">
                                {line.slide && (
                                  <span className="text-[9px] font-mono text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <FileImage className="w-2.5 h-2.5" /> {line.slide}
                                  </span>
                                )}
                                {line.highlight && (
                                  <span className={intentBadgeClass}>
                                    {line.intent}
                                  </span>
                                )}
                                <span className=" text-sm hidden group-hover:block transition-all duration-200  font-mono text-muted-foreground ml-2 text-md">
                                  {line.time}
                                </span>
                              </div>
                            </div>
                            <p className={textClass}>{line.text}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    groupedTranscript.map((group, groupIdx) => (
                      <div key={groupIdx} className="flex items-start relative w-full pt-12 border-t border-border/10 first:border-none first:pt-0">
                        {/* Left: Sticky Photo Snapshot (Fills remaining space on the left) */}
                        <div className="flex-1 sticky top-28 self-start aspect-video overflow-hidden shadow-2xl border border-border/40 bg-muted/30 backdrop-blur-sm group flex items-center justify-center transition-all duration-500 hover:scale-[1.02] mr-8 rounded-2xl">
                          {group.docRef && group.docRef.storagePath ? (
                            <div className="w-full h-full bg-muted/10 flex flex-col items-center justify-center relative overflow-hidden group/doc">
                              <Document
                                file={`${BASE_URL}${group.docRef.storagePath}`}
                                loading={<div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground animate-pulse p-4">Loading document...</div>}
                                error={<div className="absolute inset-0 flex items-center justify-center text-xs text-destructive p-4">Failed to load document</div>}
                              >
                                <Page
                                  pageNumber={parseInt(group.docRef.page_number) || 1}
                                  width={450}
                                  renderTextLayer={false}
                                  renderAnnotationLayer={false}
                                  className="shadow-md"
                                />
                              </Document>
                              <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium text-foreground flex items-center gap-2 shadow-lg opacity-0 group-hover/doc:opacity-100 transition-opacity duration-300">
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                {group.docRef.filename || 'Document'} - Page {group.docRef.page_number || 1}
                              </div>
                            </div>
                          ) : group.docRef ? (
                            <div className="w-full h-full bg-card p-6 flex flex-col items-start text-left overflow-y-auto">
                               <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-2 w-full shrink-0">
                                  <FileText className="w-5 h-5 text-blue-500" />
                                  <h3 className="font-semibold text-sm text-foreground truncate">{group.docRef.filename || 'Document'}</h3>
                                  <span className="ml-auto text-xs font-mono bg-muted px-2 py-1 rounded-md text-muted-foreground shrink-0">Page {group.docRef.page_number || 1}</span>
                               </div>
                               <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                                 {group.docRef.snippet || group.docRef.chunk_text || "No content preview available."}
                               </p>
                            </div>
                          ) : group.image ? (
                            <img src={group.image} alt={group.slideTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/5 text-muted-foreground/30 backdrop-blur-sm border border-dashed border-border/40">
                               <VideoOff className="w-8 h-8 mb-3 opacity-20" />
                               <span className="text-xs font-mono opacity-40">No Visual Content Attached</span>
                            </div>
                          )}
                        </div>

                        {/* Middle: Transcript Text (Centered exactly like before) */}
                        <div className="w-[600px] shrink-0 space-y-2">
                          {group.lines.map((line) => {
                            const isActive = activeLine === line.id
                            const itemClass = [
                              "group flex gap-3 py-2.5 px-3 cursor-pointer transition-all duration-300 ease-out border-l-2 select-none origin-left transform",
                              isActive
                                ? "border-primary scale-105 bg-muted/10 rounded-r-lg"
                                : line.highlight
                                  ? "border-white/20 scale-100"
                                  : "border-transparent scale-100",
                            ].join(" ")

                            const textClass = [
                              "text-md leading-relaxed transition-colors duration-300",
                              isActive
                                ? "text-foreground"
                                : line.highlight
                                  ? "text-foreground/90"
                                  : "text-muted-foreground group-hover:text-foreground/80",
                            ].join(" ")

                            const intentBadgeClass = [
                              "text-[9px] font-normal border-transparent px-1.5 py-0.5 rounded-full",
                              getIntentColor(line.intent),
                            ].join(" ")

                            return (
                              <div
                                key={line.id}
                                ref={(el) => { lineRefs.current[line.id] = el }}
                                onClick={() => {
                                  isAutoScrolling.current = true
                                  setCurrentTime(line.timeSec)
                                  setActiveLine(line.id)
                                  scrollToLine(line.id)
                                  setTimeout(() => { isAutoScrolling.current = false }, 800)
                                }}
                                className={itemClass}
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm dark:text-blue-300/80 text-blue-800">
                                      {line.speaker}
                                    </span>
                                    <div className="flex gap-1.5 shrink-0">
                                      {line.slide && (
                                        <span className="text-[9px] font-mono text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                          <FileImage className="w-2.5 h-2.5" /> {line.slide}
                                        </span>
                                      )}
                                      {line.highlight && (
                                        <span className={intentBadgeClass}>
                                          {line.intent}
                                        </span>
                                      )}
                                      <span className="text-sm hidden group-hover:block transition-all duration-200 font-mono text-muted-foreground ml-2 text-md">
                                        {line.time}
                                      </span>
                                    </div>
                                  </div>
                                  <p className={textClass}>{line.text}</p>
                                </div>
                              </div>
                            )
                          })}

                        </div>

                        {/* Right: Balancing spacer to ensure the middle transcript stays perfectly centered */}
                        <div className="flex-1 ml-8 hidden lg:block" />
                      </div>
                    ))
                  )}

                  {filteredTranscript.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground text-sm italic">
                      No transcript lines match your current filters.
                    </div>
                  )}

                  {/* Premium Meeting End Banner / Padding replacement */}
                  {filteredTranscript.length > 0 && (
                    <div className="w-full h-[50vh] flex flex-col items-center justify-center gap-3 text-center border-t border-border/10  select-none pb-[10vh]">
                      <h3 className="text-lg font-bold tracking-tight text-foreground">Meeting Concluded</h3>
                      <p className="text-xs font-mono text-muted-foreground max-w-sm  py-1.5 px-4 rounded-full shadow-xs">
                        Duration: {formatTime(duration)} • Notes & Action Items synced to Notion
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>




      </div>

      {/* Fixed Vertical Ruler Progress UI (Right Side - Visible only when video is disabled) */}
      {!hasVideo && (
        <div className="fixed right-0 top-16 bottom-0 z-40 hidden xl:flex flex-col items-center gap-4 py-8 rounded-full  select-none pointer-events-auto group">

          <div
            className="relative w-24 h-full bg-none cursor-pointer flex flex-col justify-between items-end "
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const clickY = e.clientY - rect.top
              const percentage = Math.min(100, Math.max(0, (clickY / rect.height) * 100))
              setRulerHoverPercent(percentage)
            }}
            onMouseLeave={() => setRulerHoverPercent(null)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const clickY = e.clientY - rect.top
              const percentage = Math.min(1, Math.max(0, clickY / rect.height))
              const targetTime = percentage * duration
              setCurrentTime(targetTime)
              const matchedLine = [...displayTranscript]
                .reverse()
                .find((line) => targetTime >= line.timeSec)
              if (matchedLine) {
                isAutoScrolling.current = true
                setActiveLine(matchedLine.id)
                scrollToLine(matchedLine.id)
                setTimeout(() => { isAutoScrolling.current = false }, 800)
              }
            }}
          >
            {/* Hover Interactive Cursor Tracking Line & Timestamp Tooltip */}
            {rulerHoverPercent !== null && (() => {
              const hoverTime = (rulerHoverPercent / 100) * duration
              const nearbyMarker = displayMarkers.find(m => Math.abs(m.timeSec - hoverTime) < 15)
              const hoveredLine = [...displayTranscript].reverse().find(l => hoverTime >= l.timeSec) || displayTranscript[0] || { speaker: "No Speaker", text: "No transcript available." }
              const topicText = nearbyMarker ? nearbyMarker.label : `${hoveredLine.speaker}: ${hoveredLine.text}`

              return (
                <div
                  style={{ top: `${rulerHoverPercent}%` }}
                  className="absolute right-0 w-24 h-[2px] bg-foreground z-50 pointer-events-none -translate-y-1/2 flex  justify-start shadow-md"
                >
                  {/* Time Indicator like before, plus a separate div for Topic only */}
                  <div className="absolute right-20 -top-3 flex flex-col justify-start items-end gap-2 pointer-events-none">

                    <div className="bg-foreground text-background text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xl whitespace-nowrap">
                      {formatTime(hoverTime)} <span className="opacity-50">/ {formatTime(duration)}</span>
                    </div>
                    <div className=" text-foreground text-[10px] font-medium px-2.5 py-1  whitespace-nowrap max-w-xs truncate">
                      {topicText}
                    </div>
                  </div>
                </div>
              )
            })()}
            {/* Ruler Tick Marks */}
            {Array.from({ length: 129 }).map((_, i) => {
              const tickTimeStart = (i / 128) * duration
              const tickTimeEnd = ((i + 1) / 128) * duration
              const isReached = tickTimeStart <= animatedTime
              const isEighth = i % 16 === 0
              const isMajor = i % 8 === 0

              // Check if any timeline marker falls inside or near this tick mark window (15 sec vicinity)
              const matchingMarker = displayMarkers.find(m => Math.abs(m.timeSec - (tickTimeStart + tickTimeEnd) / 2) < 15)

              let markerBgClass = isReached ? "bg-foreground/90 shadow-xs" : "bg-foreground/20"
              // Show differently colored ticks in timeline for key moments vicinity
              if (matchingMarker) {
                if (matchingMarker.type === "decision") markerBgClass = "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.7)]"
                else if (matchingMarker.type === "risk") markerBgClass = "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                else if (matchingMarker.type === "action") markerBgClass = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]"
                else markerBgClass = "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]"
              }

              // Dynamic Gaussian Bell-Curve (e^-x^2) Hover Math
              const baseWidth = isMajor ? 12 : 6
              const maxWidth = isMajor ? 32 : 18
              let currentWidth = baseWidth

              if (rulerHoverPercent !== null) {
                const itemPercent = (i / 128) * 100
                const dist = Math.abs(rulerHoverPercent - itemPercent)
                const sigma = 6 // Standard deviation for smooth tail merging
                // Gaussian curve: e^(-(dist/sigma)^2)
                const factor = 2 * Math.exp(-Math.pow(dist / sigma, 2))
                currentWidth = baseWidth + (maxWidth - baseWidth) * factor
              }

              return (
                <div key={i} className="relative flex items-center justify-end w-full h-[0.5px]">
                  {isEighth && (
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none leading-none pointer-events-none">
                      {formatTime((i / 128) * duration)}
                    </span>
                  )}
                  <div
                    style={{ width: `${currentWidth}px` }}
                    className={`h-[0.5px] rounded-full transition-all duration-150 ease-out ${markerBgClass}`}
                  />
                </div>
              )
            })}

            {/* Active Progress Thumb and Floating Time Pill */}
            {/* <div
              style={{ top: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` }}
              className="absolute w-4 h-4 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.9)] left-[-5px] -translate-y-1/2 transition-all duration-300 pointer-events-none flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-ping" />

              <div className="absolute right-6 py-1 px-2.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold shadow-lg whitespace-nowrap border border-primary-foreground/20">
                {formatTime(currentTime)}
              </div>
            </div> */}
          </div>

        </div>
      )}

      {/* Playback Controls (Visible only in Read Mode at the bottom) */}
      <AnimatePresence>
        {!hasVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2  px-4 py-2  rounded-full  shadow-lg"
          >
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-muted text-foreground" onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="icon" className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-transform active:scale-95" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-muted text-foreground" onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}>
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="h-4 w-px bg-border/60 mx-1" />

            {/* <span className="text-xs font-mono text-muted-foreground w-12 text-center select-none">
              {formatTime(currentTime)}
            </span> */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Timeline (Bottom Fixed - Visible only in Video Mode) */}
      {hasVideo && (
        <div
          onMouseEnter={() => setIsTimelineHovered(true)}
          onMouseLeave={() => {
            setIsTimelineHovered(false)
            setHoveredPositionPercent(null)
          }}
          onMouseMove={handleTimelineMouseMove}
          className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-200 ease-out bg-background flex flex-col justify-end ${isTimelineHovered ? "h-4 border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.1)] dark:shadow-none" : "h-2"
            }`}
        >
          {/* The Track (No corner radius, rectangular blob style) */}
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            className={`relative w-full bg-muted cursor-pointer transition-all duration-200 ${isTimelineHovered ? "h-4" : "h-2"}`}
          >
            {/* Progress fill (sharp edges) */}
            <div
              style={{ width: `${(currentTime / duration) * 100}%` }}
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-75 rounded-none"
            />

            {/* Hover interactive dummy line */}
            {isTimelineHovered && hoveredPositionPercent !== null && (
              <div
                style={{ left: `${hoveredPositionPercent}%` }}
                className="absolute top-0 w-px h-full bg-foreground z-30 pointer-events-none"
              >
                {/* Tooltip on the dummy line */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-xs font-mono px-2 py-1 rounded shadow-md whitespace-nowrap">
                  {formatTime((hoveredPositionPercent / 100) * duration)}
                </div>
              </div>
            )}

            {/* Timeline Highlight Marker Rectangles (No glow, no radius) */}
            {isTimelineHovered && displayMarkers.map((marker, idx) => {
              const markerPercent = (marker.timeSec / duration) * 100
              return (
                <div
                  key={idx}
                  style={{ left: `${markerPercent}%` }}
                  onMouseEnter={() => setHoveredMarker(marker)}
                  onMouseLeave={() => setHoveredMarker(null)}
                  className={`absolute top-0 h-full w-1.5 transform -translate-x-1/2 cursor-pointer z-20 transition-transform hover:scale-x-150 ${getMarkerDotColor(marker.type)} rounded-none border-x border-background/20`}
                />
              )
            })}
          </div>

          {/* Hover Snapshot Preview Floating Tooltip card */}
          <AnimatePresence>
            {isTimelineHovered && hoveredMarker && hoveredPositionPercent !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{
                  left: `${(hoveredMarker.timeSec / duration) * 100}%`,
                  transform: "translateX(-50%)"
                }}
                className="absolute bottom-6 bg-background border border-border rounded-xl p-4 shadow-xl w-64 z-50 text-left space-y-2 pointer-events-none"
              >
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  {getMarkerIcon(hoveredMarker.type)}
                  <span className="text-xs font-semibold text-foreground truncate">{hoveredMarker.label}</span>
                </div>

                {hoveredMarker.type === "slide" && (
                  <div className="aspect-video w-full bg-muted rounded-md border border-border flex items-center justify-center p-2 text-center mb-2">
                    <FileImage className="w-6 h-6 text-muted-foreground opacity-60 mb-1" />
                  </div>
                )}

                <p className="text-xs leading-relaxed text-muted-foreground bg-muted/50 p-2 rounded-md border border-border/50">
                  {hoveredMarker.preview}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  )
}