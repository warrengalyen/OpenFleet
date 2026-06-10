import { describe, expect, it } from 'vitest'
import { vehicleFormSchema } from '@/features/vehicles/schemas'

describe('vehicleFormSchema', () => {
  const valid = {
    vin: '1HGBH41JXMN109186',
    licensePlate: 'ABC123',
    make: 'Ford',
    model: 'Transit',
    year: 2022,
    mileage: 15000,
    status: 'Active' as const,
    departmentId: 'dept-1',
  }

  it('accepts valid vehicle data', () => {
    expect(vehicleFormSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects VIN with invalid characters', () => {
    const result = vehicleFormSchema.safeParse({ ...valid, vin: 'IOQ123' })
    expect(result.success).toBe(false)
  })

  it('rejects empty license plate', () => {
    const result = vehicleFormSchema.safeParse({ ...valid, licensePlate: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative mileage', () => {
    const result = vehicleFormSchema.safeParse({ ...valid, mileage: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects year outside allowed range', () => {
    const result = vehicleFormSchema.safeParse({ ...valid, year: 1800 })
    expect(result.success).toBe(false)
  })

  it('requires department selection', () => {
    const result = vehicleFormSchema.safeParse({ ...valid, departmentId: '' })
    expect(result.success).toBe(false)
  })
})
