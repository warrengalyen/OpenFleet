import { type LucideIcon, InboxIcon } from 'lucide-react'
import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-8 py-16 text-center dark:border-gray-700 dark:bg-gray-900"
      role="status"
      aria-label={title}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mb-6 max-w-xs text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action}
    </div>
  )
}
