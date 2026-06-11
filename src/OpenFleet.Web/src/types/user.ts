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

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  departmentId: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  role?: UserRole
  departmentId?: string
  isActive?: boolean
}

export function userDisplayName(user: Pick<UserResponse, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`.trim()
}
