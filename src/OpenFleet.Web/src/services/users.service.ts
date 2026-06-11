import { api } from '@/lib/api'
import type { CreateUserRequest, UpdateUserRequest, UserResponse } from '@/types/user'

export const usersService = {
  async list(): Promise<UserResponse[]> {
    const { data } = await api.get<UserResponse[]>('/users')
    return data
  },

  async get(id: string): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>(`/users/${id}`)
    return data
  },

  async create(request: CreateUserRequest): Promise<UserResponse> {
    const { data } = await api.post<UserResponse>('/users', request)
    return data
  },

  async update(id: string, request: UpdateUserRequest): Promise<UserResponse> {
    const { data } = await api.put<UserResponse>(`/users/${id}`, request)
    return data
  },

  async deactivate(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },
}
