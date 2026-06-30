const FALLBACK_API_BASE_URL = "/api/v1"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Meet Ink"

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    "VITE_API_BASE_URL is not set. Falling back to /api/v1"
  )
}
