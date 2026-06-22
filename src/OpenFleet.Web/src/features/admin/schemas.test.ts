import { describe, expect, it } from 'vitest'
import { departmentFormSchema } from '@/features/admin/schemas'

describe('departmentFormSchema', () => {
  it('accepts valid department values', () => {
    const result = departmentFormSchema.safeParse({ name: 'Operations', code: 'OPS' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = departmentFormSchema.safeParse({ name: '', code: 'OPS' })
    expect(result.success).toBe(false)
  })

  it('rejects lowercase code', () => {
    const result = departmentFormSchema.safeParse({ name: 'Operations', code: 'ops' })
    expect(result.success).toBe(false)
  })

  it('rejects code longer than 20 characters', () => {
    const result = departmentFormSchema.safeParse({
      name: 'Operations',
      code: 'A'.repeat(21),
    })
    expect(result.success).toBe(false)
  })
})
