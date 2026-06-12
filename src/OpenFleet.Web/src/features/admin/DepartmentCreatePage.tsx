import { Building2 } from 'lucide-react'
import { AdminPlaceholderPage } from './AdminPlaceholderPage'

export function DepartmentCreatePage() {
  return (
    <AdminPlaceholderPage
      title="New department"
      subtitle="Add an organizational department"
      icon={Building2}
      backendNote="POST /api/departments is not implemented. The DepartmentsController currently supports read-only GET endpoints. Add create/update/delete actions on the backend to enable this form."
    />
  )
}
