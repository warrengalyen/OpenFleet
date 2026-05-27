import { z } from 'zod'

export const inspectionFormSchema = z
  .object({
    vehicleId: z.string().optional(),
    assetId: z.string().optional(),
    inspectorUserId: z.string().min(1, 'Inspector is required.'),
    inspectedAt: z.string().min(1, 'Inspection date is required.'),
    status: z.enum(['Passed', 'Failed', 'NeedsReview']),
    notes: z.string().max(2000, 'Notes must not exceed 2000 characters.').optional(),
  })
  .refine((data) => !!data.vehicleId || !!data.assetId, {
    message: 'Select a vehicle or asset for this inspection.',
    path: ['vehicleId'],
  })

export type InspectionFormValues = z.infer<typeof inspectionFormSchema>

export const inspectionUpdateSchema = z.object({
  status: z.enum(['Passed', 'Failed', 'NeedsReview']),
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters.').optional(),
})

export type InspectionUpdateValues = z.infer<typeof inspectionUpdateSchema>
