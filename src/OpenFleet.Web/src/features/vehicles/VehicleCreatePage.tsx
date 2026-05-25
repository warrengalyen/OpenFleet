import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { VehicleForm } from './VehicleForm'
import { useCreateVehicle } from './hooks'
import type { VehicleFormValues } from './schemas'

export function VehicleCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createVehicle = useCreateVehicle()

  async function handleSubmit(values: VehicleFormValues) {
    try {
      const vehicle = await createVehicle.mutateAsync({
        ...values,
        vin: values.vin.toUpperCase(),
      })
      toast.success('Vehicle created', `${values.year} ${values.make} ${values.model} added.`)
      navigate(`/vehicles/${vehicle.id}`)
    } catch (err) {
      toast.error('Failed to create vehicle', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/vehicles"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to vehicles"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle title="Add vehicle" subtitle="Register a new fleet vehicle" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <VehicleForm
            onSubmit={handleSubmit}
            submitLabel="Create vehicle"
            isLoading={createVehicle.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
