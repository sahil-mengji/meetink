import { motion } from "motion/react"
import { AlertTriangle, TrendingUp, Link as LinkIcon, ShieldAlert } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

export function RiskDependencyBoardPage() {
  const getRiskColor = (sev: string, like: string) => {
    if (sev === "High" && like === "High") return "bg-destructive/20 text-destructive border-destructive"
    if (sev === "High" || like === "High") return "bg-chart-4/20 text-chart-4 border-chart-4"
    return "bg-chart-2/20 text-chart-2 border-chart-2"
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Risks & Topics Analysis</h1>
        <p className="text-muted-foreground">Cross-meeting risk register and topic evolution tracking.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left: Risk Register */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Active Risks & Dependencies</h2>
          </div>

          <div className="space-y-4">
            {RISKS.map(risk => (
              <div key={risk.id} className="bg-card border text-card-foreground shadow-sm p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${getRiskColor(risk.severity, risk.likelihood).split(' ')[1].replace('text-', 'bg-')}`} />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
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

        {/* Right: Topics Timeline */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-primary" />
               <h2 className="text-xl font-semibold text-foreground">Topic Evolution</h2>
             </div>
             <Badge variant="secondary" className="bg-muted/50 border bg-background/50">Agent Architecture</Badge>
          </div>

          <Card className="bg-card border text-card-foreground shadow-sm border-0 shadow-none relative">
            <div className="absolute inset-0 hidden opacity-5 pointer-events-none rounded-2xl" />
            <CardContent className="pt-6 relative z-10">
               <div className="relative border-l-2 border-border/50 ml-4 space-y-8 pb-4">
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

