/** Download tabular data as a CSV file in the browser. */
export function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
    return value
  }

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map((cell) => escape(cell)).join(',')),
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
