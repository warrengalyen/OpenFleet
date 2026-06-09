import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
import { getReportDefinition } from './constants'
import { InspectionFailureRateReportView } from './views/InspectionFailureRateReportView'
import { MaintenanceCostReportView } from './views/MaintenanceCostReportView'
import { PartsUsageReportView } from './views/PartsUsageReportView'
import { VehicleDowntimeReportView } from './views/VehicleDowntimeReportView'
import { VehiclesDueReportView } from './views/VehiclesDueReportView'
import { WorkOrdersByPriorityReportView } from './views/WorkOrdersByPriorityReportView'
import { WorkOrdersByStatusReportView } from './views/WorkOrdersByStatusReportView'

export function ReportDetailPage() {
  const { slug = '' } = useParams()
  const definition = getReportDefinition(slug)

  if (!definition) {
    return <NotFoundPage />
  }

  return (
    <div className="space-y-6">
      <Link
        to="/reports"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All reports
      </Link>

      {slug === 'maintenance-cost' && <MaintenanceCostReportView />}
      {slug === 'vehicle-downtime' && <VehicleDowntimeReportView />}
      {slug === 'parts-usage' && <PartsUsageReportView />}
      {slug === 'inspection-failure-rate' && <InspectionFailureRateReportView />}
      {slug === 'work-orders-by-status' && <WorkOrdersByStatusReportView />}
      {slug === 'work-orders-by-priority' && <WorkOrdersByPriorityReportView />}
      {slug === 'vehicles-due' && <VehiclesDueReportView />}
    </div>
  )
}
