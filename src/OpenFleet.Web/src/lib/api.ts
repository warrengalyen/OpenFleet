import axios, { type AxiosError } from 'axios'
import type { ProblemDetails } from '@/types'
import { getTokenExpiry, isExpired } from './auth'

const AUTH_TOKEN_KEY = 'openfleet_token'
const AUTH_EXPIRES_KEY = 'openfleet_token_expires'

const apiOrigin = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: { 'Content-Type': 'application/json' },
})

function clearSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_EXPIRES_KEY)
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

// Attach stored JWT token on every request; reject if locally expired.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const expiresAt = localStorage.getItem(AUTH_EXPIRES_KEY)

  if (token && isExpired(expiresAt)) {
    clearSession()
    redirectToLogin()
    return Promise.reject(new axios.Cancel('Token expired'))
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalise error responses; clear session on 401 (except failed login attempts).
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ProblemDetails>) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      clearSession()
      redirectToLogin()
    }
    return Promise.reject(error)
  },
)

export const tokenStorage = {
  get: () => localStorage.getItem(AUTH_TOKEN_KEY),

  getExpiresAt: () => localStorage.getItem(AUTH_EXPIRES_KEY),

  set: (token: string, expiresAt?: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token)

    const resolvedExpiry =
      expiresAt ?? getTokenExpiry(token)?.toISOString() ?? null
    if (resolvedExpiry) {
      localStorage.setItem(AUTH_EXPIRES_KEY, resolvedExpiry)
    } else {
      localStorage.removeItem(AUTH_EXPIRES_KEY)
    }
  },

  clear: clearSession,

  isValid: () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return false
    return !isExpired(localStorage.getItem(AUTH_EXPIRES_KEY))
  },
}

function toValidationFieldName(apiKey: string): string | null {
  if (apiKey === 'request') return null
  if (apiKey.startsWith('$.')) return apiKey.slice(2)
  if (!apiKey) return null
  return apiKey.charAt(0).toLowerCase() + apiKey.slice(1)
}

/** Map API validation errors to form field names. */
export function getApiValidationErrors(error: unknown): Record<string, string> | null {
  const axiosError = error as AxiosError<ProblemDetails>
  const apiErrors = axiosError?.response?.data?.errors
  if (!apiErrors) return null

  const mapped: Record<string, string> = {}
  for (const [key, messages] of Object.entries(apiErrors)) {
    const field = toValidationFieldName(key)
    if (!field || !messages?.length) continue
    mapped[field] = messages[0]
  }

  return Object.keys(mapped).length > 0 ? mapped : null
}

/** Extract a user-facing message from an API error. */
export function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ProblemDetails & { error?: string; message?: string }>
  const data = axiosError?.response?.data
  const fieldErrors = getApiValidationErrors(error)

  if (fieldErrors) {
    const firstMessage = Object.values(fieldErrors)[0]
    if (firstMessage) return firstMessage
  }

  if (data?.detail) return data.detail
  if (data?.message) return data.message
  if (data?.title) return data.title
  if (data?.error) return data.error

  return 'Something went wrong. Please try again.'
}

/** @deprecated Use getApiErrorMessage instead. */
export function getProblemDetails(error: unknown): ProblemDetails {
  const axiosError = error as AxiosError<ProblemDetails>
  return (
    axiosError?.response?.data ?? {
      type: 'about:blank',
      title: 'An unexpected error occurred.',
      status: 0,
    }
  )
}
