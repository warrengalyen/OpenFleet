import { z } from 'zod'
import { normalizeWorkOrderPriority } from '@/lib/enums'

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

export const departmentFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Department name is required.')
    .max(100, 'Name must not exceed 100 characters.'),
  code: z
    .string()
    .min(1, 'Department code is required.')
    .max(20, 'Code must not exceed 20 characters.')
    .regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers.'),
})

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>

const workOrderPriorityValues = ['Low', 'Medium', 'High', 'Critical'] as const

export const settingsFormSchema = z.object({
  organizationName: z
    .string()
    .min(1, 'Organization name is required.')
    .max(200, 'Organization name must not exceed 200 characters.'),
  defaultWorkOrderPriority: z.preprocess(
    (value) => normalizeWorkOrderPriority(value),
    z.enum(workOrderPriorityValues, {
      message: 'Default work order priority is required.',
    }),
  ),
  defaultWorkOrderDueDays: z.coerce
    .number()
    .int('Due days must be a whole number.')
    .min(1, 'Default work order due days must be greater than zero.'),
  autoCreateWorkOrderOnFailedInspection: z.boolean(),
  maintenanceReminderLeadDays: z.coerce
    .number()
    .int('Lead days must be a whole number.')
    .min(0, 'Maintenance reminder lead days must be zero or greater.'),
  lowPartsStockThreshold: z.coerce
    .number()
    .int('Threshold must be a whole number.')
    .min(0, 'Low parts stock threshold must be zero or greater.'),
  integrationRetryLimit: z.coerce
    .number()
    .int('Retry limit must be a whole number.')
    .min(0, 'Integration retry limit must be zero or greater.'),
  auditLogRetentionDays: z.coerce
    .number()
    .int('Retention days must be a whole number.')
    .min(1, 'Audit log retention days must be greater than zero.'),
})

export type SettingsFormValues = z.infer<typeof settingsFormSchema>

export const WORK_ORDER_PRIORITY_OPTIONS = workOrderPriorityValues.map((priority) => ({
  value: priority,
  label: priority,
}))
