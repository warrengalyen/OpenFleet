import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type ReactNode } from 'react'
import { type AxiosError } from 'axios'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toaster'
import { AuthProvider } from '@/context/AuthContext'
import { DarkModeProvider } from '@/context/DarkModeContext'
import type { ProblemDetails } from '@/types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status = (error as AxiosError<ProblemDetails>)?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DarkModeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ErrorBoundary>
    </DarkModeProvider>
  )
}
