import { type ReactNode } from 'react'

interface PageTitleProps {
  title: string
  subtitle?: string
  /** Slot for action buttons rendered on the right */
  actions?: ReactNode
}

export function PageTitle({ title, subtitle, actions }: PageTitleProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
