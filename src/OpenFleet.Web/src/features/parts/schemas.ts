import { z } from 'zod'

export const partFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Part name is required.')
    .max(200, 'Name must not exceed 200 characters.'),
  partNumber: z
    .string()
    .min(1, 'Part number is required.')
    .max(100, 'Part number must not exceed 100 characters.'),
  vendorId: z.string().min(1, 'Vendor is required.'),
  quantityOnHand: z.coerce.number().min(0, 'Quantity must be zero or greater.'),
  unitCost: z.coerce.number().min(0, 'Unit cost must be zero or greater.'),
})

export type PartFormValues = z.infer<typeof partFormSchema>
