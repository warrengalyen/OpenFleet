import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime } from '@/lib/formatters'
import { useToast } from '@/components/ui/Toaster'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAddWorkOrderNote, useWorkOrderNotes } from './hooks'
import { noteFormSchema, type NoteFormValues } from './schemas'

interface WorkOrderNotesProps {
  workOrderId: string
}

export function WorkOrderNotes({ workOrderId }: WorkOrderNotesProps) {
  const { user } = useAuth()
  const toast = useToast()
  const { data: notes, isLoading, isError, refetch } = useWorkOrderNotes(workOrderId)
  const addNote = useAddWorkOrderNote(workOrderId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { content: '' },
  })

  async function onSubmit(values: NoteFormValues) {
    if (!user) return
    try {
      await addNote.mutateAsync({
        content: values.content,
        authorName: user.fullName,
      })
      reset()
      toast.success('Note added')
    } catch (err) {
      toast.error('Failed to add note', getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="space-y-3"
        noValidate
      >
        <FormField label="Add note" error={errors.content?.message}>
          <Textarea {...register('content')} rows={3} placeholder="Write a note…" />
        </FormField>
        <Button type="submit" size="sm" loading={isSubmitting || addNote.isPending}>
          Add note
        </Button>
      </form>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load notes.{' '}
          <button type="button" onClick={() => void refetch()} className="underline">
            Retry
          </button>
        </p>
      ) : notes && notes.length > 0 ? (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
            >
              <p className="text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {note.authorName} · {formatDateTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">No notes yet.</p>
      )}
    </div>
  )
}
