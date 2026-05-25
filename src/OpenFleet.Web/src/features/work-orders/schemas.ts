import { z } from 'zod'

export const workOrderFormSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required.')
      .max(300, 'Title must not exceed 300 characters.'),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters.')
      .optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    vehicleId: z.string().optional(),
    assetId: z.string().optional(),
    assignedUserId: z.string().optional(),
  })
  .refine((data) => !!data.vehicleId || !!data.assetId, {
    message: 'Select a vehicle or asset for this work order.',
    path: ['vehicleId'],
  })

export type WorkOrderFormValues = z.infer<typeof workOrderFormSchema>

export const noteFormSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required.')
    .max(2000, 'Note content must not exceed 2000 characters.'),
})

export type NoteFormValues = z.infer<typeof noteFormSchema>

export const laborFormSchema = z.object({
  hours: z.coerce
    .number()
    .min(0, 'Labor hours must be zero or greater.')
    .max(1000, 'Labor hours must not exceed 1000 per entry.'),
})

export type LaborFormValues = z.infer<typeof laborFormSchema>

export const maintenanceRecordSchema = z.object({
  performedAt: z.string().min(1, 'Performed date is required.'),
  odometerReading: z.coerce
    .number()
    .int()
    .min(0, 'Odometer reading must be zero or greater.'),
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters.'),
})

export type MaintenanceRecordFormValues = z.infer<typeof maintenanceRecordSchema>
