import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { PartForm, partToFormValues } from './PartForm'
import { usePart, useUpdatePart } from './hooks'
import type { PartFormValues } from './schemas'

export function PartEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: part, isLoading } = usePart(id)
  const updatePart = useUpdatePart(id)

  async function handleSubmit(values: PartFormValues) {
    try {
      await updatePart.mutateAsync({
        name: values.name,
        partNumber: values.partNumber,
        vendorId: values.vendorId,
        quantityOnHand: values.quantityOnHand,
        unitCost: values.unitCost,
      })
      toast.success('Part updated')
      navigate(`/parts/${id}`)
    } catch (err) {
      toast.error('Failed to update part', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!part) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Part not found.{' '}
        <Link to="/parts" className="text-brand-600 hover:underline">
          Back to list
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/parts/${id}`}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to part"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title="Edit part" subtitle={part.name} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <PartForm
            defaultValues={partToFormValues(part)}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={updatePart.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
