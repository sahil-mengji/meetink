import { useState, useEffect } from "react"
import html2pdf from "html2pdf.js"
import { ArrowLeft, ExternalLink, Calendar, Users, Clock, Sparkles, Trash2, Download } from "lucide-react"
import { useNavigate, useLocation, Outlet, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchMeetingDetail, deleteMeeting, type MeetingDetail } from "@/lib/api"

// Import views
import { ActionItemWorkspacePage } from "./action-item-workspace-page"
import { DecisionsRisksPage } from "./decisions-risks-page"
import { ParticipationAnalyticsPage } from "./participation-analytics-page"
import { AgentTraceabilityPage } from "./agent-traceability-page"
import { AvatarGroup } from "./meeting-recap-viewer-page"
import { AgentChat } from "@/components/agent-chat"

export function MeetingDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const meetingId = searchParams.get("meetingId")
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (meetingId) {
      fetchMeetingDetail(meetingId).then(setMeeting).catch(console.error)
    }
  }, [meetingId])
  
  const isSubpage = location.pathname.includes("/transcript") || location.pathname.includes("/workspace")
  const isTranscriptPage = location.pathname.includes("/transcript")
  const backDestination = isSubpage ? (meetingId ? `/app/meeting-detail?meetingId=${meetingId}` : "/app/meeting-detail") : "/app"

  const displayTitle = meeting?.topics_data?.overall_topic || meeting?.title || "Q3 Roadmap Review"
  const displayDate = meeting?.recorded_at ? new Date(meeting.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Aug 12, 2024"
  const displayDuration = meeting?.duration || "45m"
  const displayParticipantsCount = meeting?.participants?.length || 6

  return (
    <div className="h-full flex flex-col w-full relative">
      {/* Top Header bar (Sticky Overlay) */}
      {!isTranscriptPage && (
        <div className={`p-6 pb-2 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-b from-sky-100/90 to-transparent dark:from-indigo-950/90 dark:to-transparent transition-all duration-300 absolute w-full top-0 left-0 z-50 ${isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(backDestination)} 
              className="shrink-0 bg-muted/50 border hover:bg-background/50 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Ready</Badge>
                <h1 className="text-xl font-bold text-foreground leading-none">{displayTitle}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {displayDate}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {displayDuration}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {displayParticipantsCount} Participants</span>
              </div>
            </div>
          </div>

          {isSubpage && (
            <div className="text-xs font-semibold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/20">
              {location.pathname.includes("/transcript") ? "Transcript" : "Workspace"}
            </div>
          )}

          <div className="flex items-center gap-2">
            {meetingId && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await deleteMeeting(meetingId)
                    navigate("/app")
                  } catch (err) {
                    console.error("Failed to delete meeting", err)
                  }
                }}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/50 shadow-sm rounded-lg text-xs h-9 px-3 gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
            <Button 
              size="sm" 
              className="border shadow-sm rounded-lg bg-primary text-primary-foreground h-9 gap-1.5"
              onClick={() => {
                const element = document.getElementById('pdf-export-content');
                if (!element) return;
                
                const opt = {
                  margin:       0.5,
                  filename:     `${meeting?.title || 'Meeting_Report'}.pdf`,
                  image:        { type: 'jpeg' as const, quality: 0.98 },
                  html2canvas:  { 
                    scale: 2, 
                    useCORS: true, 
                    windowWidth: 1200,
                    onclone: (clonedDoc: any) => {
                      const elements = clonedDoc.querySelectorAll('*');
                      elements.forEach((el: any) => {
                        const style = window.getComputedStyle(el);
                        const hasModernColor = (str: string) => {
                          return str && (str.includes('oklch') || str.includes('oklab') || str.includes('color(') || str.includes('lch(') || str.includes('lab('));
                        };
                        const cleanColor = (str: string, defaultColor: string) => {
                          if (!hasModernColor(str)) return str;
                          try {
                            const match = str.match(/(?:oklch|oklab|lch|lab)\(\s*([0-9.]+)/);
                            if (match) {
                              let L = parseFloat(match[1]);
                              if (L > 1) L = L / 100;
                              if (L > 0.85) return 'rgb(248, 250, 252)';
                              if (L > 0.6) return 'rgb(226, 232, 240)';
                              if (L > 0.3) return 'rgb(100, 116, 139)';
                              return 'rgb(15, 23, 42)';
                            }
                          } catch(e) {}
                          return defaultColor;
                        };

                        if (hasModernColor(style.backgroundColor)) {
                          el.style.backgroundColor = cleanColor(style.backgroundColor, 'rgb(255, 255, 255)');
                        }
                        if (hasModernColor(style.color)) {
                          el.style.color = cleanColor(style.color, 'rgb(15, 23, 42)');
                        }
                        if (hasModernColor(style.borderTopColor)) {
                          const bc = cleanColor(style.borderTopColor, 'rgb(226, 232, 240)');
                          el.style.borderTopColor = bc;
                          el.style.borderRightColor = bc;
                          el.style.borderBottomColor = bc;
                          el.style.borderLeftColor = bc;
                        }
                        if (hasModernColor(style.boxShadow)) {
                          el.style.boxShadow = 'none';
                        }
                        if (hasModernColor(style.textShadow)) {
                          el.style.textShadow = 'none';
                        }
                      });
                    }
                  },
                  jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
                };
                html2pdf().set(opt).from(element).save();
              }}
            >
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </div>
      )}

      <div 
        className="flex-1 overflow-hidden"
        style={!isTranscriptPage ? {
          maskImage: "linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 120px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 120px, black calc(100% - 120px), transparent 100%)"
        } : undefined}
      >
        <div 
          className="w-full h-full overflow-y-auto overflow-x-hidden"
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 100)}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function WorkspaceDetailPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const workspaceSubTab = searchParams.get("tab") || "actions"

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value })
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-6 py-2 border-b border-border/20 bg-muted/10 shrink-0">
        <Tabs value={workspaceSubTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-muted/30 border h-auto p-0.5 rounded-lg overflow-x-auto justify-start flex-nowrap w-fit">
            <TabsTrigger value="chat" className="rounded-md px-3 py-1.5 text-xs shrink-0 flex items-center gap-1.5 text-fuchsia-400 data-[state=active]:text-fuchsia-300"><Sparkles className="w-3.5 h-3.5" /> Ask AI</TabsTrigger>
            <TabsTrigger value="actions" className="rounded-md px-3 py-1.5 text-xs shrink-0">Action Items</TabsTrigger>
            <TabsTrigger value="decisions-risks" className="rounded-md px-3 py-1.5 text-xs shrink-0">Decisions & Risks</TabsTrigger>
            <TabsTrigger value="participants" className="rounded-md px-3 py-1.5 text-xs shrink-0">Participants</TabsTrigger>
            <TabsTrigger value="agent" className="rounded-md px-3 py-1.5 text-xs shrink-0">Agent Activity</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-y-auto">
        {workspaceSubTab === "chat" && <AgentChat meetingId={searchParams.get("meetingId") || undefined} className="h-full border-none rounded-none bg-transparent" />}
        {workspaceSubTab === "actions" && <ActionItemWorkspacePage />}
        {workspaceSubTab === "decisions-risks" && <DecisionsRisksPage />}
        {workspaceSubTab === "participants" && <ParticipationAnalyticsPage />}
        {workspaceSubTab === "agent" && <AgentTraceabilityPage />}
      </div>
    </div>
  )
}
