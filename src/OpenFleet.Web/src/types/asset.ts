export type AssetStatus = 'Available' | 'InUse' | 'UnderMaintenance' | 'Decommissioned'

export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Damaged'

export interface AssetResponse {
  id: string
  assetTag: string
  name: string
  type: string
  condition: AssetCondition
  status: AssetStatus
  departmentId: string | null
  departmentName: string | null
  vehicleId: string | null
  vehicleDescription: string | null
  purchaseDate: string
  createdAt: string
  updatedAt: string
}

export interface CreateAssetRequest {
  assetTag: string
  name: string
  type: string
  condition: AssetCondition
  status: AssetStatus
  departmentId: string
  vehicleId?: string | null
}

export interface UpdateAssetRequest {
  assetTag?: string
  name?: string
  type?: string
  condition?: AssetCondition
  status?: AssetStatus
  departmentId?: string
  vehicleId?: string | null
}

export interface AssetFilterRequest {
  status?: AssetStatus
  type?: string
  condition?: AssetCondition
  departmentId?: string
  vehicleId?: string
}
