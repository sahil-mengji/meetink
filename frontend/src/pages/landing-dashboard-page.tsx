import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Plus, Search, Filter, Calendar, Users, Clock, Calendar1, CalendarRange, CheckCircle2, Sparkles, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppStore } from "@/store/app-store"
import { fetchMeetings, deleteMeeting, type MeetingListItem } from "@/lib/api"

export function LandingDashboardPage() {
  const navigate = useNavigate()
  const { setUploadDialogOpen } = useAppStore()
  const [meetings, setMeetings] = useState<MeetingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchMeetings().then(res => {
      setMeetings(res)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setError(true)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await deleteMeeting(id)
      setMeetings(meetings.filter(m => m.id !== id))
    } catch (err) {
      console.error("Failed to delete meeting", err)
    }
  }

  const displayMeetings = meetings.map(m => ({
    id: m.id,
    title: m.title || "Untitled Meeting",
    date: m.recorded_at ? new Date(m.recorded_at).toLocaleDateString() : "Today",
    duration: m.duration || "45m",
    participants: m.participants?.length || 2,
    status: m.status || "Ready",
    topics: m.tags || [],
    summary: m.summary || "Meeting recorded and fully processed.",
    type: "past"
  }))

  const displayTodos = meetings.flatMap(m => (m.action_items || []).map(a => ({
    id: a.id,
    task: a.text,
    meeting: m.title || "Meeting",
    due: a.deadline || "Upcoming"
  }))).slice(0, 5)

  const displayTopics = Array.from(new Set(meetings.flatMap(m => m.tags || []))).map((t, i) => ({
    id: "tp" + i,
    topic: t,
    count: `${meetings.filter(m => (m.tags || []).includes(t)).length} meetings`,
    trend: "Active"
  }))

  return (
    <div className="  mx-auto space-y-8">
      {/* Header section with main card */}
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
          <h1 className="text-xl font-medium text-foreground/60 ">Welcome back, <span className="text-foreground">Sarah!</span></h1>
          <p className="text-muted-foreground max-w-md font-light">
            You have {displayTodos.length} new action items from recent meetings, and everything is tracked in your memory graph.
          </p>
        </div>

        <div className=" z-10 flex flex-col sm:flex-row items-center gap-2.5 self-end mt-auto absolute right-8 bottom-8 ">
          <div className="relative w-64">
            <Search className="z-20 absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              className="h-9 pl-9 text-xs rounded-lg bg-background/50 border-border/50 bg-muted/50 border backdrop-blur-sm"
            />
          </div>
          <Button
            className="bg-card border text-card-foreground shadow-sm rounded-lg h-9 px-4 text-xs font-medium gap-1.5"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Upload Meeting
          </Button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8"
      >
        {/* Left Column: Meetings List */}
        <div className="lg:col-span-2 space-y-6 p-6 md:p-8  rounded-3xl">
          <Tabs defaultValue="all" className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <CalendarRange className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-medium text-foreground">Your Meetings</h2>
              </div>
              <TabsList className="bg-muted/50 border p-1 h-auto self-start sm:self-center">
                <TabsTrigger value="all" className="rounded-md px-4 py-2 text-xs font-medium">All Meetings</TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-md px-4 py-2 text-xs font-medium">Upcoming</TabsTrigger>
                <TabsTrigger value="past" className="rounded-md px-4 py-2 text-xs font-medium">Past</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4">
              {loading && (
                <div className="space-y-4">
                  <Skeleton className="h-28 w-full rounded-2xl bg-muted/60" />
                  <Skeleton className="h-28 w-full rounded-2xl bg-muted/60" />
                  <Skeleton className="h-28 w-full rounded-2xl bg-muted/60" />
                </div>
              )}
              {error && (
                <div className="p-8 text-center text-sm text-destructive font-medium border border-destructive/20 rounded-2xl bg-destructive/10">
                  Failed to fetch meetings. Please check your backend connection.
                </div>
              )}
              {!loading && !error && displayMeetings.length === 0 && (
                <div className="p-12 text-center text-sm text-muted-foreground border border-border/50 rounded-2xl bg-muted/20">
                  No meetings captured yet. Click "Upload Meeting" above to get started.
                </div>
              )}
              {!loading && !error && displayMeetings.map((meeting, i) => (
                <React.Fragment key={meeting.id}>
                  <div className="bg-linear-to-r from-transparent via-foreground/20 to-transparent w-full h-px"></div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/meeting-detail?meetingId=${meeting.id}`)}
                    className=" text-card-foreground  rounded-2xl  cursor-pointer  hover:scale-[1.01] transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  >
                    <div className="space-y-2 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg text-foreground">{meeting.title}</h3>
                        {meeting.status === "Processing" && (
                          <Badge variant="outline" className="animate-pulse border-primary/50 text-primary">Processing</Badge>
                        )}
                        {meeting.status === "Scheduled" && (
                          <Badge variant="outline" className="border-chart-2/50 text-chart-2">Scheduled</Badge>
                        )}
                        {meeting.status !== "Processing" && meeting.status !== "Scheduled" && (
                          <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">{meeting.status}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {meeting.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {meeting.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {meeting.duration}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {meeting.participants}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="flex gap-1.5">
                        {meeting.topics.map(topic => (
                          <Badge key={topic} variant="secondary" className="bg-muted/50 border border-foreground/5 font-normal text-xs">{topic}</Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, meeting.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                </React.Fragment>
              ))}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {loading && <Skeleton className="h-28 w-full rounded-2xl bg-muted/60" />}
              {!loading && displayMeetings.filter(m => m.type === "upcoming").length === 0 && (
                <div className="p-12 text-center text-sm text-muted-foreground border border-border/50 rounded-2xl bg-muted/20">
                  No upcoming meetings scheduled.
                </div>
              )}
              {displayMeetings.filter(m => m.type === "upcoming").map((meeting, i) => (
                <React.Fragment key={meeting.id}>
                  <div className="bg-linear-to-r from-transparent via-foreground/20 to-transparent w-full h-px"></div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/meeting-detail?meetingId=${meeting.id}`)}
                    className=" text-card-foreground  rounded-2xl  cursor-pointer  hover:scale-[1.01] transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  >
                    <div className="space-y-2 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg text-foreground">{meeting.title}</h3>
                        <Badge variant="outline" className="border-chart-2/50 text-chart-2">Scheduled</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {meeting.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {meeting.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {meeting.duration}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {meeting.participants}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="flex gap-1.5">
                        {meeting.topics.map(topic => (
                          <Badge key={topic} variant="secondary" className="bg-muted/50 border border-foreground/5 font-normal text-xs">{topic}</Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, meeting.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                </React.Fragment>
              ))}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {loading && <Skeleton className="h-28 w-full rounded-2xl bg-muted/60" />}
              {!loading && displayMeetings.filter(m => m.type === "past").length === 0 && (
                <div className="p-12 text-center text-sm text-muted-foreground border border-border/50 rounded-2xl bg-muted/20">
                  No past meetings found.
                </div>
              )}
              {displayMeetings.filter(m => m.type === "past").map((meeting, i) => (
                <React.Fragment key={meeting.id}>
                  <div className="bg-linear-to-r from-transparent via-foreground/20 to-transparent w-full h-px"></div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/meeting-detail?meetingId=${meeting.id}`)}
                    className=" text-card-foreground  rounded-2xl  cursor-pointer  hover:scale-[1.01] transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  >
                    <div className="space-y-2 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg text-foreground">{meeting.title}</h3>
                        {meeting.status === "Processing" ? (
                          <Badge variant="outline" className="animate-pulse border-primary/50 text-primary">Processing</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">{meeting.status}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {meeting.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {meeting.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {meeting.duration}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {meeting.participants}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="flex gap-1.5">
                        {meeting.topics.map(topic => (
                          <Badge key={topic} variant="secondary" className="bg-muted/50 border border-foreground/5 font-normal text-xs">{topic}</Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, meeting.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                </React.Fragment>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-8">
          {/* Todos Block */}
          <div className="space-y-6 p-6 md:p-8 rounded-3xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-medium text-foreground">Todos</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/app/action-workspace")} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-xl bg-muted/60" />
                  <Skeleton className="h-12 w-full rounded-xl bg-muted/60" />
                </div>
              )}
              {!loading && displayTodos.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No pending action items.
                </div>
              )}
              {!loading && displayTodos.map((todo, i) => (
                <React.Fragment key={todo.id}>
                  <div className="bg-linear-to-r from-transparent via-foreground/20 to-transparent w-full h-px"></div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-card-foreground rounded-2xl cursor-pointer hover:scale-[1.01] transition-all flex items-start justify-between gap-4 py-2"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-foreground">{todo.task}</p>
                      <p className="text-xs text-muted-foreground">{todo.meeting}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-foreground/20 text-muted-foreground whitespace-nowrap">{todo.due}</Badge>
                  </motion.div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Track Topics Block */}
          <div className="space-y-6 p-6 md:p-8 rounded-3xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-medium text-foreground">Track Topics</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/app/knowledge-library")} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-xl bg-muted/60" />
                  <Skeleton className="h-12 w-full rounded-xl bg-muted/60" />
                </div>
              )}
              {!loading && displayTopics.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No active topics found.
                </div>
              )}
              {!loading && displayTopics.map((item, i) => (
                <React.Fragment key={item.id}>
                  <div className="bg-linear-to-r from-transparent via-foreground/20 to-transparent w-full h-px"></div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-card-foreground rounded-2xl cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between gap-4 py-2"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-foreground">{item.topic}</p>
                      <p className="text-xs text-muted-foreground">{item.count}</p>
                    </div>
                    <Badge variant="secondary" className="bg-muted/50 border border-foreground/5 font-normal text-xs whitespace-nowrap">{item.trend}</Badge>
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


