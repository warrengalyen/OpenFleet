import { LogOut, User, Menu, Sun, Moon } from 'lucide-react'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useDarkMode } from '@/hooks/useDarkMode'
import { Badge } from '@/components/ui/Badge'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const { dark, toggle: toggleDark } = useDarkMode()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
      {/* Left: mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer on desktop (sidebar is always visible) */}
      <div className="hidden lg:block" />

      {/* Right: dark mode + user */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {user && (
          <>
            <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

            {/* User info */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950">
                <User className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-gray-900 dark:text-white">
                  {user.fullName}
                </p>
                <Badge variant="neutral" className="mt-0.5">
                  {user.role}
                </Badge>
              </div>
            </div>

            <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

            {/* Sign out */}
            <button
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
