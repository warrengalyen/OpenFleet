import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { AssetForm } from './AssetForm'
import { useCreateAsset } from './hooks'
import type { AssetFormValues } from './schemas'

export function AssetCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createAsset = useCreateAsset()

  async function handleSubmit(values: AssetFormValues) {
    try {
      const asset = await createAsset.mutateAsync({
        assetTag: values.assetTag,
        name: values.name,
        type: values.type,
        condition: values.condition,
        status: values.status,
        departmentId: values.departmentId,
        vehicleId: values.vehicleId || null,
      })
      toast.success('Asset created', `${values.name} added.`)
      navigate(`/assets/${asset.id}`)
    } catch (err) {
      toast.error('Failed to create asset', getApiErrorMessage(err))
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
        <PageTitle title="Add asset" subtitle="Register a new fleet asset" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <AssetForm
            onSubmit={handleSubmit}
            submitLabel="Create asset"
            isLoading={createAsset.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
