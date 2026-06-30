import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Rocket, Calendar, CheckSquare, GitBranch, Check, X, AlertCircle, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';


interface ActionItemData {
  id?: string;
  text: string;
  owner?: string;
  deadline?: string;
  confidence?: number;
  source_utterance_ids?: (string | number)[];
  source_doc_refs?: string[];
  source_key_moment_ids?: string[];
}

interface PerItemResult {
  linear?: { status: string; ticket_id?: string; url?: string; reason?: string };
  calendar?: { status: string; event_id?: string; html_link?: string; reason?: string };
  tasks?: { status: string; task_id?: string; title?: string; reason?: string };
}

interface DispatchResult {
  meeting_id: string;
  action_results: Record<string, PerItemResult>;
  email: Record<string, any>;
}

interface IntegrationDispatchPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  actionItems: ActionItemData[];
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  success: <Check className="h-3 w-3 text-emerald-400" />,
  mock_success: <Check className="h-3 w-3 text-emerald-400" />,
  failed: <X className="h-3 w-3 text-red-400" />,
  skipped: <MinusCircle className="h-3 w-3 text-amber-400" />,
  auth_required: <AlertCircle className="h-3 w-3 text-amber-400" />,
  requires_human_confirmation: <AlertCircle className="h-3 w-3 text-amber-400" />,
};

const STATUS_COLOR: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  mock_success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/15 text-red-400 border-red-500/30',
  skipped: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  auth_required: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function StatusBadge({ label, result }: { label: string; result?: { status: string; reason?: string } }) {
  if (!result) return null;
  const status = result.status;
  const colorClass = STATUS_COLOR[status] || 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${colorClass}`} title={result.reason || status}>
      {STATUS_ICON[status] || null}
      {label}
    </span>
  );
}

export function IntegrationDispatchPanel({ open, onOpenChange, meetingId, actionItems }: IntegrationDispatchPanelProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    linear: true,
    calendar: true,
    tasks: true,
    email: false,
  });

  // Per-item selection state
  const [selectedMap, setSelectedMap] = useState<Record<number, boolean>>({});
  // Per-item results after dispatch
  const [results, setResults] = useState<DispatchResult | null>(null);

  // Reset selection when items change
  useEffect(() => {
    const map: Record<number, boolean> = {};
    (actionItems || []).forEach((_, idx) => { map[idx] = true; });
    setSelectedMap(map);
    setResults(null);
  }, [actionItems, open]);

  const selectedItems = (actionItems || []).filter((_, idx) => selectedMap[idx]);
  const selectedCount = selectedItems.length;

  const toggleItem = (idx: number) => {
    setSelectedMap(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAll = () => {
    const allSelected = Object.values(selectedMap).every(Boolean);
    const map: Record<number, boolean> = {};
    (actionItems || []).forEach((_, idx) => { map[idx] = !allSelected; });
    setSelectedMap(map);
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDispatch = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch(`http://localhost:8000/meetings/${meetingId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_items: selectedItems,
          options,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const dispatchResult: DispatchResult = data.result;
      setResults(dispatchResult);

      // Count successes
      const totalIntegrations = Object.values(dispatchResult.action_results).reduce((acc, itemRes) => {
        return acc + Object.values(itemRes).filter((r: any) => r?.status === 'success' || r?.status === 'mock_success').length;
      }, 0);

      toast.success(`Dispatched ${selectedCount} items — ${totalIntegrations} integrations succeeded`);
    } catch (err: any) {
      toast.error(`Dispatch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Build a lookup from action text to results
  const resultLookup = (text: string): PerItemResult | undefined => {
    if (!results) return undefined;
    // Results are keyed by text[:60]
    const key = text.substring(0, 60);
    return results.action_results[key];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-primary" />
            Dispatch to Integrations
          </DialogTitle>
          <DialogDescription>
            Review and approve action items before sending to external services.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          {/* Integration Toggles */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={options.linear ? "default" : "outline"}
              size="sm"
              onClick={() => toggleOption('linear')}
              className="gap-2"
            >
              <GitBranch className="h-3.5 w-3.5" /> Linear
            </Button>
            <Button
              variant={options.calendar ? "default" : "outline"}
              size="sm"
              onClick={() => toggleOption('calendar')}
              className="gap-2"
            >
              <Calendar className="h-3.5 w-3.5" /> Calendar
            </Button>
            <Button
              variant={options.tasks ? "default" : "outline"}
              size="sm"
              onClick={() => toggleOption('tasks')}
              className="gap-2"
            >
              <CheckSquare className="h-3.5 w-3.5" /> Google Tasks
            </Button>
          </div>

          {/* Action Items List */}
          <div className="border rounded-xl overflow-hidden bg-muted/10">
            {/* Select All Header */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b">
              <Checkbox
                checked={Object.values(selectedMap).every(Boolean)}
                onCheckedChange={toggleAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none">
                {selectedCount} of {actionItems?.length || 0} selected
              </label>
            </div>

            {(!actionItems || actionItems.length === 0) ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No action items extracted from this meeting.
              </div>
            ) : (
              <div className="divide-y divide-border/30 max-h-[40vh] overflow-y-auto">
                <AnimatePresence>
                  {actionItems.map((item, idx) => {
                    const itemResult = resultLookup(item.text);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${selectedMap[idx] ? 'bg-background/60' : 'bg-muted/5 opacity-50'}`}
                      >
                        <Checkbox
                          checked={!!selectedMap[idx]}
                          onCheckedChange={() => toggleItem(idx)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${selectedMap[idx] ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                            {item.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {item.owner && (
                              <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {item.owner}
                              </span>
                            )}
                            {item.deadline && (
                              <span className="text-[10px] text-muted-foreground">
                                Due: {new Date(item.deadline).toLocaleDateString()}
                              </span>
                            )}
                            {item.confidence != null && (
                              <span className="text-[10px] text-muted-foreground">
                                {(item.confidence * 100).toFixed(0)}% conf
                              </span>
                            )}
                          </div>

                          {/* Per-item dispatch results */}
                          {itemResult && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {options.linear && <StatusBadge label="Linear" result={itemResult.linear} />}
                              {options.calendar && <StatusBadge label="Calendar" result={itemResult.calendar} />}
                              {options.tasks && <StatusBadge label="Tasks" result={itemResult.tasks} />}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Dispatching uses the shared backend accounts configured in <code className="bg-muted px-1 rounded">.env</code>
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleDispatch}
            disabled={loading || selectedCount === 0 || (!options.linear && !options.calendar && !options.tasks)}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {results ? 'Re-dispatch' : `Dispatch ${selectedCount} Items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
