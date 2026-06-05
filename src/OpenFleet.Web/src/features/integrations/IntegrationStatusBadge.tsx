import { Badge } from '@/components/ui/Badge'
import {
  integrationStatusLabel,
  integrationStatusVariant,
  type IntegrationStatus,
} from '@/lib/integrations'

interface IntegrationStatusBadgeProps {
  status: IntegrationStatus
  className?: string
}

export function IntegrationStatusBadge({ status, className }: IntegrationStatusBadgeProps) {
  return (
    <Badge variant={integrationStatusVariant[status]} className={className}>
      {integrationStatusLabel[status]}
    </Badge>
  )
}
