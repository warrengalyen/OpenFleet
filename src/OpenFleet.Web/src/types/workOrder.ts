export type WorkOrderStatus =
  | 'Open'
  | 'InProgress'
  | 'WaitingForParts'
  | 'Completed'
  | 'Cancelled'

export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface WorkOrderResponse {
  id: string
  title: string
  description: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  vehicleId: string | null
  vehicleDescription: string | null
  assetId: string | null
  assetDescription: string | null
  assignedUserId: string | null
  assignedUserName: string | null
  laborHours: number
  completedAt: string | null
  noteCount: number
  allowedNextStatuses: WorkOrderStatus[]
  hasMaintenanceRecord: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkOrderNoteResponse {
  id: string
  workOrderId: string
  content: string
  authorName: string
  createdAt: string
}

export interface CreateWorkOrderRequest {
  title: string
  description?: string
  priority: WorkOrderPriority
  vehicleId?: string
  assetId?: string
  assignedUserId?: string
}

export interface TransitionStatusRequest {
  newStatus: WorkOrderStatus
}

export interface AddNoteRequest {
  content: string
  authorName: string
}

export interface RecordLaborRequest {
  hours: number
}
