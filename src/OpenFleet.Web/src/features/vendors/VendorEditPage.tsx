import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { VendorForm, vendorToFormValues } from './VendorForm'
import { useUpdateVendor, useVendor } from './hooks'
import type { VendorFormValues } from './schemas'

export function VendorEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: vendor, isLoading } = useVendor(id)
  const updateVendor = useUpdateVendor(id)

  async function handleSubmit(values: VendorFormValues) {
    try {
      await updateVendor.mutateAsync({
        name: values.name,
        contactName: values.contactName ?? '',
        email: values.email ?? '',
        phone: values.phone ?? '',
        address: values.address ?? '',
      })
      toast.success('Vendor updated')
      navigate(`/vendors/${id}`)
    } catch (err) {
      toast.error('Failed to update vendor', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!vendor) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Vendor not found.{' '}
        <Link to="/vendors" className="text-brand-600 hover:underline">
          Back to list
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/vendors/${id}`}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to vendor"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title="Edit vendor" subtitle={vendor.name} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <VendorForm
            defaultValues={vendorToFormValues(vendor)}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={updateVendor.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
