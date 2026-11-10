import type { Task, TaskDraft, TaskUpdate } from '../types/task'

export type AuthUser = {
  id: string
  email: string
}

type TokenPair = {
  access: string
  refresh: string
}

type AuthResponse = TokenPair & {
  user?: AuthUser
}

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api' : '')
const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '')
const TOKEN_STORAGE_KEY = 'taskflow.auth'

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshRequest: Promise<boolean> | null = null

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

function saveTokens(tokens: TokenPair) {
  accessToken = tokens.access
  refreshToken = tokens.refresh
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function restoreTokens() {
  const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!stored) return false

  try {
    const tokens = JSON.parse(stored) as Partial<TokenPair>
    if (typeof tokens.access !== 'string' || typeof tokens.refresh !== 'string') {
      clearTokens()
      return false
    }
    accessToken = tokens.access
    refreshToken = tokens.refresh
    return true
  } catch {
    clearTokens()
    return false
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return fallback

  const body = payload as Record<string, unknown>
  if (typeof body.detail === 'string') return body.detail
  const messages = Object.entries(body).flatMap(([field, value]) => {
    const values = Array.isArray(value) ? value : [value]
    return values
      .filter((item): item is string => typeof item === 'string')
      .map((item) => field === 'non_field_errors' ? item : `${field}: ${item}`)
  })
  return messages.join(' ') || fallback
}

async function refreshAccessToken() {
  if (!refreshToken) return false
  if (refreshRequest) return refreshRequest

  refreshRequest = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
    if (!response.ok) {
      clearTokens()
      return false
    }
    const tokens = await response.json() as Partial<TokenPair>
    if (typeof tokens.access !== 'string' || typeof tokens.refresh !== 'string') {
      clearTokens()
      throw new Error('The API returned an invalid token response.')
    }
    saveTokens({ access: tokens.access, refresh: tokens.refresh })
    return true
  })()

  try {
    return await refreshRequest
  } finally {
    refreshRequest = null
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error('NEXT_PUBLIC_API_URL is not configured.')
  const makeRequest = () => {
    const headers = new Headers(init.headers)
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    return fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  }

  let response = await makeRequest()
  if (response.status === 401 && refreshToken && !path.includes('/auth/token/')) {
    if (await refreshAccessToken()) response = await makeRequest()
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as unknown
    throw new ApiError(errorMessage(payload, `The request failed (${response.status}).`), response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function signIn(email: string, password: string) {
  const tokens = await apiRequest<TokenPair>('/auth/token/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  saveTokens(tokens)
  try {
    return await getCurrentUser()
  } catch (cause) {
    clearTokens()
    throw cause
  }
}

export function signUp(email: string, password: string) {
  return apiRequest<{ detail: string }>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function verifyEmail(uid: string, token: string) {
  return apiRequest<{ detail: string }>('/auth/verify-email/', {
    method: 'POST',
    body: JSON.stringify({ uid, token }),
  })
}

export function resendVerification(email: string) {
  return apiRequest<{ detail: string }>('/auth/resend-verification/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function getCurrentUser() {
  return apiRequest<AuthUser>('/auth/me/')
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ detail: string }>('/auth/password-reset/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function confirmPasswordReset(uid: string, token: string, password: string) {
  return apiRequest<{ detail: string }>('/auth/password-reset/confirm/', {
    method: 'POST',
    body: JSON.stringify({ uid, token, password }),
  })
}

export async function signOut() {
  const currentRefreshToken = refreshToken
  try {
    if (currentRefreshToken) {
      await apiRequest<void>('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: currentRefreshToken }),
      })
    }
  } finally {
    clearTokens()
  }
}

export function listTasks() {
  return apiRequest<Task[]>('/tasks/')
}

export function createTask(draft: TaskDraft) {
  return apiRequest<Task>('/tasks/', { method: 'POST', body: JSON.stringify(draft) })
}

export function updateTask(taskId: string, changes: TaskUpdate) {
  return apiRequest<Task>(`/tasks/${taskId}/`, { method: 'PATCH', body: JSON.stringify(changes) })
}

export function deleteTask(taskId: string) {
  return apiRequest<void>(`/tasks/${taskId}/`, { method: 'DELETE' })
}
