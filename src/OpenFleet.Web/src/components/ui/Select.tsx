import { clsx } from 'clsx'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, placeholder, children, className, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          {...props}
          className={clsx(
            'w-full appearance-none rounded-lg border bg-white py-2 pl-3 pr-8 text-sm text-gray-900',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-gray-800 dark:text-gray-100',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-300/40 dark:border-red-700'
              : 'border-gray-300 focus:border-brand-400 focus:ring-brand-300/40 dark:border-gray-700 dark:focus:border-brand-600',
            className,
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 dark:text-gray-500">
          <ChevronDown className="h-4 w-4" />
        </span>
      </div>
    )
  },
)
Select.displayName = 'Select'
