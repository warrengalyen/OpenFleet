import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center dark:bg-gray-950">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950">
        <FileQuestion className="h-8 w-8 text-brand-600 dark:text-brand-400" aria-hidden="true" />
      </div>
      <p className="mb-2 text-6xl font-bold text-brand-600 dark:text-brand-400">404</p>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">Page not found</h1>
      <p className="mb-8 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:bg-brand-500 dark:hover:bg-brand-400"
      >
        Go to dashboard
      </Link>
    </div>
  )
}
