import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Mail, Lock } from 'lucide-react'
import { useAuth, useLogin } from '@/hooks/useAuth'
import { getApiErrorMessage, tokenStorage } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const { isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tokenStorage.isValid() && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (tokenStorage.isValid() && isLoading) {
    return <LoadingSpinner fullPage />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login.mutateAsync({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6">
                <path
                  d="M4 22h24M6 22V16a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="24" r="2" fill="white" />
                <circle cx="22" cy="24" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              OpenFleet
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
            Sign in
          </h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Enter your credentials to access the fleet management system.
          </p>

          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
            className="space-y-4"
          >
            <FormField label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@openfleet.io"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </FormField>

            {error && (
              <div
                className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" loading={login.isPending} className="w-full justify-center">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Default:{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">
              admin@openfleet.io
            </code>{' '}
            /{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">
              Admin@1234
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
