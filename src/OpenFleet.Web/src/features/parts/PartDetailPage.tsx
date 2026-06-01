import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/api'
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  stockLevel,
  stockLevelLabel,
  stockLevelVariant,
} from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { useDeletePart, usePart } from './hooks'
import { PartUsageHistory } from './PartUsageHistory'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

export function PartDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.FleetManagerOrAbove)
  const toast = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: part, isLoading, isError, refetch } = usePart(id)
  const deletePart = useDeletePart()

  if (isLoading) return <LoadingSpinner />

  if (isError || !part) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Part not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/parts" className="text-sm text-brand-600 hover:underline">
            Back to parts
          </Link>
        </div>
      </div>
    )
  }

  const level = stockLevel(part.quantityOnHand, part.lowStockThreshold)

  async function handleDelete() {
    try {
      await deletePart.mutateAsync(id)
      toast.success('Part deleted')
      navigate('/parts')
    } catch (err) {
      toast.error('Failed to delete part', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/parts"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to parts"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title={part.name} subtitle={part.partNumber} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={stockLevelVariant[level]} className="text-base px-3 py-1">
          {stockLevelLabel[level]}
        </Badge>
        {part.isLowStock && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            At or below threshold of {formatNumber(part.lowStockThreshold)}
          </span>
        )}
      </div>

      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(`/parts/${id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="Part number" value={part.partNumber} />
              <DetailRow
                label="Vendor"
                value={
                  <Link to={`/vendors/${part.vendorId}`} className="text-brand-600 hover:underline">
                    {part.vendorName}
                  </Link>
                }
              />
              <DetailRow label="Quantity on hand" value={formatNumber(part.quantityOnHand)} />
              <DetailRow label="Unit cost" value={formatCurrency(part.unitCost)} />
              <DetailRow label="Total value" value={formatCurrency(part.totalValue)} />
              <DetailRow label="Low stock threshold" value={formatNumber(part.lowStockThreshold)} />
              <DetailRow label="Created" value={formatDateTime(part.createdAt)} />
              <DetailRow label="Last updated" value={formatDateTime(part.updatedAt)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage history</CardTitle>
          </CardHeader>
          <CardContent>
            <PartUsageHistory partId={id} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete part?"
        description={`"${part.name}" (${part.partNumber}) will be permanently removed from inventory.`}
        confirmLabel="Delete part"
        variant="danger"
      />
    </div>
  )
}
