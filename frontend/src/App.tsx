import { motion } from "motion/react"
import { Outlet, useLocation } from "react-router-dom"

import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MeetingUploadDialog } from "@/components/meeting-upload-dialog"

function App() {
  const location = useLocation()

  // The landing page should probably not have the sidebar if it's pure marketing, 
  // but the user's prompt specifically asked for "(sidebar + new meeting/main dashboard/knowledge library/previous meetings etc )"
  // So we apply the sidebar provider globally.
  const isMarketingLanding = location.pathname === "/landing"
  const isTranscriptView = location.pathname.includes("/transcript")
  const showGlow = (location.pathname.includes("/meeting-detail") || location.pathname.includes("/meeting-recap") || location.pathname.includes("/processing-flow") || location.pathname.includes("/knowledge-library")) && !isTranscriptView

  if (isMarketingLanding) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900 min-h-screen font-sans">
        <Outlet />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className=" bg-background min-h-screen font-sans flex w-full relative overflow-hidden">
          {showGlow && (
            <div className="absolute top-[-350px] left-1/2 -translate-x-1/2 w-full h-[600px] bg-linear-to-r from-sky-400/40 via-blue-400/40 to-indigo-400/40 dark:from-blue-950/60 dark:via-indigo-950/60 dark:to-slate-900/60 rounded-full blur-[120px] pointer-events-none opacity-100"></div>
          )}
          
          {!isTranscriptView && <AppSidebar />}
          
          <MeetingUploadDialog />

          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Top mobile-friendly header just for the sidebar trigger */}
            <header className="h-14 flex md:hidden items-center justify-between px-4 lg:px-6 border-b shrink-0 bg-background/95 backdrop-blur z-20">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
              </div>
            </header>

            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ overscrollBehavior: "none" }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto overflow-x-hidden relative BG"
            >
              <Outlet />
            </motion.main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default App
