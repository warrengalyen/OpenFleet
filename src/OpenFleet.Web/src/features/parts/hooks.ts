import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { partsService } from '@/services/parts.service'
import type { CreatePartRequest, PartFilterRequest, UpdatePartRequest } from '@/types'

export const partKeys = {
  all: ['parts'] as const,
  lists: () => [...partKeys.all, 'list'] as const,
  list: (filters: PartFilterRequest) => [...partKeys.lists(), filters] as const,
  details: () => [...partKeys.all, 'detail'] as const,
  detail: (id: string) => [...partKeys.details(), id] as const,
  usageHistory: (id: string) => [...partKeys.all, 'usage-history', id] as const,
}

export function useParts(filters: PartFilterRequest = {}) {
  return useQuery({
    queryKey: partKeys.list(filters),
    queryFn: () => partsService.list(filters),
  })
}

export function usePart(id: string) {
  return useQuery({
    queryKey: partKeys.detail(id),
    queryFn: () => partsService.get(id),
    enabled: !!id,
  })
}

export function usePartUsageHistory(id: string) {
  return useQuery({
    queryKey: partKeys.usageHistory(id),
    queryFn: () => partsService.getUsageHistory(id),
    enabled: !!id,
  })
}

export function useCreatePart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreatePartRequest) => partsService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['vendors'] })
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useUpdatePart(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdatePartRequest) => partsService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partKeys.all })
      void queryClient.invalidateQueries({ queryKey: partKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: partKeys.usageHistory(id) })
      void queryClient.invalidateQueries({ queryKey: ['vendors'] })
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useDeletePart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => partsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['vendors'] })
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
