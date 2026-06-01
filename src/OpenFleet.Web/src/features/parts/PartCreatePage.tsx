import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { PartForm } from './PartForm'
import { useCreatePart } from './hooks'
import type { PartFormValues } from './schemas'

export function PartCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const createPart = useCreatePart()

  const defaultVendorId = searchParams.get('vendorId') ?? undefined

  async function handleSubmit(values: PartFormValues) {
    try {
      const part = await createPart.mutateAsync({
        name: values.name,
        partNumber: values.partNumber,
        vendorId: values.vendorId,
        quantityOnHand: values.quantityOnHand,
        unitCost: values.unitCost,
      })
      toast.success('Part created')
      navigate(`/parts/${part.id}`)
    } catch (err) {
      toast.error('Failed to create part', getApiErrorMessage(err))
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
        <PageTitle title="New part" subtitle="Add a part to inventory" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <PartForm
            defaultValues={defaultVendorId ? { vendorId: defaultVendorId } : undefined}
            onSubmit={handleSubmit}
            submitLabel="Create part"
            isLoading={createPart.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
