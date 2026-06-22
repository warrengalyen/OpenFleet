import type { DepartmentResponse } from '@/types'

export function createTestDepartment(
  overrides: Partial<DepartmentResponse> = {},
): DepartmentResponse {
  return {
    id: 'dept-1',
    name: 'Operations',
    code: 'OPS',
    vehicleCount: 2,
    userCount: 1,
    assetCount: 0,
    hasAssignments: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    ...overrides,
  }
}
