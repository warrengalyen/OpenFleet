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
  assetConditionLabel,
  assetConditionVariant,
  assetStatusLabel,
  assetStatusVariant,
  formatDate,
  formatDateTime,
} from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { useAsset, useDeleteAsset } from './hooks'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">
        {value}
      </dd>
    </div>
  )
}

export function AssetDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.TechnicianOrAbove)
  const toast = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: asset, isLoading, isError, refetch } = useAsset(id)
  const deleteAsset = useDeleteAsset()

  if (isLoading) return <LoadingSpinner />

  if (isError || !asset) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Asset not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/assets" className="text-sm text-brand-600 hover:underline">
            Back to assets
          </Link>
        </div>
      </div>
    )
  }

  async function handleDelete() {
    try {
      await deleteAsset.mutateAsync(id)
      toast.success('Asset decommissioned', 'The asset status has been set to Decommissioned.')
      navigate('/assets')
    } catch (err) {
      toast.error('Failed to decommission asset', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/assets"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to assets"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title={asset.name} subtitle={asset.assetTag} />
      </div>

      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(`/assets/${id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {asset.status !== 'Decommissioned' && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Decommission
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset details</CardTitle>
            <Badge variant={assetStatusVariant[asset.status]}>
              {assetStatusLabel[asset.status]}
            </Badge>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="Asset tag" value={asset.assetTag} />
              <DetailRow label="Name" value={asset.name} />
              <DetailRow label="Type" value={asset.type} />
              <DetailRow
                label="Condition"
                value={
                  <Badge variant={assetConditionVariant[asset.condition]}>
                    {assetConditionLabel[asset.condition]}
                  </Badge>
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment &amp; history</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="Department" value={asset.departmentName ?? '—'} />
              <DetailRow label="Assigned vehicle" value={asset.vehicleDescription ?? '—'} />
              <DetailRow label="Purchase date" value={formatDate(asset.purchaseDate)} />
              <DetailRow label="Created" value={formatDate(asset.createdAt)} />
              <DetailRow label="Last updated" value={formatDateTime(asset.updatedAt)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Decommission asset?"
        description={`This will set ${asset.name} (${asset.assetTag}) to Decommissioned status.`}
        confirmLabel="Decommission"
        variant="danger"
      />
    </div>
  )
}
