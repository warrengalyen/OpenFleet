export interface CreateMaintenanceScheduleRequest {
  name: string
  description?: string
  vehicleId?: string
  assetId?: string
  mileageInterval?: number
  dayInterval?: number
}

export interface UpdateMaintenanceScheduleRequest {
  name?: string
  description?: string
  vehicleId?: string | null
  assetId?: string | null
  mileageInterval?: number | null
  dayInterval?: number | null
  isActive?: boolean
}

export interface MarkPerformedRequest {
  performedAt: string
  mileage?: number | null
}

export interface MaintenanceScheduleResponse {
  id: string
  name: string
  description: string
  vehicleId: string | null
  vehicleDescription: string | null
  assetId: string | null
  assetDescription: string | null
  mileageInterval: number | null
  dayInterval: number | null
  lastPerformedAt: string | null
  lastPerformedMileage: number | null
  isActive: boolean
  isDue: boolean
  nextDueDate: string | null
  nextDueMileage: number | null
  daysOverdue: number | null
  milesOverdue: number | null
  createdAt: string
}

export interface DueScheduleEntry {
  scheduleId: string
  scheduleName: string
  isDueByDate: boolean | null
  isDueByMileage: boolean | null
  nextDueDate: string | null
  nextDueMileage: number | null
  daysOverdue: number | null
  milesOverdue: number | null
}

export interface VehicleDueForServiceResponse {
  vehicleId: string | null
  vehicleDescription: string | null
  assetId: string | null
  assetDescription: string | null
  currentMileage: number | null
  dueSchedules: DueScheduleEntry[]
}
