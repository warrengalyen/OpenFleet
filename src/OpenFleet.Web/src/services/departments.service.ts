import { api } from '@/lib/api'
import type { DepartmentResponse } from '@/types'

export const departmentsService = {
  async list(): Promise<DepartmentResponse[]> {
    const { data } = await api.get<DepartmentResponse[]>('/departments')
    return data
  },

  async get(id: string): Promise<DepartmentResponse> {
    const { data } = await api.get<DepartmentResponse>(`/departments/${id}`)
    return data
  },
}
