import { z } from 'zod'

export const vendorFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Vendor name is required.')
    .max(200, 'Name must not exceed 200 characters.'),
  contactName: z.string().max(100, 'Contact name must not exceed 100 characters.').optional(),
  email: z
    .string()
    .max(200, 'Email must not exceed 200 characters.')
    .email('Email must be a valid address.')
    .optional()
    .or(z.literal('')),
  phone: z.string().max(30, 'Phone must not exceed 30 characters.').optional(),
  address: z.string().max(500, 'Address must not exceed 500 characters.').optional(),
})

export type VendorFormValues = z.infer<typeof vendorFormSchema>
