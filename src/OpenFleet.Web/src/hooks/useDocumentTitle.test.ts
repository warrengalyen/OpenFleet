import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

describe('useDocumentTitle', () => {
  it('sets document title with app suffix', () => {
    document.title = 'OpenFleet'
    renderHook(() => useDocumentTitle('Dashboard'))
    expect(document.title).toBe('Dashboard | OpenFleet')
  })

  it('does not duplicate app name when already present', () => {
    document.title = 'OpenFleet'
    renderHook(() => useDocumentTitle('OpenFleet Admin'))
    expect(document.title).toBe('OpenFleet Admin')
  })
})
