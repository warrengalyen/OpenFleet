import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import type { WorkOrderResponse } from '@/types'
import { useRecordLabor } from './hooks'
import { laborFormSchema, type LaborFormValues } from './schemas'

interface WorkOrderLaborFormProps {
  workOrder: WorkOrderResponse
}

export function WorkOrderLaborForm({ workOrder }: WorkOrderLaborFormProps) {
  const { hasPolicy } = useAuth()
  const canWrite = hasPolicy(AuthPolicy.TechnicianOrAbove)
  const toast = useToast()
  const recordLabor = useRecordLabor(workOrder.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: { hours: 0 },
  })

  if (workOrder.status === 'Cancelled') {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Labor cannot be recorded on cancelled work orders.
      </p>
    )
  }

  async function onSubmit(values: LaborFormValues) {
    try {
      await recordLabor.mutateAsync({ hours: values.hours })
      reset()
      toast.success('Labor recorded', `${values.hours} hour(s) added.`)
    } catch (err) {
      toast.error('Failed to record labor', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Total labor: <span className="font-semibold text-gray-900 dark:text-white">{workOrder.laborHours}h</span>
      </p>

      {canWrite && (
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          noValidate
        >
          <FormField label="Add hours" error={errors.hours?.message} className="flex-1">
            <Input {...register('hours')} type="number" min={0} step={0.25} />
          </FormField>
          <Button type="submit" size="sm" loading={isSubmitting || recordLabor.isPending}>
            Record labor
          </Button>
        </form>
      )}
    </div>
  )
}
