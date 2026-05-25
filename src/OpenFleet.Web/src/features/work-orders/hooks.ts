import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workOrdersService } from '@/services/workOrders.service'
import { usersService } from '@/services/users.service'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy, hasPolicy } from '@/lib/auth'
import type {
  AddNoteRequest,
  CreateMaintenanceRecordRequest,
  CreateWorkOrderRequest,
  RecordLaborRequest,
  TransitionStatusRequest,
  UpdateWorkOrderRequest,
  WorkOrderFilterRequest,
  WorkOrderStatus,
} from '@/types'
import { userDisplayName, type UserResponse } from '@/types/user'

export const workOrderKeys = {
  all: ['workorders'] as const,
  lists: () => [...workOrderKeys.all, 'list'] as const,
  list: (filters: WorkOrderFilterRequest) => [...workOrderKeys.lists(), filters] as const,
  details: () => [...workOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...workOrderKeys.details(), id] as const,
  notes: (id: string) => [...workOrderKeys.all, 'notes', id] as const,
  maintenanceRecord: (id: string) => [...workOrderKeys.all, 'maintenance-record', id] as const,
}

const ASSIGNABLE_ROLES = ['Technician', 'Supervisor', 'FleetManager', 'Administrator'] as const

export function useWorkOrders(filters: WorkOrderFilterRequest = {}) {
  return useQuery({
    queryKey: workOrderKeys.list(filters),
    queryFn: () => workOrdersService.list(filters),
  })
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: workOrderKeys.detail(id),
    queryFn: () => workOrdersService.get(id),
    enabled: !!id,
  })
}

export function useWorkOrderNotes(id: string) {
  return useQuery({
    queryKey: workOrderKeys.notes(id),
    queryFn: () => workOrdersService.getNotes(id),
    enabled: !!id,
  })
}

export function useAssignableUsers() {
  const { user } = useAuth()
  const isAdmin = user ? hasPolicy(user.role, AuthPolicy.AdminOnly) : false

  const adminQuery = useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: usersService.list,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
    select: (users) =>
      users.filter(
        (u) => u.isActive && ASSIGNABLE_ROLES.includes(u.role as (typeof ASSIGNABLE_ROLES)[number]),
      ),
  })

  const selfOption: UserResponse[] =
    user
      ? [
          {
            id: user.userId,
            firstName: user.fullName.split(' ')[0] ?? user.fullName,
            lastName: user.fullName.split(' ').slice(1).join(' ') || '',
            email: user.email,
            role: user.role,
            isActive: true,
            departmentId: user.departmentId,
            departmentName: null,
            createdAt: '',
          },
        ]
      : []

  if (isAdmin) {
    return {
      users: adminQuery.data ?? [],
      isLoading: adminQuery.isLoading,
      isError: adminQuery.isError,
    }
  }

  return {
    users: selfOption,
    isLoading: false,
    isError: false,
  }
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateWorkOrderRequest) => workOrdersService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
    },
  })
}

export function useUpdateWorkOrder(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateWorkOrderRequest) => workOrdersService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })
}

export function useTransitionWorkOrderStatus(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: TransitionStatusRequest) =>
      workOrdersService.transitionStatus(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })
}

export function useCancelWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workOrdersService.cancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
    },
  })
}

export function useAddWorkOrderNote(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: AddNoteRequest) => workOrdersService.addNote(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.notes(id) })
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })
}

export function useRecordLabor(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: RecordLaborRequest) => workOrdersService.recordLabor(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })
}

export function useLinkMaintenanceRecord(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateMaintenanceRecordRequest) =>
      workOrdersService.linkMaintenanceRecord(id, request),
    onSuccess: (record) => {
      queryClient.setQueryData(workOrderKeys.maintenanceRecord(id), record)
      void queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })
}

/** Kanban column order matching workflow progression. */
export const KANBAN_COLUMNS: WorkOrderStatus[] = [
  'Open',
  'InProgress',
  'WaitingForParts',
  'Completed',
  'Cancelled',
]

export { userDisplayName }
