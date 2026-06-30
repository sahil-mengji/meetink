import { motion } from "motion/react"
import { AlertTriangle, CheckCircle2, History, GitMerge, ShieldAlert, TrendingUp, Link as LinkIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

const DECISIONS = [
  {
    id: "d1",
    date: "Aug 12, 2024",
    meeting: "Q3 Roadmap Review",
    decision: "Push Agent Architecture release to Sept 15",
    topic: "Release Timeline",
    decidedBy: "Sarah",
    confidence: 95,
    status: "Active",
    alternatives: "Launch Aug 30th with risk of DB instability.",
    reversalFlag: false
  },
  {
    id: "d2",
    date: "Aug 05, 2024",
    meeting: "Engineering Sync",
    decision: "Migrate to PostgreSQL 16 before new UI launch",
    topic: "Infrastructure",
    decidedBy: "John",
    confidence: 100,
    status: "Active",
    alternatives: "Delay migration until Q4.",
    reversalFlag: false
  },
  {
    id: "d3",
    date: "Jul 20, 2024",
    meeting: "Product Strategy",
    decision: "Use Tailwind instead of Vanilla CSS for v2",
    topic: "Frontend Stack",
    decidedBy: "Alex",
    confidence: 85,
    status: "Reversed",
    alternatives: "Stick with SCSS modules.",
    reversalFlag: true,
    reversedBy: "Jul 28 UI Sync"
  }
]

const RISKS = [
  { id: "R1", title: "DB Migration Blocks Agent Release", severity: "High", likelihood: "High", owner: "John D.", status: "Open", dependencies: ["R2"] },
  { id: "R2", title: "PostgreSQL 16 Compatibility Issues", severity: "High", likelihood: "Medium", owner: "Alex", status: "Mitigated", dependencies: [] },
  { id: "R3", title: "Marketing Campaign Misalignment", severity: "Medium", likelihood: "Low", owner: "Sarah", status: "Open", dependencies: ["R1"] },
]

const TOPIC_TIMELINE = [
  { id: 1, topic: "Agent Architecture", meeting: "Q3 Roadmap", date: "Aug 12", sentiment: "Neutral", unresolved: 2 },
  { id: 2, topic: "Agent Architecture", meeting: "Eng Sync", date: "Aug 05", sentiment: "Positive", unresolved: 1 },
  { id: 3, topic: "Agent Architecture", meeting: "Strategy", date: "Jul 20", sentiment: "Negative", unresolved: 3 },
]

export function DecisionsRisksPage() {
  const getRiskColor = (sev: string, like: string) => {
    if (sev === "High" && like === "High") return "bg-destructive/20 text-destructive border-destructive"
    if (sev === "High" || like === "High") return "bg-chart-4/20 text-chart-4 border-chart-4"
    return "bg-chart-2/20 text-chart-2 border-chart-2"
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      
      {/* Decisions Registry Section */}
      <div className="space-y-6">
        <div className="flex flex-col space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Decision Registry</h2>
          <p className="text-sm text-muted-foreground">Chronological log of decisions automatically extracted by the Decision Agent.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border text-card-foreground shadow-xs p-6 rounded-3xl overflow-hidden"
        >
          <div className="rounded-2xl border border-border/50 bg-background/30 bg-muted/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-background/50">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[120px] font-semibold text-foreground">Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Decision</TableHead>
                  <TableHead className="w-[150px] font-semibold text-foreground">Topic</TableHead>
                  <TableHead className="w-[150px] font-semibold text-foreground">Decided By</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DECISIONS.map((item) => (
                  <TableRow key={item.id} className="group border-border/50 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground align-top pt-4">
                      {item.date}
                    </TableCell>
                    <TableCell className="align-top pt-4 pb-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <span className={`font-medium ${item.reversalFlag ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.decision}
                          </span>
                          {item.reversalFlag && (
                             <Badge variant="outline" className="shrink-0 bg-muted/50 border text-destructive border-destructive/30 gap-1 text-[10px]">
                               <History className="w-3 h-3" /> Reversed in {item.reversedBy}
                             </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground border-l-2 border-border/50 pl-3">
                          <span className="font-semibold text-foreground mr-1">Alternatives considered:</span> 
                          {item.alternatives}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <GitMerge className="w-3 h-3" /> Extracted from: <span className="underline decoration-border underline-offset-2 cursor-pointer hover:text-primary">{item.meeting}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top pt-4">
                      <Badge variant="secondary" className="font-normal bg-background/50">{item.topic}</Badge>
                    </TableCell>
                    <TableCell className="align-top pt-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6 border border-border/50">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{item.decidedBy.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{item.decidedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top pt-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border bg-background/50">
                        {item.confidence > 90 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-chart-4" />
                        )}
                        <span className="text-xs font-mono">{item.confidence}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>

      {/* Risks and Topics section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-4">
        
        {/* Left: Risk Register */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              <h2 className="text-2xl font-bold text-foreground">Active Risks & Dependencies</h2>
            </div>
            <p className="text-sm text-muted-foreground">Cross-meeting risk register and technical dependencies.</p>
          </div>

          <div className="space-y-4">
            {RISKS.map(risk => (
              <div key={risk.id} className="bg-card border text-card-foreground shadow-xs p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${getRiskColor(risk.severity, risk.likelihood).split(' ')[1].replace('text-', 'bg-')}`} />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      {risk.id}: {risk.title}
                    </h3>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Owner: <span className="text-foreground">{risk.owner}</span></span>
                      <span>Status: <span className="text-foreground">{risk.status}</span></span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`bg-muted/50 border ${getRiskColor(risk.severity, risk.likelihood)} border-transparent`}>
                    {risk.severity} Sev × {risk.likelihood} Prob
                  </Badge>
                </div>

                {risk.dependencies.length > 0 && (
                  <div className="bg-background/40 bg-muted/50 border rounded-lg p-3 text-sm flex items-start gap-2 border border-border/50">
                    <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Dependencies: </span>
                      <span className="text-muted-foreground">Blocked by {risk.dependencies.join(", ")}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Topics Evolution */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-6"
        >
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-primary" />
                 <h2 className="text-2xl font-bold text-foreground">Topic Evolution</h2>
               </div>
               <Badge variant="secondary" className="bg-muted/50 border bg-background/50">Agent Architecture</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Evolution of core discussion topics and associated sentiments.</p>
          </div>

          <Card className="bg-card border text-card-foreground shadow-xs border-0 shadow-none relative">
            <CardContent className="p-0 relative z-10">
               <div className="relative border-l-2 border-border/50 ml-4 space-y-6 pb-4">
                 {TOPIC_TIMELINE.map((item) => (
                   <div key={item.id} className="relative pl-6">
                     {/* Timeline Dot */}
                     <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary bg-muted/50 border z-10" />
                     
                     <div className="bg-muted/50 border bg-background/30 rounded-xl p-4 border border-border/50 group hover:border-primary/50 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                         <div>
                           <h4 className="font-semibold text-base">{item.meeting}</h4>
                           <p className="text-xs text-muted-foreground">{item.date}</p>
                         </div>
                         <Badge variant="outline" className={`text-[10px] ${
                           item.sentiment === 'Positive' ? 'text-chart-2 border-chart-2/30' :
                           item.sentiment === 'Negative' ? 'text-destructive border-destructive/30' :
                           'text-muted-foreground border-border'
                         }`}>
                           {item.sentiment} Sentiment
                         </Badge>
                       </div>
                       
                       {item.unresolved > 0 && (
                         <div className="mt-3 flex items-center gap-1.5 text-xs text-chart-4 bg-chart-4/10 px-2 py-1 rounded w-fit">
                           <AlertTriangle className="w-3 h-3" />
                           {item.unresolved} unresolved follow-ups carried forward
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </div>
  )
}
