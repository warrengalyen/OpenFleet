import { useMemo } from 'react'
import { Package } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { exportToCsv } from '@/lib/csv'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import { BarChart } from '@/features/dashboard/charts/BarChart'
import { ReportFilters } from '../ReportFilters'
import { ReportShell } from '../ReportShell'
import { usePartsUsageReport } from '../hooks'

export function PartsUsageReportView() {
  const { data, isLoading, isError, isFetching, refetch } = usePartsUsageReport()

  const parts = useMemo(() => data?.parts ?? [], [data])
  const chartItems = useMemo(
    () =>
      [...parts]
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 8)
        .map((p) => ({
          label: p.name,
          value: p.totalValue,
          color: '#8b5cf6',
        })),
    [parts],
  )

  function handleExport() {
    exportToCsv(
      'parts-usage',
      ['Part', 'Part Number', 'Vendor', 'Qty on Hand', 'Unit Cost', 'Total Value'],
      parts.map((p) => [
        p.name,
        p.partNumber,
        p.vendorName ?? '',
        String(p.quantityOnHand),
        String(p.unitCost),
        String(p.totalValue),
      ]),
    )
  }

  return (
    <ReportShell
      title="Parts Usage & Inventory"
      description={`${data?.totalParts ?? 0} parts · ${formatCurrency(data?.totalInventoryValue ?? 0)} total inventory value`}
      isLoading={isLoading}
      isError={isError}
      data={data}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      isEmpty={parts.length === 0}
      emptyIcon={Package}
      emptyTitle="No parts inventory"
      emptyDescription="Add parts to track stock levels and inventory value."
      onExportCsv={handleExport}
      filters={<ReportFilters range={{}} onChange={() => {}} showDateFilter={false} />}
    >
      <div className="space-y-8">
        {chartItems.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Top parts by inventory value
            </h3>
            <BarChart
              items={chartItems.map((i) => ({
                ...i,
                label: `${i.label} (${formatCurrency(i.value)})`,
                value: i.value,
              }))}
            />
          </div>
        )}

        <DataTable
          columns={[
            { key: 'name', header: 'Part', sortable: true },
            { key: 'partNumber', header: 'Part #', sortable: true },
            { key: 'vendorName', header: 'Vendor', render: (row) => row.vendorName ?? '—' },
            {
              key: 'quantityOnHand',
              header: 'Qty',
              sortable: true,
              render: (row) => formatNumber(row.quantityOnHand),
            },
            {
              key: 'unitCost',
              header: 'Unit cost',
              render: (row) => formatCurrency(row.unitCost),
            },
            {
              key: 'totalValue',
              header: 'Total value',
              sortable: true,
              render: (row) => formatCurrency(row.totalValue),
            },
          ]}
          data={parts}
          getRowKey={(row) => row.partId}
        />
      </div>
    </ReportShell>
  )
}
