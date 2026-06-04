interface QueryErrorBannerProps {
  show: boolean
  message: string
  onRetry: () => void
}

export function QueryErrorBanner({ show, message, onRetry }: QueryErrorBannerProps) {
  if (!show) return null

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {message}{' '}
      <button type="button" onClick={onRetry} className="underline">
        Try again
      </button>
    </div>
  )
}
