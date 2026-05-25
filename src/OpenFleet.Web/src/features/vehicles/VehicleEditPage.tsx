import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { VehicleForm, vehicleToFormValues } from './VehicleForm'
import { useUpdateVehicle, useVehicle } from './hooks'
import type { VehicleFormValues } from './schemas'

export function VehicleEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: vehicle, isLoading } = useVehicle(id)
  const updateVehicle = useUpdateVehicle(id)

  async function handleSubmit(values: VehicleFormValues) {
    try {
      await updateVehicle.mutateAsync({
        vin: values.vin.toUpperCase(),
        licensePlate: values.licensePlate,
        make: values.make,
        model: values.model,
        year: values.year,
        mileage: values.mileage,
        status: values.status,
        departmentId: values.departmentId,
      })
      toast.success('Vehicle updated', 'Changes saved successfully.')
      navigate(`/vehicles/${id}`)
    } catch (err) {
      toast.error('Failed to update vehicle', getApiErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!vehicle) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Vehicle not found.{' '}
        <Link to="/vehicles" className="text-brand-600 hover:underline">
          Back to list
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/vehicles/${id}`}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to vehicle"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle
          title="Edit vehicle"
          subtitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <VehicleForm
            defaultValues={vehicleToFormValues(vehicle)}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={updateVehicle.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
