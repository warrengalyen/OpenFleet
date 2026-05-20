import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { roleLabel } from '@/lib/auth'

export function UnauthorizedPage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950">
          <ShieldOff className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          You do not have permission to view this page.
          {user && (
            <>
              {' '}
              Your role is{' '}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {roleLabel[user.role]}
              </span>
              .
            </>
          )}
        </p>

        <div className="mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
