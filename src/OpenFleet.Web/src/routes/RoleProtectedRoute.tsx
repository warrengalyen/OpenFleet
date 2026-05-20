import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { AuthPolicy } from '@/lib/auth'
import { ProtectedRoute } from './ProtectedRoute'

interface RoleProtectedRouteProps {
  policy: AuthPolicy
  children: ReactNode
}

export function RoleProtectedRoute({ policy, children }: RoleProtectedRouteProps) {
  const { hasPolicy } = useAuth()

  return (
    <ProtectedRoute>
      {hasPolicy(policy) ? children : <Navigate to="/unauthorized" replace />}
    </ProtectedRoute>
  )
}
