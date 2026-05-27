import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { maintenanceSchedulesService } from '@/services/maintenanceSchedules.service'
import type {
  CreateMaintenanceScheduleRequest,
  MarkPerformedRequest,
  UpdateMaintenanceScheduleRequest,
} from '@/types'

export const maintenanceKeys = {
  all: ['maintenance-schedules'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (activeOnly: boolean) => [...maintenanceKeys.lists(), { activeOnly }] as const,
  due: () => [...maintenanceKeys.all, 'due'] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
}

export function useMaintenanceSchedules(activeOnly = true) {
  return useQuery({
    queryKey: maintenanceKeys.list(activeOnly),
    queryFn: () => maintenanceSchedulesService.list(activeOnly),
  })
}

export function useMaintenanceDue() {
  return useQuery({
    queryKey: maintenanceKeys.due(),
    queryFn: maintenanceSchedulesService.getDue,
  })
}

export function useMaintenanceSchedule(id: string) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id),
    queryFn: () => maintenanceSchedulesService.get(id),
    enabled: !!id,
  })
}

export function useCreateMaintenanceSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateMaintenanceScheduleRequest) =>
      maintenanceSchedulesService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

export function useUpdateMaintenanceSchedule(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateMaintenanceScheduleRequest) =>
      maintenanceSchedulesService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) })
    },
  })
}

export function useDeactivateMaintenanceSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => maintenanceSchedulesService.deactivate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

export function useMarkMaintenancePerformed(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: MarkPerformedRequest) =>
      maintenanceSchedulesService.markPerformed(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) })
    },
  })
}
