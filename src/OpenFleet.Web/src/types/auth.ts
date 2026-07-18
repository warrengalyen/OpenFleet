export type UserRole =
  | 'Viewer'
  | 'Technician'
  | 'Supervisor'
  | 'FleetManager'
  | 'Administrator'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresAt: string
  userId: string
  email: string
  role: UserRole
  fullName: string
}

export interface CurrentUserResponse {
  userId: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  fullName: string
  departmentId: string
  isDemoUser: boolean
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  currentPassword?: string
  newPassword?: string
}
