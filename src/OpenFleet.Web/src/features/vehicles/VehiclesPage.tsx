import { Truck } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function VehiclesPage() {
  return (
    <ComingSoon
      title="Vehicles"
      subtitle="Manage your fleet vehicles, track status, and view maintenance history"
      icon={Truck}
    />
  )
}
