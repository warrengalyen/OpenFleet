import { BarChart3 } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      subtitle="Operational insights including downtime, maintenance cost, and inspection failure rates"
      icon={BarChart3}
    />
  )
}
