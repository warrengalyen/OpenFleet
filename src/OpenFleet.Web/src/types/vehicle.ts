export type VehicleStatus = 'Active' | 'InMaintenance' | 'Retired' | 'Decommissioned'

export interface VehicleResponse {
  id: string
  vin: string
  licensePlate: string
  make: string
  model: string
  year: number
  mileage: number
  status: VehicleStatus
  departmentId: string
  departmentName: string
  createdAt: string
  updatedAt: string
}

export interface CreateVehicleRequest {
  vin: string
  licensePlate: string
  make: string
  model: string
  year: number
  mileage: number
  status: VehicleStatus
  departmentId: string
}

export interface UpdateVehicleRequest {
  vin?: string
  licensePlate?: string
  make?: string
  model?: string
  year?: number
  mileage?: number
  status?: VehicleStatus
  departmentId?: string
}

export interface VehicleFilterRequest {
  status?: VehicleStatus
  make?: string
  model?: string
  year?: number
  departmentId?: string
  search?: string
}
