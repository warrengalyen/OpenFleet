import { z } from 'zod'

const userRoleValues = [
  'Viewer',
  'Technician',
  'Supervisor',
  'FleetManager',
  'Administrator',
] as const

export const createUserFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required.').max(100),
  lastName: z.string().min(1, 'Last name is required.').max(100),
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must not exceed 100 characters.'),
  role: z.enum(userRoleValues, { message: 'Role is required.' }),
  departmentId: z.string().min(1, 'Department is required.'),
})

export const editUserFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required.').max(100),
  lastName: z.string().min(1, 'Last name is required.').max(100),
  role: z.enum(userRoleValues, { message: 'Role is required.' }),
  departmentId: z.string().min(1, 'Department is required.'),
})

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>
export type EditUserFormValues = z.infer<typeof editUserFormSchema>

export const USER_ROLE_OPTIONS = userRoleValues.map((role) => ({ value: role, label: role }))
