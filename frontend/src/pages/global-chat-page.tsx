import { AgentChat } from "@/components/agent-chat"

export function GlobalChatPage() {
  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 pt-10 pb-4 overflow-hidden">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full gap-4">
        <div className="shrink-0 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Global Knowledge Chat</h1>
          <p className="text-slate-400">Search and ask questions across all your meetings, decisions, and action items.</p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <AgentChat className="h-full w-full rounded-2xl border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-sm" />
        </div>
      </div>
    </div>
  )
}
