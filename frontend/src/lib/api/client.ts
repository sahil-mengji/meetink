import axios from "axios"

import { API_BASE_URL } from "@/lib/env"
import { normalizeApiError } from "@/lib/api/errors"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const requestId = crypto.randomUUID()
  config.headers = config.headers ?? {}
  config.headers["x-request-id"] = requestId
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
)
