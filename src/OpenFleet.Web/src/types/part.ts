export interface PartFilterRequest {
  search?: string
  vendorId?: string
  lowStockOnly?: boolean
}

export interface PartResponse {
  id: string
  name: string
  partNumber: string
  vendorId: string
  vendorName: string
  quantityOnHand: number
  unitCost: number
  totalValue: number
  isLowStock: boolean
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
}

export interface CreatePartRequest {
  name: string
  partNumber: string
  vendorId: string
  quantityOnHand: number
  unitCost: number
}

export interface UpdatePartRequest {
  name?: string
  partNumber?: string
  vendorId?: string
  quantityOnHand?: number
  unitCost?: number
}

export interface PartUsageHistoryEntry {
  occurredAt: string
  source: string
  previousQuantity: number | null
  newQuantity: number
  notes: string | null
}
