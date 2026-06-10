import { describe, expect, it } from 'vitest'
import { isQueryLoadFailure } from '@/lib/query'

describe('isQueryLoadFailure', () => {
  it('is true when errored with no data', () => {
    expect(isQueryLoadFailure(true, undefined)).toBe(true)
  })

  it('is false when errored but stale data exists', () => {
    expect(isQueryLoadFailure(true, [])).toBe(false)
  })

  it('is false when not errored', () => {
    expect(isQueryLoadFailure(false, undefined)).toBe(false)
  })
})
