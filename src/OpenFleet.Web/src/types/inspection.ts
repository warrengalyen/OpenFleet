export type InspectionStatus = 'Passed' | 'Failed' | 'NeedsReview'

export interface InspectionResponse {
  id: string
  vehicleId: string | null
  vehicleDescription: string | null
  assetId: string | null
  assetDescription: string | null
  inspectorUserId: string
  inspectorName: string
  inspectedAt: string
  status: InspectionStatus
  notes: string
  generatedWorkOrderId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateInspectionRequest {
  vehicleId?: string
  assetId?: string
  inspectorUserId: string
  inspectedAt: string
  status: InspectionStatus
  notes?: string
}
