import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { tokenStorage } from '@/lib/api'
import { hasPolicy, type AuthPolicy } from '@/lib/auth'
import type { CurrentUserResponse, LoginRequest, UserRole } from '@/types'

const ME_QUERY_KEY = ['auth', 'me'] as const

interface AuthContextValue {
  user: CurrentUserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingIn: boolean
  login: (request: LoginRequest) => Promise<void>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
  hasPolicy: (policy: AuthPolicy) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
  }, [])

  const logout = useCallback(() => {
    clearExpiryTimer()
    authService.logout()
    queryClient.clear()
    window.location.replace('/login')
  }, [clearExpiryTimer, queryClient])

  const scheduleExpiryLogout = useCallback(() => {
    clearExpiryTimer()
    const expiresAt = tokenStorage.getExpiresAt()
    if (!expiresAt) return

    const msUntilExpiry = new Date(expiresAt).getTime() - Date.now()
    if (msUntilExpiry <= 0) {
      logout()
      return
    }

    expiryTimerRef.current = setTimeout(() => {
      logout()
    }, msUntilExpiry)
  }, [clearExpiryTimer, logout])

  const {
    data: user,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.me,
    enabled: tokenStorage.isValid(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const loginMutation = useMutation({
    mutationFn: (request: LoginRequest) => authService.login(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
      scheduleExpiryLogout()
    },
  })

  const login = useCallback(
    async (request: LoginRequest) => {
      await loginMutation.mutateAsync(request)
    },
    [loginMutation],
  )

  useEffect(() => {
    if (tokenStorage.isValid()) {
      scheduleExpiryLogout()
    }
    return clearExpiryTimer
  }, [scheduleExpiryLogout, clearExpiryTimer])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: tokenStorage.isValid() && (isLoading || isFetching) && !user,
      isLoggingIn: loginMutation.isPending,
      login,
      logout,
      hasRole: (...roles: UserRole[]) =>
        !!user && roles.includes(user.role),
      hasPolicy: (policy: AuthPolicy) =>
        !!user && hasPolicy(user.role, policy),
    }),
    [user, isLoading, isFetching, loginMutation.isPending, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
