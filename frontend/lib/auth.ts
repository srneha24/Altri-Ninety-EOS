const ACCESS_TOKEN_KEY = "altri.auth.access"
const REFRESH_TOKEN_KEY = "altri.auth.refresh"
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL

if (!configuredApiUrl) {
  throw new Error("Set NEXT_PUBLIC_API_URL in the frontend environment.")
}

const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "")

export type AuthTokens = {
  access_token: string
  refresh_token: string
  token_type: "bearer"
}

let refreshRequest: Promise<AuthTokens> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    if (!response.ok) {
      return { message: text }
    }

    throw new Error("The server returned an invalid response.")
  }
}

function getErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message
  }

  return `Request failed with status ${status}.`
}

function extractTokens(payload: unknown): AuthTokens {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error("The server returned an invalid token response.")
  }

  const tokens = payload.data.token
  if (!isRecord(tokens)) {
    throw new Error("The server returned an invalid token response.")
  }

  if (
    typeof tokens.access_token !== "string" ||
    typeof tokens.refresh_token !== "string" ||
    tokens.token_type !== "bearer"
  ) {
    throw new Error("The server returned an invalid token response.")
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: "bearer",
  }
}

async function requestTokens(
  path: "/auth/login" | "/auth/refresh",
  body: { email: string } | { refresh_token: string }
): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = await readJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status))
  }

  return extractTokens(payload)
}

export function getAccessToken(): string | null {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveTokens(tokens: AuthTokens): void {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  window.sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function clearTokens(): void {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export async function loginWithEmail(email: string): Promise<void> {
  const tokens = await requestTokens("/auth/login", { email })
  saveTokens(tokens)
}

export function refreshSession(): Promise<AuthTokens> {
  if (refreshRequest) {
    return refreshRequest
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return Promise.reject(
      new Error("Your session has expired. Please sign in.")
    )
  }

  refreshRequest = requestTokens("/auth/refresh", {
    refresh_token: refreshToken,
  })
    .then((tokens) => {
      saveTokens(tokens)
      return tokens
    })
    .catch((error: unknown) => {
      clearTokens()
      throw error
    })
    .finally(() => {
      refreshRequest = null
    })

  return refreshRequest
}

export async function authenticatedFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  let accessToken = getAccessToken()

  if (!accessToken) {
    accessToken = (await refreshSession()).access_token
  }

  const apiBase = new URL(`${API_BASE_URL}/`)
  const requestUrl = new URL(path, apiBase)
  if (requestUrl.origin !== apiBase.origin) {
    throw new Error("API requests must use the configured API host.")
  }

  const request = new Request(requestUrl, init)

  const send = (token: string) => {
    const headers = new Headers(request.headers)
    headers.set("Authorization", `Bearer ${token}`)

    return fetch(new Request(request.clone(), { headers }))
  }

  const response = await send(accessToken)

  if (response.status !== 401) {
    return response
  }

  const tokens = await refreshSession()
  const retriedResponse = await send(tokens.access_token)

  if (retriedResponse.status === 401) {
    clearTokens()
  }

  return retriedResponse
}
