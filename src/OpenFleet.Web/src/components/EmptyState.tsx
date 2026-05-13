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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 px-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mb-6 text-sm text-gray-500 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
