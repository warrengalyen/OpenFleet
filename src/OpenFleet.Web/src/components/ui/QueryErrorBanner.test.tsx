import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryErrorBanner } from '@/components/ui/QueryErrorBanner'

describe('QueryErrorBanner', () => {
  it('is hidden when show is false', () => {
    render(<QueryErrorBanner show={false} message="Failed" onRetry={vi.fn()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders alert with retry action', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<QueryErrorBanner show message="Failed to load parts." onRetry={onRetry} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/failed to load parts/i)

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
