import { type LucideIcon, ServerOff } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent } from '@/components/ui/Card'

interface AdminPlaceholderPageProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  backendNote: string
}

export function AdminPlaceholderPage({
  title,
  subtitle,
  icon: Icon = ServerOff,
  backendNote,
}: AdminPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageTitle title={title} subtitle={subtitle} />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 px-8 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
            <Icon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="max-w-lg space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Backend support not available yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{backendNote}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
