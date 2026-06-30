import { isAxiosError } from "axios"

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details: unknown

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const statusCode = error.response?.status ?? 500
    const data = error.response?.data as
      | { error?: { code?: string; message?: string; details?: unknown } }
      | undefined

    const message =
      data?.error?.message ?? error.message ?? "Unexpected API error"
    const code = data?.error?.code ?? `HTTP_${statusCode}`

    return new ApiError(message, statusCode, code, data?.error?.details)
  }

  if (error instanceof Error) {
    return new ApiError(error.message)
  }

  return new ApiError("Unknown error")
}
