import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { InspectionForm } from './InspectionForm'
import { useCreateInspection } from './hooks'
import type { InspectionFormValues } from './schemas'

export function InspectionCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createInspection = useCreateInspection()

  async function handleSubmit(values: InspectionFormValues) {
    try {
      const inspection = await createInspection.mutateAsync({
        vehicleId: values.vehicleId || undefined,
        assetId: values.assetId || undefined,
        inspectorUserId: values.inspectorUserId,
        inspectedAt: new Date(values.inspectedAt).toISOString(),
        status: values.status,
        notes: values.notes || undefined,
      })

      if (inspection.status === 'Failed' && inspection.generatedWorkOrderId) {
        toast.success(
          'Inspection logged',
          'Failed result — a work order was created automatically.',
        )
      } else {
        toast.success('Inspection logged')
      }

      navigate(`/inspections/${inspection.id}`)
    } catch (err) {
      toast.error('Failed to create inspection', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/inspections"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to inspections"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title="New inspection" subtitle="Record a vehicle or asset inspection" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <InspectionForm
            onSubmit={handleSubmit}
            submitLabel="Log inspection"
            isLoading={createInspection.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
