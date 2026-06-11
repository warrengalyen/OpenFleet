import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDepartments } from '@/hooks/useDepartments'
import { roleLabel } from '@/lib/auth'
import type { UserResponse } from '@/types/user'
import {
  createUserFormSchema,
  editUserFormSchema,
  type CreateUserFormValues,
  type EditUserFormValues,
} from './schemas'

interface CreateUserFormProps {
  mode: 'create'
  onSubmit: (values: CreateUserFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

interface EditUserFormProps {
  mode: 'edit'
  defaultValues: EditUserFormValues
  email: string
  onSubmit: (values: EditUserFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

type UserFormProps = CreateUserFormProps | EditUserFormProps

const ROLE_OPTIONS = [
  'Viewer',
  'Technician',
  'Supervisor',
  'FleetManager',
  'Administrator',
] as const

export function userToEditFormValues(user: UserResponse): EditUserFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    departmentId: user.departmentId,
  }
}

export function UserForm(props: UserFormProps) {
  const { data: departments, isLoading: departmentsLoading } = useDepartments()

  if (props.mode === 'create') {
    return <CreateUserFormInner {...props} departments={departments} departmentsLoading={departmentsLoading} />
  }

  return (
    <EditUserFormInner
      {...props}
      departments={departments}
      departmentsLoading={departmentsLoading}
    />
  )
}

function CreateUserFormInner({
  onSubmit,
  submitLabel,
  isLoading,
  departments,
  departmentsLoading,
}: CreateUserFormProps & {
  departments: ReturnType<typeof useDepartments>['data']
  departmentsLoading: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Technician',
      departmentId: '',
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="First name" required error={errors.firstName?.message}>
          <Input {...register('firstName')} autoComplete="given-name" />
        </FormField>
        <FormField label="Last name" required error={errors.lastName?.message}>
          <Input {...register('lastName')} autoComplete="family-name" />
        </FormField>
      </div>

      <FormField label="Email" required error={errors.email?.message}>
        <Input {...register('email')} type="email" autoComplete="email" />
      </FormField>

      <FormField label="Password" required error={errors.password?.message}>
        <Input {...register('password')} type="password" autoComplete="new-password" />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Role" required error={errors.role?.message}>
          <Select {...register('role')}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {roleLabel[role]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Department" required error={errors.departmentId?.message}>
          <Select
            {...register('departmentId')}
            disabled={departmentsLoading}
            placeholder="Select department"
          >
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormActions submitLabel={submitLabel} isLoading={isLoading ?? isSubmitting} />
    </form>
  )
}

function EditUserFormInner({
  defaultValues,
  email,
  onSubmit,
  submitLabel,
  isLoading,
  departments,
  departmentsLoading,
}: EditUserFormProps & {
  departments: ReturnType<typeof useDepartments>['data']
  departmentsLoading: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues,
  })

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className="space-y-5"
      noValidate
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="First name" required error={errors.firstName?.message}>
          <Input {...register('firstName')} autoComplete="given-name" />
        </FormField>
        <FormField label="Last name" required error={errors.lastName?.message}>
          <Input {...register('lastName')} autoComplete="family-name" />
        </FormField>
      </div>

      <FormField label="Email" hint="Email cannot be changed after account creation.">
        <Input value={email} disabled readOnly />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Role" required error={errors.role?.message}>
          <Select {...register('role')}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {roleLabel[role]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Department" required error={errors.departmentId?.message}>
          <Select
            {...register('departmentId')}
            disabled={departmentsLoading}
            placeholder="Select department"
          >
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormActions submitLabel={submitLabel} isLoading={isLoading ?? isSubmitting} />
    </form>
  )
}

function FormActions({ submitLabel, isLoading }: { submitLabel: string; isLoading: boolean }) {
  return (
    <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
      <Button type="submit" loading={isLoading}>
        {submitLabel}
      </Button>
    </div>
  )
}
