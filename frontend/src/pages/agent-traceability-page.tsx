import { motion } from "motion/react"
import { ShieldCheck, Bot, Clock, Edit3, ArrowRight, Quote, CheckCircle2 } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const AUDIT_LOGS = [
  {
    id: "A1",
    timestamp: "10:45:02 AM",
    agent: "Decision Extractor v2.4",
    action: "Extracted Decision",
    output: "Push Release to Sept 15",
    confidence: 95,
    evidence: "Sarah: 'Okay, let's make a decision right now. We will push the agent architecture release to September 15th...'",
    edits: null
  },
  {
    id: "A2",
    timestamp: "10:45:05 AM",
    agent: "Action Item Parser v1.8",
    action: "Extracted Task",
    output: "Update Jira Board",
    confidence: 98,
    evidence: "John: 'I'll take the action item to update the Jira board...'",
    edits: {
      by: "Sarah (Human)",
      time: "11:20:00 AM",
      changes: "Added 'with Sept 15 release date' to task title."
    }
  },
  {
    id: "A3",
    timestamp: "10:45:10 AM",
    agent: "Risk Identifier v3.1",
    action: "Flagged Risk",
    output: "DB Migration Block",
    confidence: 82,
    evidence: "John: 'Yes, exactly. The DB upgrade needs to happen first.'",
    edits: null
  }
]

export function AgentTraceabilityPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Agent Traceability</h1>
          </div>
          <p className="text-muted-foreground">Audit trail answering exactly which agent extracted what, and why.</p>
        </div>
        <Badge variant="outline" className="bg-muted/50 border bg-background/50 h-8 gap-2 border-border/50">
          <Bot className="w-3.5 h-3.5" /> Pipeline Status: Healthy
        </Badge>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border text-card-foreground shadow-sm p-6 rounded-3xl overflow-hidden"
      >
        <div className="rounded-xl border border-border/50 bg-background/30 bg-muted/50 border overflow-hidden">
          <Table>
            <TableHeader className="bg-background/50">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[180px] font-semibold text-foreground">Time / Agent</TableHead>
                <TableHead className="font-semibold text-foreground">Extracted Output</TableHead>
                <TableHead className="w-[300px] font-semibold text-foreground">Evidence</TableHead>
                <TableHead className="w-[200px] font-semibold text-foreground">Human Overrides</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_LOGS.map((log) => (
                <TableRow key={log.id} className="border-border/50 hover:bg-muted/30 transition-colors group">
                  <TableCell className="align-top pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Clock className="w-3 h-3" /> {log.timestamp}
                      </div>
                      <Badge variant="secondary" className="font-normal text-[10px] bg-muted/50 border bg-background/50">
                        {log.agent}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground">
                        Confidence: <span className={log.confidence > 90 ? 'text-primary' : 'text-chart-4'}>{log.confidence}%</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="align-top pt-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{log.action}</span>
                      <p className="font-medium">{log.output}</p>
                    </div>
                  </TableCell>

                  <TableCell className="align-top pt-4">
                    <div className="bg-muted/30 rounded-lg p-3 text-sm relative group-hover:bg-muted/50 transition-colors border border-border/30">
                      <Quote className="absolute top-2 left-2 w-3 h-3 text-muted-foreground/30" />
                      <p className="pl-4 italic text-muted-foreground leading-relaxed text-xs">
                        {log.evidence}
                      </p>
                      <div className="mt-2 text-[10px] font-medium text-primary cursor-pointer hover:underline flex items-center gap-1">
                        View in Transcript <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="align-top pt-4">
                    {log.edits ? (
                      <div className="space-y-2 border border-chart-4/30 bg-chart-4/5 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-chart-4">
                          <Edit3 className="w-3 h-3" /> Edited by {log.edits.by}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{log.edits.time}</p>
                        <p className="text-xs">{log.edits.changes}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Untouched
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  )
}

