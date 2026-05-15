import { clsx } from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
  error?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, ...props }, ref) => {
    const inputId = id ?? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`
    return (
      <div className={clsx('flex items-start gap-3', className)}>
        <div className="flex h-5 items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            {...props}
            className={clsx(
              'h-4 w-4 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
              'dark:bg-gray-800',
              error
                ? 'border-red-300 text-red-600 focus:ring-red-300/40'
                : 'border-gray-300 text-brand-600 focus:ring-brand-300/40 dark:border-gray-600 dark:checked:bg-brand-600',
            )}
          />
        </div>
        <div>
          <label
            htmlFor={inputId}
            className="cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {label}
          </label>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
    )
  },
)
Checkbox.displayName = 'Checkbox'
