import { api, tokenStorage } from '@/lib/api'
import { normalizeUserRole } from '@/lib/auth'
import type { CurrentUserResponse, LoginRequest, LoginResponse } from '@/types'

function normalizeAuthUser<T extends { role: unknown }>(user: T): T & { role: CurrentUserResponse['role'] } {
  return { ...user, role: normalizeUserRole(user.role) }
}

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', request)
    tokenStorage.set(data.token, data.expiresAt)
    return normalizeAuthUser(data)
  },

  async me(): Promise<CurrentUserResponse> {
    const { data } = await api.get<CurrentUserResponse>('/auth/me')
    return normalizeAuthUser(data)
  },

  logout(): void {
    tokenStorage.clear()
  },
}
