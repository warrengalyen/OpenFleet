import { useForm } from 'react-hook-form'
import { Dialog, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { zodFormResolver } from '@/lib/form'
import { markPerformedSchema, type MarkPerformedFormValues } from './schemas'

interface MarkPerformedDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: MarkPerformedFormValues) => Promise<void>
  scheduleName: string
  isLoading?: boolean
}

export function MarkPerformedDialog({
  open,
  onClose,
  onSubmit,
  scheduleName,
  isLoading,
}: MarkPerformedDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MarkPerformedFormValues>({
    resolver: zodFormResolver(markPerformedSchema),
    defaultValues: {
      performedAt: new Date().toISOString().slice(0, 16),
      mileage: undefined,
    },
  })

  function handleClose() {
    reset()
    onClose()
  }

  async function handleFormSubmit(values: MarkPerformedFormValues) {
    await onSubmit(values)
    reset()
  }

  return (
    <Dialog open={open} onClose={handleClose} title={`Mark performed - ${scheduleName}`}>
      <form
        onSubmit={(e) => {
          void handleSubmit(handleFormSubmit)(e)
        }}
        noValidate
      >
        <DialogBody className="space-y-4">
          <FormField label="Performed at" required error={errors.performedAt?.message}>
            <Input {...register('performedAt')} type="datetime-local" />
          </FormField>
          <FormField
            label="Odometer reading"
            error={errors.mileage?.message}
            hint="Optional mileage at time of service"
          >
            <Input {...register('mileage')} type="number" min={0} placeholder="e.g. 45000" />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading ?? isSubmitting}>
            Mark performed
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
