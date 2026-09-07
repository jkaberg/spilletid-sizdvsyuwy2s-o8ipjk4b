import { ApiResponse } from "../../shared/types"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Merge headers from init with defaults, and include auth token if available
  const headers = new Headers(init?.headers as HeadersInit)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Safely read token from localStorage (guard for non-browser environments)
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('heimdal_auth_token') : null
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  } catch (e) {
    // ignore localStorage access errors
  }

  const res = await fetch(path, { ...init, headers })
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success || json.data === undefined) throw new Error(json.error || 'Request failed')
  return json.data
}