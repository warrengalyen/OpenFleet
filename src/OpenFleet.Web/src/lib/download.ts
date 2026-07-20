import type { AxiosResponse } from 'axios'
import type { ProblemDetails } from '@/types'

/** Parse Content-Disposition for filename= or filename*=UTF-8''... */
export function parseContentDispositionFilename(header: string | null | undefined): string | null {
  if (!header) return null

  const utf8Match = /filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ''))
    } catch {
      return utf8Match[1].trim().replace(/^["']|["']$/g, '')
    }
  }

  const plainMatch = /filename\s*=\s*("?)([^";]+)\1/i.exec(header)
  if (plainMatch?.[2]) {
    return plainMatch[2].trim()
  }

  return null
}

/** Trigger a browser download from a blob response; always revokes the object URL. */
export function downloadBlobResponse(
  response: AxiosResponse<Blob>,
  fallbackFilename: string,
): void {
  const header =
    (response.headers['content-disposition'] as string | undefined) ??
    (response.headers['Content-Disposition'] as string | undefined)
  const filename = parseContentDispositionFilename(header) ?? fallbackFilename

  const url = URL.createObjectURL(response.data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Extract RFC 7807 ProblemDetails from a blob error response body. */
export async function getProblemDetailsFromBlob(
  error: unknown,
): Promise<ProblemDetails | null> {
  const axiosError = error as {
    response?: { data?: Blob | ProblemDetails; status?: number }
  }
  const data = axiosError?.response?.data
  if (!data) return null

  if (data instanceof Blob) {
    try {
      const text = await data.text()
      if (!text) return null
      return JSON.parse(text) as ProblemDetails
    } catch {
      return null
    }
  }

  if (typeof data === 'object' && data !== null && 'title' in data) {
    return data as ProblemDetails
  }

  return null
}

/** User-facing message from a blob or JSON API error. */
export async function getBlobApiErrorMessage(error: unknown): Promise<string> {
  const problem = await getProblemDetailsFromBlob(error)
  if (problem?.detail) return problem.detail
  if (problem?.title) return problem.title
  return 'Something went wrong. Please try again.'
}
