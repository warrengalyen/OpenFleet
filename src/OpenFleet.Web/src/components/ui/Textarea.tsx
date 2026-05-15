import { clsx } from 'clsx'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        {...props}
        className={clsx(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
          'resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-300/40 dark:border-red-700'
            : 'border-gray-300 focus:border-brand-400 focus:ring-brand-300/40 dark:border-gray-700 dark:focus:border-brand-600',
          className,
        )}
        rows={props.rows ?? 3}
      />
    )
  },
)
Textarea.displayName = 'Textarea'
