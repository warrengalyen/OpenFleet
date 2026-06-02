import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { VendorDetailResponse } from '@/types'
import { vendorFormSchema, type VendorFormValues } from './schemas'

interface VendorFormProps {
  defaultValues?: Partial<VendorFormValues>
  onSubmit: (values: VendorFormValues) => Promise<void>
  submitLabel: string
  isLoading?: boolean
}

export function vendorToFormValues(vendor: VendorDetailResponse): VendorFormValues {
  return {
    name: vendor.name,
    contactName: vendor.contactName || undefined,
    email: vendor.email || undefined,
    phone: vendor.phone || undefined,
    address: vendor.address || undefined,
  }
}

export function VendorForm({ defaultValues, onSubmit, submitLabel, isLoading }: VendorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: '',
      contactName: undefined,
      email: undefined,
      phone: undefined,
      address: undefined,
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
      <FormField label="Vendor name" required error={errors.name?.message}>
        <Input {...register('name')} placeholder="AutoParts Direct" />
      </FormField>

      <FormField label="Contact name" error={errors.contactName?.message}>
        <Input {...register('contactName')} placeholder="Jane Smith" />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Email" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="orders@vendor.com" />
        </FormField>

        <FormField label="Phone" error={errors.phone?.message}>
          <Input {...register('phone')} type="tel" placeholder="(555) 123-4567" />
        </FormField>
      </div>

      <FormField label="Address" error={errors.address?.message}>
        <Textarea {...register('address')} rows={3} placeholder="Street, city, state, zip" />
      </FormField>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <Button type="submit" loading={isLoading ?? isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
