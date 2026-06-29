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
  formatDateTime,
  formatNumber,
  stockLevel,
  stockLevelLabel,
  stockLevelVariant,
  vendorAvailability,
  vendorAvailabilityLabel,
  vendorAvailabilityVariant,
} from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { useDeleteVendor, useVendor } from './hooks'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{value}</dd>
    </div>
  )
}

export function VendorDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.FleetManagerOrAbove)
  const toast = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: vendor, isLoading, isError, refetch } = useVendor(id)
  const deleteVendor = useDeleteVendor()

  if (isLoading) return <LoadingSpinner />

  if (isError || !vendor) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Vendor not found.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Link to="/vendors" className="text-sm text-brand-600 hover:underline">
            Back to vendors
          </Link>
        </div>
      </div>
    )
  }

  const availability = vendorAvailability(vendor.partCount)

  async function handleDelete() {
    try {
      await deleteVendor.mutateAsync(id)
      toast.success('Vendor deleted')
      navigate('/vendors')
    } catch (err) {
      toast.error('Failed to delete vendor', getApiErrorMessage(err))
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
        <PageTitle title={vendor.name} subtitle="Vendor details and assigned parts" />
      </div>

      <Badge variant={vendorAvailabilityVariant[availability]} className="text-base px-3 py-1">
        {vendorAvailabilityLabel[availability]}
      </Badge>

      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(`/vendors/${id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={() => setDeleteOpen(true)}
            disabled={vendor.hasAssignedParts}
            title={
              vendor.hasAssignedParts
                ? 'Reassign or delete assigned parts before deleting this vendor'
                : undefined
            }
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      {vendor.hasAssignedParts && canWrite && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This vendor has {vendor.partCount} assigned part{vendor.partCount === 1 ? '' : 's'}.
          Reassign or delete those parts before removing the vendor.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <DetailRow label="Contact" value={vendor.contactName || '-'} />
              <DetailRow
                label="Email"
                value={
                  vendor.email ? (
                    <a href={`mailto:${vendor.email}`} className="text-brand-600 hover:underline">
                      {vendor.email}
                    </a>
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow
                label="Phone"
                value={
                  vendor.phone ? (
                    <a href={`tel:${vendor.phone}`} className="text-brand-600 hover:underline">
                      {vendor.phone}
                    </a>
                  ) : (
                    '-'
                  )
                }
              />
              <DetailRow
                label="Address"
                value={vendor.address ? (
                  <span className="whitespace-pre-wrap">{vendor.address}</span>
                ) : (
                  '-'
                )}
              />
              <DetailRow label="Created" value={formatDateTime(vendor.createdAt)} />
              <DetailRow label="Last updated" value={formatDateTime(vendor.updatedAt)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned parts ({vendor.partCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {vendor.parts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No parts assigned to this vendor yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {vendor.parts.map((part) => {
                  const level = stockLevel(part.quantityOnHand, 25)
                  return (
                    <li key={part.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <Link
                          to={`/parts/${part.id}`}
                          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {part.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{part.partNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatNumber(part.quantityOnHand)}</p>
                        <Badge variant={stockLevelVariant[level]} className="mt-1">
                          {stockLevelLabel[level]}
                        </Badge>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {canWrite && (
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Link
                  to={`/parts/new?vendorId=${id}`}
                  className="text-sm text-brand-600 hover:underline"
                >
                  Add part for this vendor
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete vendor?"
        description={`"${vendor.name}" will be permanently removed.`}
        confirmLabel="Delete vendor"
        variant="danger"
      />
    </div>
  )
}
