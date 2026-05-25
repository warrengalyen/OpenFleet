import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetsService } from '@/services/assets.service'
import type { AssetFilterRequest, CreateAssetRequest, UpdateAssetRequest } from '@/types'

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetFilterRequest) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
}

export function useAssets(filters: AssetFilterRequest = {}) {
  return useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: () => assetsService.list(filters),
  })
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetsService.get(id),
    enabled: !!id,
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateAssetRequest) => assetsService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}

export function useUpdateAsset(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateAssetRequest) => assetsService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all })
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) })
    },
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => assetsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}
