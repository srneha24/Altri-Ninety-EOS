type ApiResponse<T> = {
  data: T
  message?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.")
  }
  return baseUrl.replace(/\/+$/, "")
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken: string | null = null
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (init.body) {
    headers.set("Content-Type", "application/json")
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })
  const payload: unknown = await response.json()

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}.`
    throw new Error(message)
  }

  if (!isRecord(payload) || !("data" in payload)) {
    throw new Error("The API returned an invalid response.")
  }

  return (payload as ApiResponse<T>).data
}
