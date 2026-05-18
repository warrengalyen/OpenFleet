import { Package } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function AssetsPage() {
  return (
    <ComingSoon
      title="Assets"
      subtitle="Track equipment, tools, and other fleet assets by condition and status"
      icon={Package}
    />
  )
}
