import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Wrench } from 'lucide-react'
import { ReportShell } from '@/features/reports/ReportShell'

describe('ReportShell', () => {
  it('shows loading state', () => {
    render(
      <ReportShell
        title="Maintenance cost"
        isLoading
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      >
        <div>Report body</div>
      </ReportShell>,
    )

    expect(screen.getByRole('status', { name: /loading maintenance cost/i })).toBeInTheDocument()
  })

  it('shows error state on load failure', () => {
    render(
      <ReportShell
        title="Maintenance cost"
        isLoading={false}
        isError
        data={undefined}
        onRetry={vi.fn()}
      >
        <div>Report body</div>
      </ReportShell>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/failed to load this report/i)
  })

  it('shows empty state when configured', () => {
    render(
      <ReportShell
        title="Maintenance cost"
        isLoading={false}
        isError={false}
        data={[]}
        isEmpty
        emptyIcon={Wrench}
        emptyTitle="No maintenance data"
        onRetry={vi.fn()}
      >
        <div>Report body</div>
      </ReportShell>,
    )

    expect(screen.getByText('No maintenance data')).toBeInTheDocument()
  })

  it('renders children when data is available', () => {
    render(
      <ReportShell
        title="Maintenance cost"
        isLoading={false}
        isError={false}
        data={{ vehicles: [] }}
        onRetry={vi.fn()}
      >
        <div>Report body</div>
      </ReportShell>,
    )

    expect(screen.getByText('Report body')).toBeInTheDocument()
  })
})
