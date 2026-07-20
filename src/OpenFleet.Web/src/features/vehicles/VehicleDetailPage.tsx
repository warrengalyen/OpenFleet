import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/api'
import {
  formatDate,
  formatDateTime,
  formatNumber,
  vehicleStatusLabel,
  vehicleStatusVariant,
} from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { useDeleteVehicle, useVehicle } from './hooks'
import { VehicleMaintenanceTimeline } from './VehicleMaintenanceTimeline'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">
        {value}
      </dd>
    </div>
  )
}

export function VehicleDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.TechnicianOrAbove)
  const toast = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: vehicle, isLoading, isError, refetch } = useVehicle(id)
  const deleteVehicle = useDeleteVehicle()

  if (isLoading) return <LoadingSpinner />

  if (isError || !vehicle) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Vehicle not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/vehicles" className="text-sm text-brand-600 hover:underline">
            Back to vehicles
          </Link>
        </div>
      </div>
    )
  }

  async function handleDelete() {
    try {
      await deleteVehicle.mutateAsync(id)
      toast.success('Vehicle retired', 'The vehicle has been removed from the active fleet.')
      navigate('/vehicles')
    } catch (err) {
      toast.error('Failed to retire vehicle', getApiErrorMessage(err))
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
        <PageTitle
          title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          subtitle={vehicle.licensePlate}
        />
      </div>

      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(`/vehicles/${id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {vehicle.status !== 'Retired' && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Retire
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle details</CardTitle>
            <Badge variant={vehicleStatusVariant[vehicle.status]}>
              {vehicleStatusLabel[vehicle.status]}
            </Badge>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="VIN" value={vehicle.vin} />
              <DetailRow label="License plate" value={vehicle.licensePlate} />
              <DetailRow label="Make" value={vehicle.make} />
              <DetailRow label="Model" value={vehicle.model} />
              <DetailRow label="Year" value={vehicle.year} />
              <DetailRow label="Mileage" value={`${formatNumber(vehicle.mileage)} mi`} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment &amp; history</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="Department" value={vehicle.departmentName} />
              <DetailRow label="Created" value={formatDate(vehicle.createdAt)} />
              <DetailRow label="Last updated" value={formatDateTime(vehicle.updatedAt)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <VehicleMaintenanceTimeline vehicleId={id} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Retire vehicle?"
        description={`This will remove ${vehicle.year} ${vehicle.make} ${vehicle.model} from the active fleet. The record is retained for history.`}
        confirmLabel="Retire vehicle"
        variant="danger"
      />
    </div>
  )
}
