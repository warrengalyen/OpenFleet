import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { VendorForm } from './VendorForm'
import { useCreateVendor } from './hooks'
import type { VendorFormValues } from './schemas'

export function VendorCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createVendor = useCreateVendor()

  async function handleSubmit(values: VendorFormValues) {
    try {
      const vendor = await createVendor.mutateAsync({
        name: values.name,
        contactName: values.contactName ?? '',
        email: values.email ?? '',
        phone: values.phone ?? '',
        address: values.address ?? '',
      })
      toast.success('Vendor created')
      navigate(`/vendors/${vendor.id}`)
    } catch (err) {
      toast.error('Failed to create vendor', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/vendors"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to vendors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title="New vendor" subtitle="Add a parts supplier or service vendor" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <VendorForm
            onSubmit={handleSubmit}
            submitLabel="Create vendor"
            isLoading={createVendor.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
