import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inspectionsService } from '@/services/inspections.service'
import type {
  CreateInspectionRequest,
  InspectionFilterRequest,
  UpdateInspectionRequest,
} from '@/types'

export const inspectionKeys = {
  all: ['inspections'] as const,
  lists: () => [...inspectionKeys.all, 'list'] as const,
  list: (filters: InspectionFilterRequest) => [...inspectionKeys.lists(), filters] as const,
  details: () => [...inspectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...inspectionKeys.details(), id] as const,
}

export function useInspections(filters: InspectionFilterRequest = {}) {
  return useQuery({
    queryKey: inspectionKeys.list(filters),
    queryFn: () => inspectionsService.list(filters),
  })
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: () => inspectionsService.get(id),
    enabled: !!id,
  })
}

export function useCreateInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateInspectionRequest) => inspectionsService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inspectionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['workorders'] })
    },
  })
}

export function useUpdateInspection(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateInspectionRequest) => inspectionsService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inspectionKeys.all })
      void queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: ['workorders'] })
    },
  })
}
