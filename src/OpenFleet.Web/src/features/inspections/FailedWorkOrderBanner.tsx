import { Link } from 'react-router-dom'
import { AlertTriangle, ExternalLink } from 'lucide-react'

interface FailedWorkOrderBannerProps {
  workOrderId?: string
  variant?: 'detail' | 'form'
}

export function FailedWorkOrderBanner({
  workOrderId,
  variant = 'detail',
}: FailedWorkOrderBannerProps) {
  if (variant === 'form') {
    return (
      <div
        role="alert"
        className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      >
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div>
          <p className="font-medium">Failed inspections create a work order</p>
          <p className="mt-1 text-amber-800 dark:text-amber-300">
            Saving with status <strong>Failed</strong> will automatically create a high-priority work
            order titled &quot;Inspection Failure&quot; for the selected vehicle or asset.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
        <div>
          <p className="text-sm font-medium text-red-900 dark:text-red-200">
            This inspection failed and generated a work order
          </p>
          <p className="mt-1 text-sm text-red-800 dark:text-red-300">
            A high-priority work order was created automatically to address the failure.
          </p>
        </div>
      </div>
      <Link
        to={`/work-orders/${workOrderId}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700"
      >
        View work order
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  )
}
