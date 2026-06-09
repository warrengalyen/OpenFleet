import { http, HttpResponse } from 'msw'
import { createTestLoginResponse, createTestUser } from '../fixtures/auth'
import { createTestWorkOrder } from '../fixtures/workOrders'

const API = '/api'

export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'bad@openfleet.io') {
      return HttpResponse.json(
        { title: 'Unauthorized', detail: 'Invalid credentials.' },
        { status: 401 },
      )
    }
    return HttpResponse.json(createTestLoginResponse({ email: body.email }))
  }),

  http.get(`${API}/auth/me`, () => HttpResponse.json(createTestUser())),

  http.get(`${API}/workorders`, () =>
    HttpResponse.json([createTestWorkOrder()]),
  ),

  http.get(`${API}/workorders/:id`, ({ params }) =>
    HttpResponse.json(createTestWorkOrder({ id: String(params.id) })),
  ),

  http.patch(`${API}/workorders/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as { newStatus: string }
    return HttpResponse.json(
      createTestWorkOrder({
        id: String(params.id),
        status: body.newStatus as ReturnType<typeof createTestWorkOrder>['status'],
        allowedNextStatuses: ['Completed', 'Cancelled'],
      }),
    )
  }),

  http.get(`${API}/reports/work-orders-by-status`, () =>
    HttpResponse.json({
      open: 3,
      inProgress: 2,
      waitingForParts: 1,
      completed: 10,
      cancelled: 0,
      total: 16,
    }),
  ),

  http.get(`${API}/reports/maintenance-cost`, () =>
    HttpResponse.json({
      vehicles: [],
    }),
  ),

  http.get(`${API}/integrations`, () =>
    HttpResponse.json({
      items: [
        {
          id: 'log-1',
          source: 'FuelUsage',
          direction: 'Import',
          status: 'Failed',
          payload: null,
          errorMessage: 'Connection timeout',
          attemptCount: 2,
          lastAttemptAt: '2026-01-15T10:00:00Z',
          nextRetryAt: null,
          recordsProcessed: null,
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-01-15T10:00:00Z',
        },
      ],
      page: 1,
      pageSize: 5,
      totalCount: 1,
    }),
  ),

  http.get(`${API}/vehicles`, () => HttpResponse.json([])),

  http.get(`${API}/departments`, () => HttpResponse.json([])),
]
