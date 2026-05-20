import { api, tokenStorage } from '@/lib/api'
import type { CurrentUserResponse, LoginRequest, LoginResponse } from '@/types'

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', request)
    tokenStorage.set(data.token, data.expiresAt)
    return data
  },

  async me(): Promise<CurrentUserResponse> {
    const { data } = await api.get<CurrentUserResponse>('/auth/me')
    return data
  },

  logout(): void {
    tokenStorage.clear()
  },
}
