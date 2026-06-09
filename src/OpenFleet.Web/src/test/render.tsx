import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/Toaster'

interface TestProvidersProps {
  children: ReactNode
  route?: string
  withAuth?: boolean
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function TestProviders({
  children,
  route = '/',
  withAuth = false,
}: TestProvidersProps) {
  const queryClient = createTestQueryClient()

  const tree = (
    <ToastProvider>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </ToastProvider>
  )

  return (
    <QueryClientProvider client={queryClient}>
      {withAuth ? <AuthProvider>{tree}</AuthProvider> : tree}
    </QueryClientProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  withAuth?: boolean
}

export function renderWithProviders(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { route, withAuth, ...renderOptions } = options
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders route={route} withAuth={withAuth}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  })
}

export { createTestQueryClient }
