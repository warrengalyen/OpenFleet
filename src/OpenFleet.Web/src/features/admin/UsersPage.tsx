import { Users } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export function UsersPage() {
  return (
    <ComingSoon
      title="Users"
      subtitle="Manage fleet staff accounts, roles, and department assignments"
      icon={Users}
    />
  )
}
