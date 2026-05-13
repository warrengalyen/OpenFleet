import { clsx } from 'clsx'
import { type ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h2 className={clsx('text-base font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </h2>
  )
}

export function CardContent({ className, children }: CardProps) {
  return <div className={clsx('p-6', className)}>{children}</div>
}
