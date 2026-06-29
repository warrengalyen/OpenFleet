import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { InspectionUpdateForm } from './InspectionUpdateForm'
import { useInspection, useUpdateInspection } from './hooks'
import type { InspectionUpdateValues } from './schemas'

export function InspectionEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: inspection, isLoading } = useInspection(id)
  const updateInspection = useUpdateInspection(id)

  async function handleSubmit(values: InspectionUpdateValues) {
    try {
      const updated = await updateInspection.mutateAsync({
        status: values.status,
        notes: values.notes ?? '',
      })

      if (
        values.status === 'Failed' &&
        updated.generatedWorkOrderId &&
        !inspection?.generatedWorkOrderId
      ) {
        toast.success(
          'Inspection updated',
          'Status changed to Failed - a work order was created automatically.',
        )
      } else {
        toast.success('Inspection updated')
      }

      navigate(`/inspections/${id}`)
    } catch (err) {
      toast.error('Failed to update inspection', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!inspection) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Inspection not found.{' '}
        <Link to="/inspections" className="text-brand-600 hover:underline">
          Back to list
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/inspections/${id}`}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to inspection"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title="Update inspection" subtitle="Change result or notes" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <InspectionUpdateForm
            inspection={inspection}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={updateInspection.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
