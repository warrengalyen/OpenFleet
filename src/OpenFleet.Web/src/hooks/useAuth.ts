/**
 * Auth hooks - re-exported from AuthContext for convenience.
 * All auth state lives in AuthProvider; these are thin accessors.
 */
export { useAuth } from '@/context/AuthContext'

import { useAuth } from '@/context/AuthContext'

/** Returns true when a valid session and loaded user profile exist. */
export function useIsAuthenticated(): boolean {
  return useAuth().isAuthenticated
}

/** Returns the current user profile, or null when not authenticated. */
export function useCurrentUser() {
  const { user, isLoading } = useAuth()
  return { data: user, isLoading }
}

/** Returns the login mutation function and pending state. */
export function useLogin() {
  const { login, isLoggingIn } = useAuth()
  return {
    mutateAsync: login,
    isPending: isLoggingIn,
  }
}

/** Returns a logout handler that clears session and redirects to login. */
export function useLogout() {
  return useAuth().logout
}
