import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
          <div className="max-w-md rounded-xl border border-red-100 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="mb-6 text-sm text-gray-500">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
