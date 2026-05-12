/** RFC 7807 ProblemDetails returned by the API for all error responses. */
export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  correlationId?: string
  errors?: Record<string, string[]>
}
