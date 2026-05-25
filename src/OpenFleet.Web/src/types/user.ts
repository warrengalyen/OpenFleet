import type { UserRole } from '@/types/auth'

export interface UserResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  isActive: boolean
  departmentId: string
  departmentName: string | null
  createdAt: string
}

export function userDisplayName(user: Pick<UserResponse, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`.trim()
}
