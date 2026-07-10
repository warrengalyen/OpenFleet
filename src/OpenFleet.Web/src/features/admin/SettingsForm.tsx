import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { getApiValidationErrors } from '@/lib/api'
import { zodFormResolver } from '@/lib/form'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { ApplicationSettingsResponse } from '@/types/settings'
import {
  settingsFormSchema,
  WORK_ORDER_PRIORITY_OPTIONS,
  type SettingsFormValues,
} from './schemas'

interface SettingsFormProps {
  defaultValues: SettingsFormValues
  onSubmit: (values: SettingsFormValues) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  readOnly?: boolean
}

export function settingsToFormValues(settings: ApplicationSettingsResponse): SettingsFormValues {
  return {
    organizationName: settings.organizationName,
    defaultWorkOrderPriority: settings.defaultWorkOrderPriority,
    defaultWorkOrderDueDays: settings.defaultWorkOrderDueDays,
    autoCreateWorkOrderOnFailedInspection: settings.autoCreateWorkOrderOnFailedInspection,
    maintenanceReminderLeadDays: settings.maintenanceReminderLeadDays,
    lowPartsStockThreshold: settings.lowPartsStockThreshold,
    integrationRetryLimit: settings.integrationRetryLimit,
    auditLogRetentionDays: settings.auditLogRetentionDays,
  }
}

export function SettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  readOnly = false,
}: SettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodFormResolver(settingsFormSchema),
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  async function handleFormSubmit(values: SettingsFormValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      const fieldErrors = getApiValidationErrors(err)
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof SettingsFormValues, { type: 'server', message })
        }
        return
      }
      throw err
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(handleFormSubmit)(e)
      }}
      className="space-y-8"
      noValidate
    >
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Organization</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Displayed in the application header and dashboard welcome area.
          </p>
        </div>

        <FormField
          label="Organization name"
          required
          error={errors.organizationName?.message}
          hint="Shown to all authenticated users across the fleet dashboard."
        >
          <Input
            {...register('organizationName')}
            placeholder="OpenFleet"
            disabled={readOnly}
            autoComplete="organization"
          />
        </FormField>
      </section>

      <section className="space-y-5 border-t border-gray-100 pt-8 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Work orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Defaults applied when new work orders are created without explicit values.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="Default priority"
            required
            error={errors.defaultWorkOrderPriority?.message}
            hint="Used when a work order is created without a priority."
          >
            <Select {...register('defaultWorkOrderPriority')} disabled={readOnly}>
              {WORK_ORDER_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Default due days"
            required
            error={errors.defaultWorkOrderDueDays?.message}
            hint="Number of days from creation until the work order due date."
          >
            <Input
              {...register('defaultWorkOrderDueDays')}
              type="number"
              min={1}
              disabled={readOnly}
            />
          </FormField>
        </div>

        <Checkbox
          {...register('autoCreateWorkOrderOnFailedInspection')}
          label="Auto-create work order on failed inspection"
          description="When enabled, a corrective work order is generated automatically when an inspection fails."
          disabled={readOnly}
        />
      </section>

      <section className="space-y-5 border-t border-gray-100 pt-8 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Maintenance & inventory
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="Maintenance reminder lead days"
            required
            error={errors.maintenanceReminderLeadDays?.message}
            hint="Include schedules due within this many days in due/upcoming reports."
          >
            <Input
              {...register('maintenanceReminderLeadDays')}
              type="number"
              min={0}
              disabled={readOnly}
            />
          </FormField>

          <FormField
            label="Low parts stock threshold"
            required
            error={errors.lowPartsStockThreshold?.message}
            hint="Parts at or below this quantity are flagged as low stock."
          >
            <Input
              {...register('lowPartsStockThreshold')}
              type="number"
              min={0}
              disabled={readOnly}
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-5 border-t border-gray-100 pt-8 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Integrations & audit
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="Integration retry limit"
            required
            error={errors.integrationRetryLimit?.message}
            hint="Maximum failed sync attempts before an integration is marked permanently failed."
          >
            <Input
              {...register('integrationRetryLimit')}
              type="number"
              min={0}
              disabled={readOnly}
            />
          </FormField>

          <FormField
            label="Audit log retention days"
            required
            error={errors.auditLogRetentionDays?.message}
            hint="Stored for future cleanup jobs. Retention is not enforced automatically yet."
          >
            <Input
              {...register('auditLogRetentionDays')}
              type="number"
              min={1}
              disabled={readOnly}
            />
          </FormField>
        </div>
      </section>

      {!readOnly && (
        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button
            type="button"
            variant="secondary"
            onClick={() => reset(defaultValues)}
            disabled={!isDirty || isLoading || isSubmitting}
          >
            Reset
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading ?? isSubmitting}>
            Save settings
          </Button>
        </div>
      )}
    </form>
  )
}
