import { z } from 'zod'

export const assetFormSchema = z.object({
  assetTag: z
    .string()
    .min(1, 'Asset tag is required.')
    .max(50, 'Asset tag must not exceed 50 characters.'),
  name: z.string().min(1, 'Name is required.').max(200, 'Name must not exceed 200 characters.'),
  type: z.string().min(1, 'Type is required.').max(100, 'Type must not exceed 100 characters.'),
  condition: z.enum(['New', 'Good', 'Fair', 'Poor', 'Damaged']),
  status: z.enum(['Available', 'InUse', 'UnderMaintenance', 'Decommissioned']),
  departmentId: z.string().min(1, 'Department is required.'),
  vehicleId: z.string().optional(),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>
