import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <p className="mb-2 text-6xl font-bold text-brand-600">404</p>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="mb-8 text-gray-500">The page you're looking for doesn't exist.</p>
      <Link
        to="/dashboard"
        className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
