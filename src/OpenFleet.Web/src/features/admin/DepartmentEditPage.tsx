import { Building2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { AdminPlaceholderPage } from './AdminPlaceholderPage'

export function DepartmentEditPage() {
  const { id = '' } = useParams()

  return (
    <AdminPlaceholderPage
      title="Edit department"
      subtitle={`Department ${id}`}
      icon={Building2}
      backendNote="PUT /api/departments/{id} is not implemented. The DepartmentsController currently supports read-only GET endpoints. Add update support on the backend to enable editing department name and code."
    />
  )
}
