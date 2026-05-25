import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { AssetForm, assetToFormValues } from './AssetForm'
import { useAsset, useUpdateAsset } from './hooks'
import type { AssetFormValues } from './schemas'

export function AssetEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: asset, isLoading } = useAsset(id)
  const updateAsset = useUpdateAsset(id)

  async function handleSubmit(values: AssetFormValues) {
    try {
      await updateAsset.mutateAsync({
        assetTag: values.assetTag,
        name: values.name,
        type: values.type,
        condition: values.condition,
        status: values.status,
        departmentId: values.departmentId,
        vehicleId: values.vehicleId || null,
      })
      toast.success('Asset updated', 'Changes saved successfully.')
      navigate(`/assets/${id}`)
    } catch (err) {
      toast.error('Failed to update asset', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!asset) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Asset not found.{' '}
        <Link to="/assets" className="text-brand-600 hover:underline">
          Back to list
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/assets/${id}`}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to asset"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title="Edit asset" subtitle={asset.name} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <AssetForm
            defaultValues={assetToFormValues(asset)}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={updateAsset.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
