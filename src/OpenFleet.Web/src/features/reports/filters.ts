export interface ReportDateRange {
  dateFrom?: string
  dateTo?: string
}

/** Returns true when no range is set or the ISO date falls within the inclusive range. */
export function isWithinDateRange(
  isoDate: string | null | undefined,
  range: ReportDateRange,
): boolean {
  if (!range.dateFrom && !range.dateTo) return true
  if (!isoDate) return true

  const time = new Date(isoDate).getTime()
  if (range.dateFrom && time < new Date(range.dateFrom).getTime()) return false
  if (range.dateTo) {
    const end = new Date(range.dateTo)
    end.setHours(23, 59, 59, 999)
    if (time > end.getTime()) return false
  }
  return true
}
