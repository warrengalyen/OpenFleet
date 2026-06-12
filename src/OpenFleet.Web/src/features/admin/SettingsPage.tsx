import { Settings } from 'lucide-react'
import { AdminPlaceholderPage } from './AdminPlaceholderPage'

export function SettingsPage() {
  return (
    <AdminPlaceholderPage
      title="Settings"
      subtitle="Application-wide configuration and operational defaults"
      icon={Settings}
      backendNote="No application settings API exists yet. A future GET/PUT /api/settings (or similar) endpoint is needed to persist fleet-wide configuration such as notification defaults, maintenance thresholds, and integration schedules."
    />
  )
}
