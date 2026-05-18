import { Wrench } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function PartsPage() {
  return (
    <ComingSoon
      title="Parts"
      subtitle="Manage parts inventory, track usage, and monitor stock levels"
      icon={Wrench}
    />
  )
}
