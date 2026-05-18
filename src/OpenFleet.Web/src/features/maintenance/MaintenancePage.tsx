import { Calendar } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function MaintenancePage() {
  return (
    <ComingSoon
      title="Maintenance Schedules"
      subtitle="Set up recurring service schedules by date interval or mileage"
      icon={Calendar}
    />
  )
}
