import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { tokenStorage } from '@/lib/api'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!tokenStorage.get()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
