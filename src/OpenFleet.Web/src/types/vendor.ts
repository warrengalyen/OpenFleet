export interface VendorFilterRequest {
  search?: string
}

export interface VendorResponse {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  partCount: number
  hasAssignedParts: boolean
  createdAt: string
  updatedAt: string
}

export interface VendorPartSummary {
  id: string
  name: string
  partNumber: string
  quantityOnHand: number
  isLowStock: boolean
}

export interface VendorDetailResponse extends VendorResponse {
  parts: VendorPartSummary[]
}

export interface CreateVendorRequest {
  name: string
  contactName: string
  email: string
  phone: string
  address: string
}

export interface UpdateVendorRequest {
  name?: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
}
