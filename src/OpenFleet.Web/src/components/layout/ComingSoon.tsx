import { type LucideIcon, Hammer } from 'lucide-react'
import { PageTitle } from './PageTitle'
import { Card, CardContent } from '@/components/ui/Card'
import { type ReactNode } from 'react'

interface ComingSoonProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  actions?: ReactNode
}

export function ComingSoon({ title, subtitle, icon: Icon = Hammer, actions }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <PageTitle title={title} subtitle={subtitle} actions={actions} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Icon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            This page is being built
          </p>
          <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Check the{' '}
            <a
              href="https://github.com"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              roadmap
            </a>{' '}
            for planned features and timeline.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
