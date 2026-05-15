import { clsx } from 'clsx'
import { type ReactNode, useId } from 'react'
import { cloneElement, isValidElement } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

export function FormField({
  label,
  children,
  error,
  hint,
  required,
  className,
}: FormFieldProps) {
  const id = useId()

  // Inject id and error prop into the direct child input/select/textarea
  const childWithProps = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ id?: string; error?: boolean }>, {
        id,
        error: !!error,
      })
    : children

  return (
    <div className={clsx('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {childWithProps}

      {hint && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
