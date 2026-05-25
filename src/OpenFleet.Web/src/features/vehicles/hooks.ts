import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vehiclesService } from '@/services/vehicles.service'
import type { CreateVehicleRequest, UpdateVehicleRequest, VehicleFilterRequest } from '@/types'

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters: VehicleFilterRequest) => [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
}

export function useVehicles(filters: VehicleFilterRequest = {}) {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: () => vehiclesService.list(filters),
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehiclesService.get(id),
    enabled: !!id,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateVehicleRequest) => vehiclesService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
    },
  })
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateVehicleRequest) => vehiclesService.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vehiclesService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
    },
  })
}
