const ACCESS_TOKEN_KEY = "altri.auth.access"
const REFRESH_TOKEN_KEY = "altri.auth.refresh"

export type AuthTokens = {
  access_token: string
  refresh_token: string
  token_type: "bearer"
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
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error("Enter a placeholder account email.")
  }

  saveTokens({
    access_token: `demo-access-${normalizedEmail}`,
    refresh_token: `demo-refresh-${normalizedEmail}`,
    token_type: "bearer",
  })
}

export async function refreshSession(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error("Your session has expired. Please sign in.")
  }

  const tokens: AuthTokens = {
    access_token: refreshToken.replace("demo-refresh-", "demo-access-"),
    refresh_token: refreshToken,
    token_type: "bearer",
  }
  saveTokens(tokens)
  return tokens
}
