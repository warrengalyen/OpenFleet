import { Eye } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function InspectionsPage() {
  return (
    <ComingSoon
      title="Inspections"
      subtitle="Log vehicle inspections and automatically generate work orders for failures"
      icon={Eye}
    />
  )
}
