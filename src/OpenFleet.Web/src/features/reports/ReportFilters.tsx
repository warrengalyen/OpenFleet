import { Input } from '@/components/ui/Input'
import type { ReportDateRange } from './filters'

interface ReportFiltersProps {
  range: ReportDateRange
  onChange: (range: ReportDateRange) => void
  showDateFilter?: boolean
}

export function ReportFilters({ range, onChange, showDateFilter = true }: ReportFiltersProps) {
  if (!showDateFilter) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        This report reflects current fleet-wide data. Date and department filters are not available
        from the API for this report.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
      <div>
        <label htmlFor="report-date-from" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          From
        </label>
        <Input
          id="report-date-from"
          type="date"
          value={range.dateFrom ?? ''}
          onChange={(e) => onChange({ ...range, dateFrom: e.target.value || undefined })}
          className="w-40"
        />
      </div>
      <div>
        <label htmlFor="report-date-to" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          To
        </label>
        <Input
          id="report-date-to"
          type="date"
          value={range.dateTo ?? ''}
          onChange={(e) => onChange({ ...range, dateTo: e.target.value || undefined })}
          className="w-40"
        />
      </div>
      {(range.dateFrom || range.dateTo) && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-sm text-brand-600 hover:underline dark:text-brand-400"
        >
          Clear dates
        </button>
      )}
      <p className="w-full text-xs text-gray-500 dark:text-gray-400">
        Date filter applies to table rows with timestamps. Summary totals reflect full API data.
      </p>
    </div>
  )
}
