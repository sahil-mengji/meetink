import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2, Circle, Loader2, ArrowRight } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

const PIPELINE_STAGES = [
  { id: "upload", label: "Uploading", desc: "Transferring media to server" },
  { id: "transcribe", label: "Transcribing", desc: "Converting speech to text" },
  { id: "diarize", label: "Diarizing", desc: "Clustering speaker segments" },
  { id: "agents", label: "Agents Analysis", desc: "Extracting decisions & action items" },
  { id: "index", label: "Indexing", desc: "Building vector search index" },
  { id: "ready", label: "Ready", desc: "Meeting is ready for review" },
]

export function AnalysisProgressPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingId = searchParams.get("meetingId")
  const [currentStageIndex, setCurrentStageIndex] = useState(1) // Start at transcribing for demo
  const [progressValue, setProgressValue] = useState(15)

  // Simulate progress
  useEffect(() => {
    if (currentStageIndex >= PIPELINE_STAGES.length - 1) return

    const timer = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          setCurrentStageIndex(curr => Math.min(curr + 1, PIPELINE_STAGES.length - 1))
          return 0
        }
        return prev + Math.random() * 15
      })
    }, 1200)

    return () => clearInterval(timer)
  }, [currentStageIndex])

  const isComplete = currentStageIndex === PIPELINE_STAGES.length - 1
  const overallProgress = ((currentStageIndex + (progressValue / 100)) / (PIPELINE_STAGES.length - 1)) * 100

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-12">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground">Processing Meeting...</h1>
        <p className="text-muted-foreground">"Q3 Roadmap Review" is currently being analyzed by our agent pipeline.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border text-card-foreground shadow-sm p-8 md:p-12 rounded-3xl space-y-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 hidden opacity-10 pointer-events-none" />
        
        {/* Overall Progress */}
        <div className="space-y-4 relative z-10">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-muted-foreground">Overall Pipeline Progress</span>
            <span className="text-2xl font-bold text-foreground">{Math.min(100, Math.round(overallProgress))}%</span>
          </div>
          <div className="h-4 bg-muted/50 border rounded-full overflow-hidden p-0.5">
            <motion.div 
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, overallProgress)}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* Stepper */}
        <div className="relative z-10 space-y-6">
          {PIPELINE_STAGES.map((stage, index) => {
            const isPast = index < currentStageIndex
            const isCurrent = index === currentStageIndex
            const isFuture = index > currentStageIndex

            return (
              <motion.div 
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex gap-4 items-start ${isFuture ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-card text-card-foreground shadow-sm border ${
                    isPast ? 'text-primary border-primary/50' : 
                    isCurrent ? 'text-foreground border-border animate-pulse' : 
                    'text-muted-foreground border-transparent'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : 
                     isCurrent ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                     <Circle className="w-5 h-5" />}
                  </div>
                  {index < PIPELINE_STAGES.length - 1 && (
                    <div className={`w-0.5 h-10 mt-2 ${isPast ? 'bg-primary/50' : 'bg-muted/50'}`} />
                  )}
                </div>
                
                <div className="flex-1 pt-1.5 pb-6">
                  <h3 className={`font-semibold text-lg ${isCurrent ? 'text-foreground' : ''}`}>{stage.label}</h3>
                  <p className="text-sm text-muted-foreground">{stage.desc}</p>
                  
                  <AnimatePresence>
                    {isCurrent && index < PIPELINE_STAGES.length - 1 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <Progress value={progressValue} className="h-2 w-full max-w-sm bg-muted/50 border" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Partial Results Unlocked Preview */}
                  {isPast && index === 1 && (
                     <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => navigate(meetingId ? `/app/transcript-viewer?meetingId=${meetingId}` : "/app/transcript-viewer")}>
                        Preview Raw Transcript <ArrowRight className="w-3 h-3" />
                     </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Completion Action */}
      <AnimatePresence>
        {isComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <Button 
              size="lg" 
              className="shadow-sm rounded-xl h-14 px-8 text-lg hover:scale-105 transition-transform bg-primary text-primary-foreground"
              onClick={() => navigate(meetingId ? `/app/meeting-detail?meetingId=${meetingId}` : "/app/meeting-detail")}
            >
              View Full Meeting Recap
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

