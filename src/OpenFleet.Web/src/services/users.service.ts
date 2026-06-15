import { api } from '@/lib/api'
import { normalizeUserRole } from '@/lib/auth'
import type { CreateUserRequest, UpdateUserRequest, UserResponse } from '@/types/user'

function normalizeUser(user: UserResponse): UserResponse {
  return { ...user, role: normalizeUserRole(user.role) }
}

export const usersService = {
  async list(): Promise<UserResponse[]> {
    const { data } = await api.get<UserResponse[]>('/users')
    return data.map(normalizeUser)
  },

  async get(id: string): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>(`/users/${id}`)
    return normalizeUser(data)
  },

  async create(request: CreateUserRequest): Promise<UserResponse> {
    const { data } = await api.post<UserResponse>('/users', request)
    return normalizeUser(data)
  },

  async update(id: string, request: UpdateUserRequest): Promise<UserResponse> {
    const { data } = await api.put<UserResponse>(`/users/${id}`, request)
    return normalizeUser(data)
  },

  async deactivate(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },
}
