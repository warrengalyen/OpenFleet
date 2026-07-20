import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadBlobResponse,
  getBlobApiErrorMessage,
  getProblemDetailsFromBlob,
  parseContentDispositionFilename,
} from '@/lib/download'

describe('parseContentDispositionFilename', () => {
  it('parses quoted filename', () => {
    expect(
      parseContentDispositionFilename('attachment; filename="work-order-Brake.pdf"'),
    ).toBe('work-order-Brake.pdf')
  })

  it('parses filename*=UTF-8 encoding', () => {
    expect(
      parseContentDispositionFilename(
        "attachment; filename*=UTF-8''vehicle-8ABC123-maintenance-history.pdf",
      ),
    ).toBe('vehicle-8ABC123-maintenance-history.pdf')
  })

  it('prefers filename* over filename', () => {
    expect(
      parseContentDispositionFilename(
        'attachment; filename="plain.pdf"; filename*=UTF-8\'\'encoded%20name.pdf',
      ),
    ).toBe('encoded name.pdf')
  })

  it('returns null when header missing', () => {
    expect(parseContentDispositionFilename(null)).toBeNull()
    expect(parseContentDispositionFilename(undefined)).toBeNull()
  })
})

describe('downloadBlobResponse', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses Content-Disposition filename and revokes object URL', () => {
    const click = vi.fn()
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string, options?: ElementCreationOptions) => {
        if (tag === 'a') {
          return { click, href: '', download: '' } as unknown as HTMLAnchorElement
        }
        return Document.prototype.createElement.call(document, tag, options)
      })

    downloadBlobResponse(
      {
        data: new Blob(['%PDF'], { type: 'application/pdf' }),
        headers: {
          'content-disposition': 'attachment; filename="from-header.pdf"',
        },
      } as never,
      'fallback.pdf',
    )

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    const anchor = createElement.mock.results.find((r) => r.type === 'return')
      ?.value as HTMLAnchorElement
    expect(anchor.download).toBe('from-header.pdf')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('uses fallback filename when Content-Disposition is absent', () => {
    const click = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'a') {
          return { click, href: '', download: '' } as unknown as HTMLAnchorElement
        }
        return Document.prototype.createElement.call(document, tag, options)
      },
    )

    downloadBlobResponse(
      {
        data: new Blob(['%PDF'], { type: 'application/pdf' }),
        headers: {},
      } as never,
      'fallback-name.pdf',
    )

    const createElement = document.createElement as unknown as ReturnType<typeof vi.fn>
    const anchor = createElement.mock.results.find(
      (r: { type: string; value: unknown }) =>
        r.type === 'return' && (r.value as HTMLAnchorElement).download !== undefined,
    )?.value as HTMLAnchorElement
    expect(anchor.download).toBe('fallback-name.pdf')
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })
})

describe('getProblemDetailsFromBlob', () => {
  it('parses RFC 7807 JSON from a blob error body', async () => {
    const problem = {
      type: 'https://httpstatuses.io/404',
      title: 'Not Found',
      status: 404,
      detail: 'Work order not found.',
    }
    const error = {
      response: {
        status: 404,
        data: new Blob([JSON.stringify(problem)], { type: 'application/problem+json' }),
      },
    }

    await expect(getProblemDetailsFromBlob(error)).resolves.toEqual(problem)
    await expect(getBlobApiErrorMessage(error)).resolves.toBe('Work order not found.')
  })

  it('falls back to a generic message when blob is not JSON', async () => {
    const error = {
      response: {
        status: 500,
        data: new Blob(['not-json'], { type: 'text/plain' }),
      },
    }

    await expect(getProblemDetailsFromBlob(error)).resolves.toBeNull()
    await expect(getBlobApiErrorMessage(error)).resolves.toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('reads ProblemDetails when error data is already a JSON object', async () => {
    const error = {
      response: {
        status: 404,
        data: {
          title: 'Not Found',
          detail: 'Missing work order.',
          status: 404,
        },
      },
    }

    await expect(getBlobApiErrorMessage(error)).resolves.toBe('Missing work order.')
  })
})
