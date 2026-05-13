import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — always visible on lg+, drawer on mobile */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-30 w-60 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onClose={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={openSidebar} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
