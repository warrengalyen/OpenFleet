import axios, { type AxiosError } from 'axios'
import type { ProblemDetails } from '@/types'

const AUTH_TOKEN_KEY = 'openfleet_token'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach stored JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalise error responses
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ProblemDetails>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect to login
      localStorage.removeItem(AUTH_TOKEN_KEY)
      if (window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  },
)

export const tokenStorage = {
  get: () => localStorage.getItem(AUTH_TOKEN_KEY),
  set: (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(AUTH_TOKEN_KEY),
}

/** Extract the ProblemDetails payload from an AxiosError, or return a fallback. */
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
