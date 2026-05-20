import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { tokenStorage } from '@/lib/api'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (!tokenStorage.isValid()) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return <LoadingSpinner fullPage />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
