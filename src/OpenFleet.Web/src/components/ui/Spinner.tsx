import { clsx } from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** When true, parent provides the accessible loading label. */
  decorative?: boolean
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

export function Spinner({ size = 'md', className, decorative = false }: SpinnerProps) {
  return (
    <div
      role={decorative ? undefined : 'status'}
      aria-label={decorative ? undefined : 'Loading'}
      aria-hidden={decorative ? true : undefined}
      className={clsx(
        'rounded-full border-gray-200 border-t-brand-600 animate-spin dark:border-gray-700 dark:border-t-brand-400',
        sizes[size],
        className,
      )}
    />
  )
}
