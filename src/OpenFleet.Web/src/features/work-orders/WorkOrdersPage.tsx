import { ClipboardList } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function WorkOrdersPage() {
  return (
    <ComingSoon
      title="Work Orders"
      subtitle="Create and manage repair and maintenance work orders for your fleet"
      icon={ClipboardList}
    />
  )
}
