import { z } from 'zod'

export const profileFormSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required.').max(100),
    lastName: z.string().min(1, 'Last name is required.').max(100),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    const changingPassword =
      values.currentPassword.length > 0
      || values.newPassword.length > 0
      || values.confirmPassword.length > 0

    if (!changingPassword) return

    if (!values.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentPassword'],
        message: 'Current password is required to set a new password.',
      })
    }

    if (values.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'Password must be at least 8 characters.',
      })
    } else if (values.newPassword.length > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'Password must not exceed 100 characters.',
      })
    }

    if (values.newPassword !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      })
    }
  })

export type ProfileFormValues = z.infer<typeof profileFormSchema>
