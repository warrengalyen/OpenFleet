import { z } from 'zod'

export const maintenanceScheduleFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Schedule name is required.')
      .max(200, 'Name must not exceed 200 characters.'),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters.')
      .optional(),
    vehicleId: z.string().optional(),
    assetId: z.string().optional(),
    mileageInterval: z.coerce.number().optional(),
    dayInterval: z.coerce.number().optional(),
  })
  .refine((data) => !!data.vehicleId || !!data.assetId, {
    message: 'Select a vehicle or asset for this schedule.',
    path: ['vehicleId'],
  })
  .refine((data) => !!data.mileageInterval || !!data.dayInterval, {
    message: 'Provide a mileage interval, day interval, or both.',
    path: ['mileageInterval'],
  })
  .refine((data) => !data.mileageInterval || data.mileageInterval > 0, {
    message: 'Mileage interval must be greater than zero.',
    path: ['mileageInterval'],
  })
  .refine((data) => !data.dayInterval || data.dayInterval > 0, {
    message: 'Day interval must be greater than zero.',
    path: ['dayInterval'],
  })

export type MaintenanceScheduleFormValues = z.infer<typeof maintenanceScheduleFormSchema>

export const markPerformedSchema = z.object({
  performedAt: z.string().min(1, 'Performed date is required.'),
  mileage: z.coerce.number().min(0, 'Mileage must be zero or greater.').optional(),
})

export type MarkPerformedFormValues = z.infer<typeof markPerformedSchema>
