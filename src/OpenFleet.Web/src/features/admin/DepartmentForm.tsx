import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import type { DepartmentResponse } from '@/types'
import { departmentFormSchema, type DepartmentFormValues } from './schemas'

interface DepartmentFormProps {
  defaultValues?: Partial<DepartmentFormValues>
  onSubmit: (values: DepartmentFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

export function departmentToFormValues(department: DepartmentResponse): DepartmentFormValues {
  return {
    name: department.name,
    code: department.code,
  }
}

export function DepartmentForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isLoading,
}: DepartmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      code: '',
      ...defaultValues,
    },
  })

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className="space-y-5"
      noValidate
    >
      <FormField label="Department name" required error={errors.name?.message}>
        <Input {...register('name')} placeholder="Operations" autoComplete="organization" />
      </FormField>

      <FormField
        label="Department code"
        required
        error={errors.code?.message}
        hint="Short uppercase identifier used in reports and filters (e.g. OPS, MNT)."
      >
        <Input
          {...register('code')}
          placeholder="OPS"
          className="uppercase"
          autoComplete="off"
        />
      </FormField>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Button type="submit" loading={isLoading ?? isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
