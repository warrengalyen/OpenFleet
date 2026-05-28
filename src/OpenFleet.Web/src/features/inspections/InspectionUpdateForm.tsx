import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { InspectionResponse } from '@/types'
import { FailedWorkOrderBanner } from './FailedWorkOrderBanner'
import { inspectionUpdateSchema, type InspectionUpdateValues } from './schemas'

interface InspectionUpdateFormProps {
  inspection: InspectionResponse
  onSubmit: (values: InspectionUpdateValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

const STATUS_OPTIONS = [
  { value: 'Passed', label: 'Passed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'NeedsReview', label: 'Needs Review' },
] as const

export function InspectionUpdateForm({
  inspection,
  onSubmit,
  submitLabel,
  isLoading,
}: InspectionUpdateFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InspectionUpdateValues>({
    resolver: zodResolver(inspectionUpdateSchema),
    defaultValues: {
      status: inspection.status,
      notes: inspection.notes || undefined,
    },
  })

  const status = useWatch({ control, name: 'status' })
  const showFailedWarning =
    status === 'Failed' && inspection.status !== 'Failed' && !inspection.generatedWorkOrderId

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className="space-y-5"
      noValidate
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Inspection records are immutable except for status and notes. Vehicle, asset, inspector, and
        date cannot be changed.
      </p>

      <FormField label="Result" required error={errors.status?.message}>
        <Select {...register('status')}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FormField>

      {showFailedWarning && <FailedWorkOrderBanner variant="form" />}

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register('notes')} rows={4} placeholder="Inspection findings…" />
      </FormField>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Button type="submit" loading={isLoading ?? isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
