import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import { getProblemDetails } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { AlertCircle } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login.mutateAsync({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const problem = getProblemDetails(err)
      setError(problem.detail ?? problem.title)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6">
                <path d="M4 22h24M6 22V16a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="10" cy="24" r="2" fill="white"/>
                <circle cx="22" cy="24" r="2" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">OpenFleet</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-semibold text-gray-900">Sign in</h1>

          <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@openfleet.io"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" loading={login.isPending} className="w-full justify-center">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Default: <code className="rounded bg-gray-100 px-1 py-0.5">admin@openfleet.io</code> /{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">Admin@1234</code>
          </p>
        </div>
      </div>
    </div>
  )
}
