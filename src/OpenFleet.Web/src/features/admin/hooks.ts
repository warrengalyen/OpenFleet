import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auditService } from '@/services/audit.service'
import { departmentsService } from '@/services/departments.service'
import { usersService } from '@/services/users.service'
import type { AuditHistoryFilter } from '@/types/audit'
import { settingsService } from '@/services/settings.service'
import { settingsKeys } from '@/hooks/useSettings'
import type { CreateDepartmentRequest, UpdateDepartmentRequest } from '@/types/department'
import type { UpdateApplicationSettingsRequest } from '@/types/settings'
import type { CreateUserRequest, UpdateUserRequest } from '@/types/user'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: () => [...userKeys.lists()] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filter: AuditHistoryFilter) => [...auditKeys.lists(), filter] as const,
  details: () => [...auditKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditKeys.details(), id] as const,
}

export const adminDepartmentKeys = {
  all: ['departments'] as const,
  detail: (id: string) => [...adminDepartmentKeys.all, id] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: usersService.list,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.get(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateUserRequest) => usersService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateUserRequest) => usersService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersService.deactivate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useAuditLogs(filter: AuditHistoryFilter) {
  return useQuery({
    queryKey: auditKeys.list(filter),
    queryFn: () => auditService.getHistory(filter),
  })
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => auditService.getById(id),
    enabled: !!id,
  })
}

export function useDepartmentDetail(id: string) {
  return useQuery({
    queryKey: adminDepartmentKeys.detail(id),
    queryFn: () => departmentsService.get(id),
    enabled: !!id,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateDepartmentRequest) => departmentsService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDepartmentKeys.all })
    },
  })
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateDepartmentRequest) => departmentsService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDepartmentKeys.all })
      void queryClient.invalidateQueries({ queryKey: adminDepartmentKeys.detail(id) })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => departmentsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDepartmentKeys.all })
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateApplicationSettingsRequest) => settingsService.update(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })
}
