import { api } from '@/lib/api'
import type { UserResponse } from '@/types/user'

export const usersService = {
  async list(): Promise<UserResponse[]> {
    const { data } = await api.get<UserResponse[]>('/users')
    return data
  },
}
