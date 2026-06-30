import React, { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { Calendar, Bot, Send, MoreHorizontal, AlertCircle, CheckCircle2, CheckSquare, Kanban, GitPullRequest, Bookmark, ListTodo, Network, Activity } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { fetchMeetingDetail, dispatchMeetingSummaries, type MeetingDetail, BASE_URL } from "@/lib/api"

export function ActionItemWorkspacePage() {
  const [view, setView] = useState<"kanban" | "list">("list")
  const [searchParams] = useSearchParams()
  const meetingId = searchParams.get("meetingId")
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null)
  const [liveActions, setLiveActions] = useState<any[]>([])
  const [dispatchingSummaries, setDispatchingSummaries] = useState(false)
  const [dispatchedList, setDispatchedList] = useState<{ participant: string; email: string; status: string }[] | null>(null)

  useEffect(() => {
    if (meetingId) {
      fetchMeetingDetail(meetingId).then(setMeeting).catch(console.error)
    }
    Promise.all([
      fetch(`${BASE_URL}/integrations/tasks`).then(res => res.json()).catch(() => []),
      fetch(`${BASE_URL}/integrations/linear`).then(res => res.json()).catch(() => [])
    ]).then(([tasks, linearIssues]) => {
      const merged: any[] = [];
      if (Array.isArray(tasks)) merged.push(...tasks);
      if (Array.isArray(linearIssues)) merged.push(...linearIssues);
      setLiveActions(merged);
    }).catch(console.error);
  }, [meetingId])

  const displayActionItems = useMemo(() => {
    if (meeting?.action_items && meeting.action_items.length > 0) {
      return meeting.action_items.map((a, idx) => ({
        id: `ACT-${idx + 1}`,
        task: a.text || "Untitled Task",
        owner: a.owner && typeof a.owner === "object" ? ((a.owner as any).name || "Owner") : (a.owner || "Owner"),
        dueDate: a.deadline || "Soon",
        confidence: a.confidence ? Math.round(a.confidence > 1 ? a.confidence : a.confidence * 100) : 95,
        status: idx % 3 === 0 ? "To Do" : idx % 3 === 1 ? "In Progress" : "To Verify",
        sourceAgent: "Action Extractor v2",
        platform: idx % 4 === 0 ? "Jira" : idx % 4 === 1 ? "Google Tasks" : idx % 4 === 2 ? "Linear" : "GitHub",
        project: "PROG",
        priority: idx % 2 === 0 ? "High" : "Medium"
      }))
    }
    return liveActions
  }, [meeting, liveActions])

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case "Jira": return "border-blue-500/50 text-blue-500 bg-blue-500/10"
      case "Google Tasks": return "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
      case "Linear": return "border-purple-500/50 text-purple-500 bg-purple-500/10"
      case "GitHub": return "border-amber-500/50 text-amber-500 bg-amber-500/10"
      default: return "border-rose-500/50 text-rose-500 bg-rose-500/10"
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Jira": return <Kanban className="w-3 h-3" />
      case "Google Tasks": return <CheckSquare className="w-3 h-3" />
      case "Linear": return <Bookmark className="w-3 h-3" />
      case "GitHub": return <GitPullRequest className="w-3 h-3" />
      default: return <CheckCircle2 className="w-3 h-3" />
    }
  }

  return (
    <div className="mx-auto space-y-8">
      {/* Header section matching LandingDashboardPage aesthetic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-card-foreground p-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative overflow-hidden min-h-[160px]"
      >
        {/* Absolute background layer with inner shadow and glowing blob, masked to fade into bg towards left */}
        <div
          className="absolute inset-0 bg-card/40 backdrop-blur-md shadow-[inset_-20px_-20px_20px_rgba(0,0,0,0.1)] pointer-events-none"
          style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)' }}
        >
          {/* Background glowing blob div from bottom right corner */}
          <div className="rounded-[50%] absolute right-[-50%] bottom-[-50%] w-[120%] h-full bg-sky-500/20 blur-[80px] pointer-events-none" />
        </div>

        <div className="relative z-10 space-y-2 text-center md:text-left">
          <h1 className="text-xl font-medium text-foreground/60">Action Items <span className="text-foreground">Workspace</span></h1>
          <p className="text-muted-foreground max-w-md font-light">
            Manage and dispatch tasks synced across Jira, Google Tasks, Linear, GitHub, and Todoist.
          </p>
        </div>

        <div className="z-10 flex flex-col sm:flex-row items-center gap-2.5 self-end mt-auto absolute right-8 bottom-8">
          <div className="bg-muted/50 border border-border/50 text-card-foreground shadow-sm rounded-lg p-1 flex backdrop-blur-sm">
             <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")} className="rounded-md text-xs font-medium px-3 py-1.5 h-auto">List View</Button>
             <Button variant={view === "kanban" ? "secondary" : "ghost"} size="sm" onClick={() => setView("kanban")} className="rounded-md text-xs font-medium px-3 py-1.5 h-auto">Kanban Board</Button>
          </div>
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
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg h-9 px-4 text-xs font-medium gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> {dispatchingSummaries ? "Dispatching..." : "Dispatch Summaries to Participants"}
          </Button>
        </div>
      </motion.div>

      {dispatchedList && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-8 p-6 bg-card border border-emerald-500/30 rounded-3xl shadow-sm space-y-4 relative overflow-hidden"
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
                <Avatar className="w-9 h-9 border border-background shadow-xs">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{d.participant.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
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

      {/* Main Content Area matching LandingDashboardPage grid layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8"
      >
        {/* Left Column: Tasks List / Kanban */}
        <div className="lg:col-span-2 space-y-6 p-6 md:p-8 rounded-3xl">
          {view === "list" ? (
            <Tabs defaultValue="all" className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <ListTodo className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-medium text-foreground">Cross-Space Tasks</h2>
                </div>
                <TabsList className="bg-muted/50 border p-1 h-auto self-start sm:self-center">
                  <TabsTrigger value="all" className="rounded-md px-4 py-2 text-xs font-medium">All Tasks</TabsTrigger>
                  <TabsTrigger value="todo" className="rounded-md px-4 py-2 text-xs font-medium">To Do</TabsTrigger>
                  <TabsTrigger value="inprogress" className="rounded-md px-4 py-2 text-xs font-medium">In Progress</TabsTrigger>
                  <TabsTrigger value="verify" className="rounded-md px-4 py-2 text-xs font-medium">To Verify</TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              {[
                { tab: "all", filterFn: () => true },
                { tab: "todo", filterFn: (item: any) => item.status === "To Do" },
                { tab: "inprogress", filterFn: (item: any) => item.status === "In Progress" },
                { tab: "verify", filterFn: (item: any) => item.status === "To Verify" },
              ].map(({ tab, filterFn }) => (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {displayActionItems.filter(filterFn).map((item, i) => (
                    <React.Fragment key={item.id}>
                      <div className="bg-linear-to-r from-transparent via-foreground/20 to-transparent w-full h-px"></div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-card-foreground rounded-2xl cursor-pointer hover:scale-[1.01] transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between py-2"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs gap-1 py-0.5 px-2 ${getPlatformBadgeColor(item.platform)}`}>
                              {getPlatformIcon(item.platform)} {item.id}
                            </Badge>
                            <h3 className="font-medium text-lg text-foreground">{item.task}</h3>
                            {item.confidence < 80 && (
                              <Badge variant="outline" className="text-[10px] border-chart-4/50 text-chart-4 bg-chart-4/10 gap-1">
                                <AlertCircle className="w-3 h-3" /> Verify
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Avatar className="w-4 h-4 border border-border/50">
                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{item.owner.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {item.owner}
                            </span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due: {item.dueDate}</span>
                            <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> {item.sourceAgent} ({item.confidence}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-muted/50 border border-foreground/5 font-normal text-xs">{item.status}</Badge>
                          <Badge variant="outline" className="border-foreground/20 text-muted-foreground text-xs">{item.priority}</Badge>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <Kanban className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-medium text-foreground">Kanban Board</h2>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4">
                {["To Verify", "To Do", "In Progress", "Done"].map((column) => {
                  const items = displayActionItems.filter(item => item.status === column)

                  return (
                    <div key={column} className="flex-1 min-w-[280px] flex flex-col gap-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          {column} <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{items.length}</span>
                        </h3>
                      </div>

                      <div className="flex-1 bg-background/20 border border-foreground/5 rounded-3xl p-4 space-y-4 min-h-[400px] backdrop-blur-sm">
                        {items.map((item, i) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={item.id}
                            className="bg-card border border-foreground/10 text-card-foreground shadow-sm p-4 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform group space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${getPlatformBadgeColor(item.platform)} gap-1`}>
                                {getPlatformIcon(item.platform)} {item.id}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>

                            <p className="text-sm font-medium leading-snug">{item.task}</p>

                            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="w-5 h-5 border border-border/50">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{item.owner.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{item.dueDate}</span>
                              </div>
                              <div className="flex items-center gap-1" title={`Extracted by ${item.sourceAgent}`}>
                                <Bot className="w-3 h-3" /> {item.confidence}%
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {items.length === 0 && (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic border-2 border-dashed border-border/30 rounded-2xl m-2 p-8">
                            Drop items here
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Widgets matching LandingDashboardPage side blocks */}
        <div className="space-y-8">
          {/* Platforms Block */}
          <div className="space-y-6 p-6 md:p-8 rounded-3xl">
            <div className="flex items-center gap-2.5">
              <Network className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-medium text-foreground">Synced Spaces</h2>
            </div>
            <div className="space-y-4">
              {[
                { id: "p1", platform: "Jira", count: "2 active tickets", status: "Synced 2m ago", color: "text-blue-500" },
                { id: "p2", platform: "Google Tasks", count: "1 active task", status: "Synced 5m ago", color: "text-emerald-500" },
                { id: "p3", platform: "Linear", count: "1 active issue", status: "Realtime", color: "text-purple-500" },
                { id: "p4", platform: "GitHub", count: "1 active PR", status: "Realtime", color: "text-amber-500" },
                { id: "p5", platform: "Todoist", count: "1 pending task", status: "Synced 10m ago", color: "text-rose-500" },
              ].map((item, i) => (
                <React.Fragment key={item.id}>
                  <div className="bg-linear-to-r from-transparent via-foreground/20 to-transparent w-full h-px"></div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-card-foreground rounded-2xl cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between gap-4 py-2"
                  >
                    <div className="space-y-1">
                      <p className={`font-medium text-sm ${item.color}`}>{item.platform}</p>
                      <p className="text-xs text-muted-foreground">{item.count}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-foreground/20 text-muted-foreground whitespace-nowrap">{item.status}</Badge>
                  </motion.div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* AI Extractors Block */}
          <div className="space-y-6 p-6 md:p-8 rounded-3xl">
            <div className="flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-medium text-foreground">AI Extractors</h2>
            </div>
            <div className="space-y-4">
              {[
                { id: "e1", agent: "Action Extractor v2", confidence: "95% avg confidence", status: "Active" },
                { id: "e2", agent: "Security Bot", confidence: "95% confidence", status: "Active" },
                { id: "e3", agent: "Tech Lead Agent", confidence: "85% confidence", status: "Standby" },
              ].map((item, i) => (
                <React.Fragment key={item.id}>
                  <div className="bg-linear-to-r from-transparent via-foreground/20 to-transparent w-full h-px"></div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-card-foreground rounded-2xl cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between gap-4 py-2"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-foreground">{item.agent}</p>
                      <p className="text-xs text-muted-foreground">{item.confidence}</p>
                    </div>
                    <Badge variant="secondary" className="bg-muted/50 border border-foreground/5 font-normal text-xs whitespace-nowrap">{item.status}</Badge>
                  </motion.div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

