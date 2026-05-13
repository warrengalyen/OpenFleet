import { Spinner } from './ui/Spinner'

interface LoadingSpinnerProps {
  message?: string
  fullPage?: boolean
}

export function LoadingSpinner({ message = 'Loading…', fullPage = false }: LoadingSpinnerProps) {
  const inner = (
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        {inner}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-16">{inner}</div>
}
