import { motion } from "motion/react"
import { Users, Clock, Activity, Target } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const PARTICIPANTS = [
  { name: "Sarah (PM)", initials: "SA", role: "Organizer", talkTime: 45, balance: "High", actions: 4, score: 92 },
  { name: "John (Eng)", initials: "JO", role: "Contributor", talkTime: 30, balance: "Optimal", actions: 2, score: 88 },
  { name: "Alex (Design)", initials: "AL", role: "Contributor", talkTime: 15, balance: "Low", actions: 1, score: 75 },
  { name: "Mike (QA)", initials: "MI", role: "Observer", talkTime: 10, balance: "Low", actions: 0, score: 60 },
]

export function ParticipationAnalyticsPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" /> Participation Analytics
          </h1>
          <p className="text-muted-foreground">Team effectiveness, talk-time balance, and ownership load.</p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-card border text-card-foreground shadow-sm border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" /> Meeting Effectiveness Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-foreground text-primary">85</span>
                <span className="text-sm text-chart-2 mb-1">+5% from last week</span>
              </div>
              <Progress value={85} className="h-2 mt-4 bg-muted/50 border" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border text-card-foreground shadow-sm border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Contribution Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-foreground">Good</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">2 participants dominated 75% of the conversation.</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border text-card-foreground shadow-sm border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Action Ownership Load
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-foreground">Uneven</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Sarah owns 57% of generated action items.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Participant Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border text-card-foreground shadow-sm p-8 rounded-3xl"
      >
        <h2 className="text-xl font-semibold text-foreground mb-6">Participant Breakdown</h2>
        
        <div className="space-y-6">
          {PARTICIPANTS.map((p, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-muted/50 border p-4 rounded-2xl bg-background/30 border border-border/50">
              
              <div className="flex items-center gap-4 min-w-[200px]">
                <Avatar className="w-12 h-12 border border-border/50 bg-card border text-card-foreground shadow-sm shadow-sm">
                  <AvatarFallback className="text-primary font-semibold">{p.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Talk Time ({p.talkTime}%)</span>
                  <span className="font-medium">{p.balance}</span>
                </div>
                <div className="h-2.5 bg-background rounded-full overflow-hidden border border-border/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.talkTime}%` }}
                    transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                    className={`h-full ${p.talkTime > 40 ? 'bg-primary' : p.talkTime > 20 ? 'bg-chart-2' : 'bg-muted-foreground'}`} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 min-w-[250px] justify-end">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{p.actions}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Action Items</p>
                </div>
                
                <div className="w-px h-10 bg-border/50" />
                
                <div className="text-center">
                  <Badge variant="outline" className={`bg-muted/50 border ${p.score > 80 ? 'text-chart-2 border-chart-2/50' : 'text-muted-foreground border-border/50'} text-lg py-1 px-3`}>
                    {p.score}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Impact Score</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

