import { FileText } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function AuditPage() {
  return (
    <ComingSoon
      title="Audit Log"
      subtitle="Immutable history of changes to vehicles, work orders, and user accounts"
      icon={FileText}
    />
  )
}
