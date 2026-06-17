import { AlertCircle } from 'lucide-react'

interface QueryErrorBannerProps {
  show: boolean
  message: string
  onRetry: () => void
}

export function QueryErrorBanner({ show, message, onRetry }: QueryErrorBannerProps) {
  if (!show) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        {message}{' '}
        <button
          type="button"
          onClick={onRetry}
          className="rounded font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </p>
    </div>
  )
}
