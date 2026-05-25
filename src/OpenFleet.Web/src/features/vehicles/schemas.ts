import { z } from 'zod'

const currentYear = new Date().getFullYear()

export const vehicleFormSchema = z.object({
  vin: z
    .string()
    .min(1, 'VIN is required.')
    .max(17, 'VIN must not exceed 17 characters.')
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, 'VIN must be alphanumeric (no I, O, or Q).'),
  licensePlate: z
    .string()
    .min(1, 'License plate is required.')
    .max(20, 'License plate must not exceed 20 characters.'),
  make: z.string().min(1, 'Make is required.').max(100),
  model: z.string().min(1, 'Model is required.').max(100),
  year: z.coerce
    .number()
    .int()
    .min(1900, `Year must be between 1900 and ${currentYear + 1}.`)
    .max(currentYear + 1, `Year must be between 1900 and ${currentYear + 1}.`),
  mileage: z.coerce.number().min(0, 'Mileage must be zero or greater.'),
  status: z.enum(['Active', 'InMaintenance', 'OutOfService', 'Retired']),
  departmentId: z.string().min(1, 'Department is required.'),
})

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>
