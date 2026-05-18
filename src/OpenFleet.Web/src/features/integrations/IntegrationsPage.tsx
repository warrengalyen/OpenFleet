import { PlugZap } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function IntegrationsPage() {
  return (
    <ComingSoon
      title="Integrations"
      subtitle="View sync history for fuel, vendor repairs, parts inventory, and external asset imports"
      icon={PlugZap}
    />
  )
}
