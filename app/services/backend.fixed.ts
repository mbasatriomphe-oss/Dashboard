// Fixed backend helper (backend.fixed.ts)
// Keeps same public API as original backend.ts but fixes Authorization handling
const DEFAULT_BACKEND_URL = "/api"

export interface BackendEnvelope<T> {
  status?: string
  message?: string
  data?: T
  user?: T
  token?: string
  token_type?: string
}

export interface BackendAuthUser {
  id: number | string
  nom?: string
  post_nom?: string | null
  prenom?: string
  email: string
  role?: string
}

export function getBackendBaseUrl() {
  return DEFAULT_BACKEND_URL
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem("pos_token")
}

export function setStoredSession(token: string, user: unknown) {
  localStorage.setItem("pos_token", token)
  localStorage.setItem("pos_user", JSON.stringify(user))
}

export function clearStoredSession() {
  localStorage.removeItem("pos_token")
  localStorage.removeItem("pos_user")
}

export async function backendRequest<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers)

  headers.set("Accept", "application/json")

  const tokenToUse = token ?? getStoredToken()
  if (tokenToUse) {
    // Send as Bearer token — backend should accept this format
    headers.set("Authorization", `Bearer ${tokenToUse}`)
  }

  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const method = (init.method ?? "GET").toUpperCase()
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    keepalive: method === "GET",
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as BackendEnvelope<unknown>
      message = payload.message || message
    } catch {
      // ignore JSON parse errors and keep the generic status message
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
