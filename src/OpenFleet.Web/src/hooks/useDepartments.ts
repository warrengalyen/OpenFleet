import { useQuery } from '@tanstack/react-query'
import { departmentsService } from '@/services/departments.service'

export const departmentKeys = {
  all: ['departments'] as const,
  detail: (id: string) => ['departments', id] as const,
}

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: departmentsService.list,
    staleTime: 5 * 60 * 1000,
  })
}
