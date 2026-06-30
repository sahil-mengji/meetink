import { createBrowserRouter } from "react-router-dom"

import App from "@/App"
import { ActionItemWorkspacePage } from "@/pages/action-item-workspace-page"
import { AnalysisProgressPage } from "@/pages/analysis-progress-page"
import { RouteErrorBoundary } from "@/components/errors/route-error-boundary"
import { DecisionRegistryPage } from "@/pages/decision-registry-page"
import { FollowUpPlannerPage } from "@/pages/follow-up-planner-page"
import { KnowledgeLibraryPage } from "@/pages/knowledge-library-page"
import { LandingDashboardPage } from "@/pages/landing-dashboard-page"
import { MeetingDetailPage, WorkspaceDetailPage } from "@/pages/meeting-detail-page"
import { MeetingRecapViewerPage } from "@/pages/meeting-recap-viewer-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { ProcessingFlowPage } from "@/pages/processing-flow-page"
import { ParticipationAnalyticsPage } from "@/pages/participation-analytics-page"
import { RiskDependencyBoardPage } from "@/pages/risk-dependency-board-page"
import { SpeakerClusteringPage } from "@/pages/speaker-clustering-page"
import { TranscriptViewerPage } from "@/pages/transcript-viewer-page"
import { LandingPage } from "@/pages/landing-page"
import CalendarPage from "@/pages/calendar-page"
import { PipelineTestingPage } from "@/pages/pipeline-testing-page"
import { UsersPage } from "@/pages/users-page"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app",
    element: <App />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <LandingDashboardPage />,
      },
      {
        path: "analysis-progress",
        element: <AnalysisProgressPage />,
      },
      {
        path: "meeting-recap",
        element: <MeetingRecapViewerPage />,
      },
      {
        path: "transcript-viewer",
        element: <TranscriptViewerPage />,
      },
      {
        path: "action-workspace",
        element: <ActionItemWorkspacePage />,
      },
      {
        path: "decision-registry",
        element: <DecisionRegistryPage />,
      },
      {
        path: "risk-board",
        element: <RiskDependencyBoardPage />,
      },
      {
        path: "participation-analytics",
        element: <ParticipationAnalyticsPage />,
      },
      {
        path: "knowledge-library",
        element: <KnowledgeLibraryPage />,
      },
      {
        path: "meeting-detail",
        element: <MeetingDetailPage />,
        children: [
          { index: true, element: <MeetingRecapViewerPage /> },
          { path: "transcript", element: <TranscriptViewerPage /> },
          { path: "workspace", element: <WorkspaceDetailPage /> },
        ],
      },
      {
        path: "follow-up-planner",
        element: <FollowUpPlannerPage />,
      },
      {
        path: "speaker-clustering",
        element: <SpeakerClusteringPage />,
      },
      {
        path: "processing-flow",
        element: <ProcessingFlowPage />,
      },
      {
        path: "calendar",
        element: <CalendarPage />,
      },
      {
        path: "pipeline-testing",
        element: <PipelineTestingPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
])
