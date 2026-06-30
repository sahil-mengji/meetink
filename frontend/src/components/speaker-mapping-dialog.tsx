import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/env"

interface User {
  id: string
  name: string
  email?: string
}

interface SpeakerMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meetingId: string
  onConfirm: () => void
}

function findBestMatch(speakerName: string, users: User[]): string | undefined {
  const normalizedSpeaker = speakerName.toLowerCase().replace(/[^a-z0-9\s]/g, "")
  const speakerTokens = normalizedSpeaker.split(/\s+/).filter(Boolean)
  
  if (speakerTokens.length === 0) return undefined

  let bestMatchId: string | undefined = undefined
  let maxScore = 0

  for (const user of users) {
    const normalizedUser = user.name.toLowerCase().replace(/[^a-z0-9\s]/g, "")
    const userTokens = normalizedUser.split(/\s+/).filter(Boolean)
    
    // Check exact match
    if (normalizedSpeaker === normalizedUser) {
      return user.id
    }
    
    // Score based on token overlap
    let score = 0
    for (const sToken of speakerTokens) {
      for (const uToken of userTokens) {
        if (sToken === uToken) {
          score += sToken.length * 2
        } else if (uToken.startsWith(sToken) || sToken.startsWith(uToken)) {
          // E.g., "Sahil" matches "Sahil" (handled above), "Sahil M" matches "Sahil Mengji"
          // "M" startsWith "Mengji"? No, "Mengji" startsWith "M". So score += 1
          score += Math.min(sToken.length, uToken.length)
        }
      }
    }
    
    // Require minimum score to avoid weak single letter matches
    if (score > maxScore && score >= 3) { 
      maxScore = score
      bestMatchId = user.id
    }
  }
  
  return bestMatchId
}

export function SpeakerMappingDialog({ open, onOpenChange, meetingId, onConfirm }: SpeakerMappingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [rawSpeakers, setRawSpeakers] = useState<string[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, meetingId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/users`)
      let loadedUsers = []
      if (usersRes.ok) {
        loadedUsers = await usersRes.json()
      }
      
      // Fallback if DB is empty
      if (loadedUsers.length === 0) {
        loadedUsers = [
          { id: "u-1", name: "Sahil Mengji" },
          { id: "u-2", name: "Prisha Behera" },
          { id: "u-3", name: "Anish Sai Nimmagadda" }
        ]
      }
      setUsers(loadedUsers)

      // Fetch speakers
      let loadedSpeakers = []
      if (meetingId) {
        const spkRes = await fetch(`${API_BASE_URL}/meetings/${meetingId}/speakers`)
        if (spkRes.ok) {
          loadedSpeakers = await spkRes.json()
        }
      }

      // Fallback if backend doesn't have transcript mapped yet
      if (loadedSpeakers.length === 0) {
        loadedSpeakers = ["Caller 1", "Sahil M.", "Prisha B."]
      }
      
      setRawSpeakers(loadedSpeakers)
      
      // Initialize default mappings with lexical auto-matching
      const initialMap: Record<string, string> = {}
      loadedSpeakers.forEach((s: string) => { 
        const matchId = findBestMatch(s, loadedUsers)
        initialMap[s] = matchId || "" 
      })
      setMappings(initialMap)
      
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Filter out empty mappings
      const validMappings = Object.fromEntries(
        Object.entries(mappings).filter(([_, v]) => v !== "")
      )
      
      if (Object.keys(validMappings).length > 0 && meetingId) {
        await fetch(`${API_BASE_URL}/meetings/${meetingId}/speakers/map`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mappings: validMappings })
        })
      }
      
      onConfirm()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      // Even if it fails, let them proceed for now
      onConfirm()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Map Meeting Speakers</DialogTitle>
          <DialogDescription>
            We found some unknown speakers in the transcript. Map them to your team members so we can assign Action Items correctly.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-4"><span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : rawSpeakers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No speakers found to map.</p>
          ) : (
            rawSpeakers.map(speaker => (
              <div key={speaker} className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium w-1/3 truncate" title={speaker}>
                  {speaker}
                </Label>
                <div className="w-2/3">
                  <Select 
                    value={mappings[speaker] || ""} 
                    onValueChange={(val) => val && setMappings(prev => ({...prev, [speaker]: val}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Skip</Button>
          <Button onClick={handleSubmit} disabled={loading || submitting}>
            {submitting ? "Saving..." : "Confirm Mappings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
