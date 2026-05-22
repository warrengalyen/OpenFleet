import { clsx } from 'clsx'

export interface BarChartItem {
  label: string
  value: number
  color: string
}

interface BarChartProps {
  items: BarChartItem[]
  className?: string
}

export function BarChart({ items, className }: BarChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className={clsx('space-y-3', className)}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
            <span className="tabular-nums text-gray-500 dark:text-gray-400">
              {item.value}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface DonutChartProps {
  items: BarChartItem[]
  total: number
  centerLabel?: string
  className?: string
}

export function DonutChart({ items, total, centerLabel, className }: DonutChartProps) {
  const size = 120
  const stroke = 16
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  if (total === 0) {
    return (
      <div className={clsx('flex items-center justify-center', className)}>
        <div
          className="flex items-center justify-center rounded-full border-8 border-gray-100 dark:border-gray-800"
          style={{ width: size, height: size }}
        >
          <span className="text-sm text-gray-400">No data</span>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col items-center gap-4 sm:flex-row sm:items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-100 dark:text-gray-800"
          />
          {items.map((item) => {
            const segment = (item.value / total) * circumference
            const dashArray = `${segment} ${circumference - segment}`
            const dashOffset = -offset
            offset += segment
            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={stroke}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{total}</span>
          {centerLabel && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{centerLabel}</span>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className="ml-auto font-medium tabular-nums text-gray-900 dark:text-white">
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
