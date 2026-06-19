export interface DepartmentResponse {
  id: string
  name: string
  code: string
  vehicleCount: number
  userCount: number
  assetCount: number
  hasAssignments: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentRequest {
  name: string
  code: string
}

export interface UpdateDepartmentRequest {
  name?: string
  code?: string
}
