import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, ChevronDown, ChevronRight, FileText, MessageSquare, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BASE_URL, fetchMeetings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { fetchMeetingDetail } from "@/lib/api";

interface AgentChatProps {
  meetingId?: string;
  className?: string;
  initialQuery?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  toolCalls?: any[];
  toolResults?: { name: string; content: string }[];
  isStreaming?: boolean;
}

const formatTimeStr = (seconds?: number) => {
  if (seconds === undefined || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

function PillTooltip({ tag, meetingId }: { tag: string; meetingId?: string | null }) {
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async (open: boolean) => {
    if (open && !meeting && meetingId && !loading) {
      setLoading(true);
      try {
        const data = await fetchMeetingDetail(meetingId);
        setMeeting(data);
      } catch (err) {
        console.error("Failed to fetch meeting for pill", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getSource = () => {
    if (!meeting) return null;
    const cleanTag = tag.trim().toLowerCase();
    const matchNum = cleanTag.match(/\d+/);
    const num = matchNum ? parseInt(matchNum[0], 10) : 1;
    const idx = Math.max(0, num - 1);

    if (cleanTag.startsWith("km-")) {
      const km = meeting.key_moments?.[idx];
      if (km) return { title: km.type || "Key Moment", text: km.text };
    } else if (cleanTag.startsWith("act-")) {
      const act = meeting.action_items?.[idx];
      if (act) return { title: `Action: ${act.owner || 'Unassigned'}`, text: act.text };
    } else if (cleanTag.startsWith("tp-")) {
      const tp = meeting.topics_data?.topics?.[idx];
      if (tp) return { title: tp.name || tp.title || "Topic", text: tp.description || tp.text };
    } else if (cleanTag.startsWith("kf-")) {
      const kf = meeting.knowledge_facts?.[idx];
      if (kf) return { title: "Knowledge Fact", text: kf.text };
    } else if (cleanTag.startsWith("ii-")) {
      const ii = meeting.inferred_insights?.discussion_insights?.[idx] || meeting.inferred_insights?.risks_and_blockers?.[idx];
      if (ii) return { title: ii.insight ? "Discussion Insight" : "Risk / Blocker", text: ii.insight || ii.description || ii.risk || ii.text || "" };
    } else if (cleanTag.startsWith("ta-")) {
      const ta = meeting.team_analysis?.decision_drivers?.[idx];
      if (ta) return { title: "Decision Driver", text: ta.driver || ta.description || ta.text || "" };
    } else if (cleanTag.startsWith("pa-")) {
      const pa = meeting.participation?.metrics?.[idx];
      if (pa) return { title: "Participation", text: `${pa.participant} spoke for ${pa.percentage}% of the time.` };
    } else if (cleanTag === "sum" || cleanTag === "summary") {
      return { title: "Meeting Summary", text: meeting.topics_data?.overall_description || meeting.title || "Full Summary" };
    } else if (cleanTag.startsWith("doc-")) {
      const chunkId = cleanTag.substring(4);
      const chunk = meeting.attachment_chunks?.find((c: any) => c.chunk_id === chunkId || String(c.id) === chunkId);
      if (chunk) {
        const attachment = meeting.attachments?.find((a: any) => a.id === chunk.attachment_id || a.attachment_id === chunk.attachment_id);
        return { title: attachment?.filename || "Document", text: chunk.text, time: "Doc Ref" };
      }
    } else if (/^\d+$/.test(cleanTag)) {
      const utterance = meeting.transcript?.find((u: any) => String(u.id) === String(cleanTag));
      if (utterance) return { title: utterance.speaker || "Speaker", text: utterance.text, time: formatTimeStr(utterance.start) };
    }
    return { title: "Reference", text: `Detail for ${tag}` };
  };

  const source = getSource();
  const isDoc = tag.toLowerCase().startsWith('doc-');

  return (
    <Tooltip onOpenChange={handleOpen}>
      <TooltipTrigger className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs mx-1 cursor-pointer transition-all transform select-none ${isDoc ? 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent hover:border-border/60' : 'bg-fuchsia-500/10 text-fuchsia-300 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 hover:border-fuchsia-400/50'}`}>
        {isDoc ? <FileText className="w-3 h-3 text-blue-500 shrink-0" /> : <Sparkles className="w-3 h-3 text-fuchsia-400 shrink-0" />}
        {tag}
      </TooltipTrigger>
      <TooltipContent hideArrow={true} side="bottom" className="cursor-pointer bg-background/0 dark:bg-red-200/0 relative max-w-md p-6 text-xs text-foreground rounded-3xl z-50 space-y-3 animate-in fade-in-0 zoom-in-95 duration-200 shadow-2xl border border-border/50">
        <div className="bg-[#dfe9fb]/90 dark:bg-[#22222a]/90 blur-lg inset-0 absolute bg-lg"></div>
        <div className="bg-background/0 dark:bg-[#22222a]/0 backdrop-blur-2xl rounded-4xl inset-8 absolute bg-lg"></div>
        
        <div className="overflow-y-auto pr-1 z-10 relative scrollbar-none">
          {loading ? (
            <div className="flex items-center space-x-2 text-muted-foreground p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading context...</span>
            </div>
          ) : source ? (
            <div className="group p-3 rounded-2xl hover:my-3 duration-400 transition-all hover:bg-muted/30 border border-transparent hover:border-border/40">
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground gap-3">
                <span className="text-foreground dark:font-thin font-light text-sm mb-1">{source.title}</span>
                {source.time && <span className="text-xs font-light text-primary">{source.time}</span>}
              </div>
              <p className="text-foreground font-regular leading-relaxed text-sm mt-1">"{source.text}"</p>
            </div>
          ) : (
            <div className="text-muted-foreground italic text-xs bg-muted/40 backdrop-blur-md p-3 rounded-xl border border-border/50">Context not found for {tag}.</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

const renderTextWithPills = (text: string, currentMeetingId: string | null) => {
  const regex = /(\[[a-zA-Z0-9,\s-:_\|]{1,70}\])/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      let cleanTag = part.slice(1, -1).trim();
      let meetingIdToUse = currentMeetingId;
      
      if (cleanTag.includes(":")) {
        const splitParts = cleanTag.split(":");
        if (splitParts.length === 2 && splitParts[0].length > 15) {
          meetingIdToUse = splitParts[0].trim();
          cleanTag = splitParts[1].trim();
        }
      }

      const lowerTag = cleanTag.toLowerCase();
      if (lowerTag.startsWith("km-") || lowerTag.startsWith("act-") || lowerTag.startsWith("tp-") || lowerTag.startsWith("kf-") || lowerTag.startsWith("ii-") || lowerTag.startsWith("ta-") || lowerTag.startsWith("pa-") || lowerTag === "sum" || lowerTag === "summary" || lowerTag.startsWith("doc-") || /^\d+$/.test(lowerTag)) {
        return <PillTooltip key={i} tag={cleanTag} meetingId={meetingIdToUse} />;
      }
    }
    return part;
  });
};

const renderWithCitations = (children: any, currentMeetingId: string | null): any => {
  if (typeof children === 'string') {
    return renderTextWithPills(children, currentMeetingId);
  }
  if (Array.isArray(children)) {
    return children.map((child, idx) => (
      <React.Fragment key={idx}>{renderWithCitations(child, currentMeetingId)}</React.Fragment>
    ));
  }
  return children;
};

export function AgentChat({ meetingId, className = "", initialQuery = "" }: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedInitial, setHasStartedInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [meetingsList, setMeetingsList] = useState<{ id: string; title: string }[]>([]);
  const [selectedGlobalMeetings, setSelectedGlobalMeetings] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (!meetingId) {
      fetchMeetings().then(res => {
        setMeetingsList(res.map(m => ({ id: m.id, title: m.title || "Untitled Meeting" })));
      }).catch(console.error);
    }
  }, [meetingId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const slashIndex = input.lastIndexOf('/');
  const showPicker = !meetingId && slashIndex !== -1;
  const filterText = showPicker ? input.slice(slashIndex + 1).toLowerCase() : "";
  const filteredMeetings = showPicker ? meetingsList.filter(m => m.title.toLowerCase().includes(filterText) && !selectedGlobalMeetings.find(s => s.id === m.id)) : [];

  const handleSelectMeeting = (m: { id: string; title: string }) => {
    setSelectedGlobalMeetings(prev => [...prev, m]);
    setInput(input.slice(0, slashIndex));
  };

  const executeQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: queryText.trim(),
    };

    const agentMessageId = (Date.now() + 1).toString();
    const initialAgentMessage: ChatMessage = {
      id: agentMessageId,
      role: "agent",
      content: "",
      toolResults: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAgentMessage]);
    setInput("");
    setIsLoading(true);

    let lastStepTime = Date.now();

    try {
      const chatHistoryPayload = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: userMessage.content, 
          meeting_id: meetingId || null, 
          referred_meeting_ids: selectedGlobalMeetings.length > 0 ? selectedGlobalMeetings.map(m => m.id) : null,
          chat_history: chatHistoryPayload
        }),
      });

      if (!res.ok) throw new Error("Failed to connect to agent");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              setMessages((prev) => 
                prev.map((msg) => {
                  if (msg.id !== agentMessageId) return msg;
                  
                  if (data.type === "tool_result") {
                    const now = Date.now();
                    const timeTaken = ((now - lastStepTime) / 1000).toFixed(1) + "s";
                    lastStepTime = now;
                    const newToolResults = [...(msg.toolResults || []), { name: data.name, content: data.content, timeTaken }];
                    return { ...msg, toolResults: newToolResults };
                  } else if (data.type === "ai") {
                    return { ...msg, content: data.content, toolCalls: data.tool_calls };
                  } else if (data.type === "error") {
                    return { ...msg, content: `Error: ${data.content}` };
                  }
                  return msg;
                })
              );
            } catch (e) {
              console.error("Error parsing NDJSON chunk", e);
            }
          }
        }
      }
    } catch (error: any) {
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === agentMessageId ? { ...msg, content: `System Error: ${error.message}` } : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === agentMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  useEffect(() => {
    if (initialQuery && !hasStartedInitial) {
      setHasStartedInitial(true);
      executeQuery(initialQuery);
    }
  }, [initialQuery, hasStartedInitial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeQuery(input);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-slate-900/50 border-b border-slate-800 shrink-0">
        <Sparkles className="w-5 h-5 text-fuchsia-400 mr-2" />
        <h3 className="font-medium text-slate-200">
          {meetingId ? "Ask AI about this meeting" : "Global Knowledge AI"}
        </h3>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
            <Sparkles className="w-12 h-12 text-fuchsia-500/20" />
            <div className="text-center">
              <h1 className="text-2xl font-medium tracking-tight text-slate-300 mb-2">How can I help you?</h1>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Ask anything about past discussions or decisions. Use <strong className="text-fuchsia-400">/</strong> to search within a specific meeting.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user" 
                  ? "bg-fuchsia-600 text-white rounded-br-sm" 
                  : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700"
              }`}
            >
              {msg.role === "agent" && msg.toolResults && msg.toolResults.length > 0 && (
                <div className="mb-3 space-y-2">
                  {msg.toolResults.map((tr, idx) => (
                    <ToolResultExpandable key={idx} name={tr.name} content={tr.content} />
                  ))}
                </div>
              )}
              
              <div className="prose prose-invert prose-sm max-w-none">
                {msg.content ? (
                  <TooltipProvider delay={100}>
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-2xl font-extrabold text-white tracking-tight mt-6 mb-3 pb-2 border-b border-slate-700 flex items-center gap-2">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</h1>,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-5 mb-2 pb-1 border-b border-slate-700/60 flex items-center gap-2">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</h2>,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-slate-200 tracking-tight mt-4 mb-2 flex items-center gap-1.5">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</h3>,
                        h4: ({ node, ...props }) => <h4 className="text-base font-semibold text-slate-200 mt-3 mb-1">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</h4>,
                        ul: ({ node, ...props }) => <ul className="text-sm text-slate-300 space-y-2 my-3 list-disc pl-5 marker:text-fuchsia-400" {...props} />,
                        ol: ({ node, ...props }) => <ol className="text-sm text-slate-300 space-y-2 my-3 list-decimal pl-5 marker:text-fuchsia-400 font-medium" {...props} />,
                        li: ({ node, ...props }) => <li className="my-1.5 leading-relaxed pl-1">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</li>,
                        p: ({ node, ...props }) => <p className="mb-3 leading-relaxed text-sm text-slate-200 last:mb-0">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</p>,
                        strong: ({ node, ...props }) => <strong className="font-bold text-white tracking-wide">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</strong>,
                        em: ({ node, ...props }) => <em className="italic text-slate-400">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</em>,
                        table: ({ node, ...props }) => (
                          <div className="my-4 w-full overflow-x-auto rounded-xl border border-slate-700/50 shadow-sm bg-slate-900/50">
                            <table className="w-full text-left border-collapse text-sm" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-slate-800/80 border-b border-slate-700 text-xs font-semibold text-slate-300 uppercase tracking-wider" {...props} />,
                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-700/50 bg-slate-900/20" {...props} />,
                        tr: ({ node, ...props }) => <tr className="hover:bg-slate-800/50 transition-colors" {...props} />,
                        th: ({ node, ...props }) => <th className="px-4 py-2.5 font-medium text-white">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</th>,
                        td: ({ node, ...props }) => <td className="px-4 py-2.5 text-slate-300 leading-relaxed text-xs">{renderWithCitations(props.children, meetingId || selectedGlobalMeetings[0]?.id || null)}</td>,
                        a: ({ node, ...props }) => {
                          const href = props.href || "";
                          if (href.startsWith("doc:") || href.startsWith("utterance:")) {
                            return (
                              <CitationTooltip 
                                href={href} 
                                label={props.children as React.ReactNode} 
                              />
                            );
                          }
                          return <a {...props} className="text-fuchsia-400 hover:underline font-medium" target="_blank" rel="noreferrer" />;
                        }
                      }}
                    >
                      {msg.content?.replace(/<plan>[\s\S]*?(?:<\/plan>|$)/g, '').replace(/<thought>[\s\S]*?(?:<\/thought>|$)/g, '').replace(/<confidence>[\s\S]*?(?:<\/confidence>|$)/g, '').replace(/<function[\s\S]*?(?:<\/function>|>|$)/g, '').trim()}
                    </ReactMarkdown>
                  </TooltipProvider>
                ) : (
                  msg.isStreaming && (
                    <div className="flex items-center space-x-2 text-slate-400 h-6">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Agent is thinking...</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900/80 border-t border-slate-800 shrink-0 relative">
        {showPicker && (
          <div className="absolute bottom-full left-4 mb-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-b border-slate-700">Select a meeting</div>
            <div className="max-h-48 overflow-y-auto">
              {filteredMeetings.length === 0 ? (
                <div className="px-3 py-4 text-sm text-center text-slate-500">No meetings found.</div>
              ) : (
                filteredMeetings.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMeeting(m)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0 truncate"
                  >
                    {m.title}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        
        <div className="relative flex items-center bg-slate-800 border border-slate-700 rounded-full focus-within:ring-1 focus-within:ring-fuchsia-500 overflow-hidden flex-wrap">
          {selectedGlobalMeetings.map(m => (
            <Badge key={m.id} variant="secondary" className="ml-2 mt-1 mb-1 pl-2 pr-1 py-1 flex items-center gap-1 bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30 whitespace-nowrap max-w-[150px]">
              <span className="truncate">{m.title}</span>
              <button type="button" onClick={() => setSelectedGlobalMeetings(prev => prev.filter(sm => sm.id !== m.id))} className="rounded-full p-0.5 hover:bg-fuchsia-500/50 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Input
            type="text"
            placeholder={meetingId ? "Search this meeting..." : (selectedGlobalMeetings.length > 0 ? "Search..." : "Ask a question, or use / to search a meeting...")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3 bg-transparent border-none focus-visible:ring-0 text-slate-200 h-12 shadow-none"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="absolute right-2 w-8 h-8 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ToolResultExpandable({ name, content }: { name: string; content: string }) {
  const [expanded, setExpanded] = useState(false);
  
  const getToolDisplayName = (n: string) => {
    if (n === "search_meetings") return "Searching semantic knowledge base...";
    if (n === "fetch_transcript_context") return "Reading raw transcript context...";
    if (n === "get_meeting_metadata") return "Checking meeting metadata...";
    if (n === "fetch_document_reference") return "Reading attached document...";
    if (n === "get_meeting_summary") return "Fetching structured summary report...";
    if (n === "get_meeting_insights_and_risks") return "Analyzing inferred insights & risks...";
    if (n === "get_meeting_topics") return "Fetching meeting topic hierarchy...";
    return `Using tool: ${n}`;
  };

  return (
    <div className="border border-slate-700/50 rounded-md overflow-hidden bg-slate-900/30">
      <button 
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full px-3 py-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3 mr-2 shrink-0" /> : <ChevronRight className="w-3 h-3 mr-2 shrink-0" />}
        <span className="font-mono text-[10px] uppercase tracking-wider truncate">{getToolDisplayName(name)}</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-slate-700/50 text-xs text-slate-500 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}

const formatTime = (seconds?: number) => {
  if (seconds === undefined || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

function CitationTooltip({ href, label }: { href: string; label: React.ReactNode }) {
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isDoc = href.startsWith("doc:");
  const parts = href.split(":");
  const meetingId = parts[1];
  const entityId = parts.slice(2).join(":"); 

  const handleOpen = async (open: boolean) => {
    if (open && !meeting && meetingId && !loading) {
      setLoading(true);
      try {
        const data = await fetchMeetingDetail(meetingId);
        setMeeting(data);
      } catch (err) {
        console.error("Failed to fetch meeting for citation", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getSource = () => {
    if (!meeting) return null;
    if (isDoc) {
      const chunk = meeting.attachment_chunks?.find((c: any) => c.chunk_id === entityId);
      if (chunk) {
        const attachment = meeting.attachments?.find((a: any) => a.id === chunk.attachment_id || a.attachment_id === chunk.attachment_id);
        return {
          type: "doc",
          title: attachment?.filename || "Document",
          text: chunk.text,
        };
      }
    } else {
      const utterance = meeting.transcript?.find((u: any) => String(u.id) === String(entityId));
      if (utterance) {
        return {
          type: "utterance",
          speaker: utterance.speaker || "Speaker",
          text: utterance.text,
          time: formatTime(utterance.start),
        };
      }
    }
    return null;
  };

  const source = getSource();

  return (
    <Tooltip onOpenChange={handleOpen}>
      <TooltipTrigger className={`cursor-pointer transition-all inline-flex items-center gap-1 mx-1 font-normal select-none px-2.5 py-0.5 rounded-full border text-xs ${isDoc ? "bg-muted/50 text-muted-foreground hover:bg-muted border-transparent hover:border-border/60" : "bg-fuchsia-900/20 text-fuchsia-300 hover:bg-fuchsia-900/40 border-fuchsia-800/50 hover:border-fuchsia-700/50"}`}>
        {isDoc ? <FileText className="w-3 h-3 text-blue-400 shrink-0" /> : <MessageSquare className="w-3 h-3 text-fuchsia-400 shrink-0" />}
        {label}
      </TooltipTrigger>
      <TooltipContent hideArrow={true} side="bottom" className="cursor-pointer bg-background/0 dark:bg-red-200/0 relative max-w-md p-6 text-xs text-foreground rounded-3xl z-50 space-y-3 animate-in fade-in-0 zoom-in-95 duration-200 shadow-2xl border border-border/50">
        <div className="bg-[#dfe9fb]/90 dark:bg-[#22222a]/90 blur-lg inset-0 absolute bg-lg"></div>
        <div className="bg-background/0 dark:bg-[#22222a]/0 backdrop-blur-2xl rounded-4xl inset-8 absolute bg-lg"></div>
        
        <div className="overflow-y-auto pr-1 z-10 relative scrollbar-none">
          {loading ? (
            <div className="flex items-center space-x-2 text-muted-foreground p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading context...</span>
            </div>
          ) : source ? (
            <div className="group p-3 rounded-2xl hover:my-3 duration-400 transition-all hover:bg-muted/30 border border-transparent hover:border-border/40">
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground gap-3">
                <span className="text-foreground dark:font-thin font-light text-sm mb-1">{source.type === "doc" ? source.title : source.speaker}</span>
                {source.time && <span className="text-xs font-light text-primary">{source.time}</span>}
              </div>
              <p className="text-foreground font-regular leading-relaxed text-sm mt-1">"{source.text}"</p>
            </div>
          ) : (
            <div className="text-muted-foreground italic text-xs bg-muted/40 backdrop-blur-md p-3 rounded-xl border border-border/50">Context not found.</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
