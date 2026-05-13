import { clsx } from 'clsx'
import { type LucideIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

interface StatCardProps {
  label: string
  value: number | string | undefined
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  isLoading?: boolean
  sub?: string
  emphasis?: boolean
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-brand-600',
  iconBg = 'bg-brand-50',
  isLoading,
  sub,
  emphasis,
}: StatCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border bg-white p-5 shadow-sm',
        emphasis ? 'border-brand-200 ring-1 ring-brand-200' : 'border-gray-200',
      )}
    >
      <div className="flex items-start justify-between">
        <div className={clsx('rounded-lg p-2.5', iconBg)}>
          <Icon className={clsx('h-5 w-5', iconColor)} />
        </div>
        {isLoading && <Spinner size="sm" />}
      </div>

      <div className="mt-4">
        {isLoading || value === undefined ? (
          <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        )}
        <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}
