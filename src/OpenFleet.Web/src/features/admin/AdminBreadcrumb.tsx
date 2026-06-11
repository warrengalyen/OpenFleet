import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function AdminBreadcrumb({ title }: { title: string }) {
  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Administration · {title}
    </Link>
  )
}
