import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/errors"

function shouldRetry(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return true
  }

  if (error.statusCode >= 500 || error.statusCode === 429) {
    return true
  }

  return false
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 2 && shouldRetry(error),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
