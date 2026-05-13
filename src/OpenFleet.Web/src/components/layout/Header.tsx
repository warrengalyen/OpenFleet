import { LogOut, User } from 'lucide-react'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'

export function Header() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />

      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
                <User className="h-4 w-4 text-brand-600" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user.fullName}</p>
                <Badge variant="neutral" className="mt-0.5">{user.role}</Badge>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <button
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
