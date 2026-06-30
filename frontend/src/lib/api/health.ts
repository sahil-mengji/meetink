import { apiClient } from "@/lib/api/client"

export type HealthResponse = {
  ok: boolean
  service: string
  environment: string
  version: string
  timestamp: string
}

export async function getHealth() {
  const { data } = await apiClient.get<HealthResponse>("/health")
  return data
}
