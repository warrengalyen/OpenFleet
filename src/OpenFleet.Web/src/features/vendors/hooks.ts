import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vendorsService } from '@/services/vendors.service'
import type { CreateVendorRequest, UpdateVendorRequest, VendorFilterRequest } from '@/types'

export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: VendorFilterRequest) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
}

export function useVendors(filters: VendorFilterRequest = {}) {
  return useQuery({
    queryKey: vendorKeys.list(filters),
    queryFn: () => vendorsService.list(filters),
  })
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => vendorsService.get(id),
    enabled: !!id,
  })
}

export function useCreateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateVendorRequest) => vendorsService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateVendorRequest) => vendorsService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all })
      void queryClient.invalidateQueries({ queryKey: vendorKeys.detail(id) })
    },
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vendorsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}
