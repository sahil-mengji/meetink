import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
}

export function ShareDialog({ open, onOpenChange, meetingId }: ShareDialogProps) {
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!emails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }
    
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e.length > 0);
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/meetings/${meetingId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailList })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      toast.success("Meeting summary sent successfully!");
      onOpenChange(false);
      setEmails('');
    } catch (err: any) {
      toast.error(`Failed to send email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Meeting Report</DialogTitle>
          <DialogDescription>
            Send the full meeting summary and action items directly to someone's inbox.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <Input 
            placeholder="e.g. nishanth@gep.com, sahil@gep.com" 
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Separate multiple emails with commas.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleShare} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
