import { motion } from "motion/react"
import { AlertTriangle, CheckCircle2, History, GitMerge } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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

export function DecisionRegistryPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Decision Registry</h1>
        <p className="text-muted-foreground">A chronological log of all decisions automatically extracted by the Decision Agent.</p>
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
                <TableHead className="w-[120px] font-semibold text-foreground">Date</TableHead>
                <TableHead className="font-semibold text-foreground">Decision</TableHead>
                <TableHead className="w-[150px] font-semibold text-foreground">Topic</TableHead>
                <TableHead className="w-[150px] font-semibold text-foreground">Decided By</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DECISIONS.map((item) => (
                <TableRow key={item.id} className="group border-border/50 hover:bg-muted/30 transition-colors">
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
  )
}

