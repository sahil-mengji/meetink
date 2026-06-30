import React, { useState, useEffect, useRef, useLayoutEffect } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { UploadCloud, Paperclip, Users, Tag, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/store/app-store"

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0);

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={{
            enter: (dir: number) => ({
              x: dir > 0 ? '100%' : '-100%',
              opacity: 0,
            }),
            center: {
              x: 0,
              opacity: 1,
            },
            exit: (dir: number) => ({
              x: dir < 0 ? '100%' : '-100%',
              opacity: 0,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          style={{ width: '100%' }}
        >
          <StepContentMeasure onHeightChange={setParentHeight}>
            {children}
          </StepContentMeasure>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function StepContentMeasure({
  onHeightChange,
  children,
}: {
  onHeightChange: (height: number) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      onHeightChange(entry.contentRect.height);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <div ref={ref} style={{ display: 'flow-root' }}>
      {children}
    </div>
  );
}

function Step({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
}: {
  step: number;
  currentStep: number;
  onClickStep: (step: number) => void;
}) {
  const status =
    currentStep === step
      ? 'active'
      : currentStep < step
        ? 'inactive'
        : 'complete';

  const handleClick = () => {
    onClickStep(step);
  };

  return (
    <motion.div
      onClick={handleClick}
      className="relative cursor-pointer group flex items-center justify-center w-9 h-9 rounded-full font-semibold text-xs transition-colors"
      animate={status}
      initial={false}
      variants={{
        inactive: {
          backgroundColor: 'var(--color-muted)',
          color: 'var(--color-muted-foreground)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
        },
        active: {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
          borderColor: 'var(--color-primary)',
          borderWidth: '1px',
        },
        complete: {
          backgroundColor: 'var(--color-emerald-500)',
          color: 'var(--color-white)',
          borderColor: 'var(--color-emerald-500)',
          borderWidth: '1px',
        },
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20"
        variants={{
          inactive: { opacity: 0, scale: 0.8 },
          active: { opacity: 1, scale: 1.2 },
          complete: { opacity: 0, scale: 1 },
        }}
        transition={{ duration: 0.3 }}
      />
      <span className="relative z-10">
        {status === 'complete' ? (
          <motion.svg
            className="w-4 h-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        ) : (
          step
        )}
      </span>
    </motion.div>
  );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  return (
    <svg
      className="w-8 h-2 mx-1 fill-none"
      viewBox="0 0 32 8"
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1="4"
        x2="32"
        y2="4"
        stroke="var(--color-border)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <motion.line
        x1="0"
        y1="4"
        x2="32"
        y2="4"
        stroke="var(--color-emerald-500)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isComplete ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />
    </svg>
  );
}

export function MeetingUploadDialog() {
  const navigate = useNavigate()
  const { uploadDialogOpen, setUploadDialogOpen, setPendingFile, setPendingAttachments } = useAppStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<number>(0)
  
  const [attachments, setAttachments] = useState<File[]>([])

  const [filename, setFilename] = useState<string>("")
  const [isAudioMeeting, setIsAudioMeeting] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [customLoadingMsg, setCustomLoadingMsg] = useState<string>("")

  useEffect(() => {
    if (uploadDialogOpen) {
      setCurrentStep(1)
      setDirection(0)
      setFilename("")
      setIsAudioMeeting(false)
      setLoading(false)
      setCustomLoadingMsg("")
      setAttachments([])
    }
  }, [uploadDialogOpen])

  const handleUpload = async () => {
    setPendingAttachments(attachments)
    setUploadDialogOpen(false)
    navigate(`/app/processing-flow?type=${isAudioMeeting ? 'audio' : 'vtt'}`)
  }

  const handleNext = () => {
    if (currentStep < 2) {
      setDirection(1)
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep(currentStep - 1)
    }
  }

  const stepsContent = [
    <Step key="step1">
      <div className="space-y-6 py-4">
        <div className="border-2 border-dashed border-border/60 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden">
          <input
            type="file"
            accept=".vtt,.srt,.txt,audio/*,video/*"
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi|wmv|flv)$/i.test(file.name);
              const isAudio = file.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|flac|aac|wma)$/i.test(file.name);

              setPendingFile(file);
              setFilename(file.name);
              setIsAudioMeeting(isVideo || isAudio);
              setDirection(1);
              setCurrentStep(2);
            }}
          />
          {loading ? (
            <div className="space-y-4 flex flex-col items-center py-4 z-10">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-1 animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-foreground">{customLoadingMsg || "Processing file..."}</h3>
                <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                  Automatic format detection & ingestion in progress. Please do not close this window.
                </p>
              </div>
              <div className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden border">
                <div className="bg-primary h-full w-2/3 animate-[pulse_2s_infinite]" />
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-card border text-card-foreground shadow-sm flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">Drag & Drop Any Meeting File</h3>
              <p className="text-muted-foreground text-xs max-w-sm mt-1 mx-auto leading-relaxed">
                Supports Video (MP4, MOV, WEBM), Audio (MP3, WAV, M4A), and Transcripts (VTT, SRT, TXT). Video files are automatically converted to audio for AssemblyAI ingestion.
              </p>
              <Button variant="outline" size="sm" type="button" className="mt-6 bg-card border text-card-foreground shadow-sm rounded-xl px-5 py-2.5 font-medium">Select File</Button>
            </>
          )}
        </div>
      </div>
    </Step>,

    <Step key="step2">
      <div className="space-y-6 py-2">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Meeting Title</Label>
              <Input id="title" placeholder="e.g. Q3 Roadmap Review" defaultValue={filename} className="bg-muted/50 border h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Meeting Type</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input id="type" placeholder="e.g. Brainstorming, Status Sync" className="bg-muted/50 border h-10 rounded-xl pl-10" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendees">Attendees (comma separated)</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input id="attendees" placeholder="sarah@acme.com, john@acme.com" className="bg-muted/50 border h-10 rounded-xl pl-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Attachments (Slides, Docs for Context)</Label>
            <div className="relative bg-muted/50 border rounded-xl p-3 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/70 text-muted-foreground text-sm overflow-hidden">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.md"
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments(prev => [...prev, ...Array.from(e.target.files as FileList)]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Paperclip className="w-4 h-4 text-muted-foreground" /> 
              {attachments.length > 0 ? `${attachments.length} files attached (click to add more)` : "Add contextual documents (PDF, TXT, MD)"}
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground text-center pt-1">Optional fields to add context for the organization's memory graph</p>
          </div>
        </div>
      </div>
    </Step>
  ]

  return (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogContent className="min-w-2xl w-full max-w-2xl p-0 overflow-hidden rounded-2xl bg-card border text-card-foreground shadow-2xl flex flex-col">
        <DialogHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <span>Step {currentStep} of 2</span>
              <span>•</span>
              <span>{currentStep === 1 ? "Select Source" : "Meeting Details"}</span>
            </div>
            <DialogTitle className="text-2xl font-bold">
              {currentStep === 1 ? "Capture Meeting" : "Meeting Details"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-0.5">
              {currentStep === 1
                ? "Drag & drop any video, audio, or transcript file."
                : "Provide context for the organization's memory graph."
              }
            </DialogDescription>
          </div>

          <div className="flex items-center pr-2 shrink-0">
            {[1, 2].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <StepIndicator
                  step={stepNumber}
                  currentStep={currentStep}
                  onClickStep={(clicked) => {
                    setDirection(clicked > currentStep ? 1 : -1);
                    setCurrentStep(clicked);
                  }}
                />
                {stepNumber < 2 && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <StepContentWrapper
            isCompleted={currentStep > 2}
            currentStep={currentStep}
            direction={direction}
            className="px-6 py-4"
          >
            {stepsContent[currentStep - 1]}
          </StepContentWrapper>
        </ScrollArea>

        <div className="p-6 border-t border-border/40 flex justify-between gap-3 bg-muted/10">
          <button
            type="button"
            onClick={currentStep === 1 ? () => setUploadDialogOpen(false) : handleBack}
            className="rounded-xl h-11 px-5 border border-border/50 hover:bg-muted/50 transition-all text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            {currentStep !== 1 && <ArrowLeft className="w-4 h-4" />}
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={currentStep === 2 ? handleUpload : handleNext}
            className="flex items-center justify-center rounded-xl bg-primary text-primary-foreground h-11 px-6 text-sm font-medium transition-transform hover:scale-[1.01] gap-2 shadow-md disabled:opacity-50"
          >
            {currentStep === 2 ? "Proceed to Processing Flow" : "Next Step"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
