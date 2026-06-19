import { api } from '@/lib/api'
import type {
  CreateDepartmentRequest,
  DepartmentResponse,
  UpdateDepartmentRequest,
} from '@/types'

export const departmentsService = {
  async list(): Promise<DepartmentResponse[]> {
    const { data } = await api.get<DepartmentResponse[]>('/departments')
    return data
  },

  async get(id: string): Promise<DepartmentResponse> {
    const { data } = await api.get<DepartmentResponse>(`/departments/${id}`)
    return data
  },

  async create(request: CreateDepartmentRequest): Promise<DepartmentResponse> {
    const { data } = await api.post<DepartmentResponse>('/departments', request)
    return data
  },

  async update(id: string, request: UpdateDepartmentRequest): Promise<DepartmentResponse> {
    const { data } = await api.put<DepartmentResponse>(`/departments/${id}`, request)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/departments/${id}`)
  },
}
