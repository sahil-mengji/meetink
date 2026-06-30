import { QueryClientProvider } from "@tanstack/react-query"
import { GlobalErrorBoundary } from "@/components/errors/global-error-boundary"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/query-client"

type AppProvidersProps = {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="dark">
      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors closeButton />
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </ThemeProvider>
  )
}
