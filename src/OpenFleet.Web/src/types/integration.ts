export type IntegrationSource =
  | 'FuelUsage'
  | 'VendorRepair'
  | 'PartsSupplier'
  | 'ExternalAsset'

export type IntegrationDirection = 'Import' | 'Export'

export type IntegrationStatus = 'Pending' | 'Success' | 'Failed' | 'Retrying'

export interface IntegrationLogResponse {
  id: string
  source: IntegrationSource
  direction: IntegrationDirection
  status: IntegrationStatus
  payload: string | null
  errorMessage: string | null
  attemptCount: number
  lastAttemptAt: string | null
  nextRetryAt: string | null
  recordsProcessed: number | null
  createdAt: string
  updatedAt: string
}

export interface IntegrationHistoryResponse {
  items: IntegrationLogResponse[]
  totalCount: number
  page: number
  pageSize: number
}

export interface IntegrationHistoryFilter {
  source?: IntegrationSource
  status?: IntegrationStatus
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}
