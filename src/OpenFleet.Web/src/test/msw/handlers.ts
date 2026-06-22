import { http, HttpResponse } from 'msw'
import { createTestLoginResponse, createTestUser } from '../fixtures/auth'
import { createTestDepartment } from '../fixtures/departments'
import { createTestWorkOrder } from '../fixtures/workOrders'

const API = '/api'

const departments = [
  createTestDepartment(),
  createTestDepartment({
    id: 'dept-2',
    name: 'Maintenance',
    code: 'MNT',
    vehicleCount: 0,
    userCount: 0,
    assetCount: 0,
    hasAssignments: false,
  }),
]

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

  http.get(`${API}/departments`, () => HttpResponse.json(departments)),

  http.get(`${API}/departments/:id`, ({ params }) => {
    const department = departments.find((dept) => dept.id === params.id)
    if (!department) {
      return HttpResponse.json({ title: 'Not Found' }, { status: 404 })
    }
    return HttpResponse.json(department)
  }),

  http.post(`${API}/departments`, async ({ request }) => {
    const body = (await request.json()) as { name: string; code: string }
    const duplicate = departments.some(
      (dept) =>
        dept.name.toLowerCase() === body.name.toLowerCase() ||
        dept.code.toLowerCase() === body.code.toLowerCase(),
    )
    if (duplicate) {
      return HttpResponse.json({ message: 'Department already exists.' }, { status: 409 })
    }
    const created = createTestDepartment({
      id: `dept-${departments.length + 1}`,
      name: body.name,
      code: body.code,
      vehicleCount: 0,
      userCount: 0,
      assetCount: 0,
      hasAssignments: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    departments.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put(`${API}/departments/:id`, async ({ params, request }) => {
    const index = departments.findIndex((dept) => dept.id === params.id)
    if (index < 0) {
      return HttpResponse.json({ title: 'Not Found' }, { status: 404 })
    }
    const body = (await request.json()) as { name?: string; code?: string }
    const updated = {
      ...departments[index],
      name: body.name ?? departments[index].name,
      code: body.code ?? departments[index].code,
      updatedAt: new Date().toISOString(),
    }
    departments[index] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/departments/:id`, ({ params }) => {
    const index = departments.findIndex((dept) => dept.id === params.id)
    if (index < 0) {
      return HttpResponse.json({ title: 'Not Found' }, { status: 404 })
    }
    if (departments[index].hasAssignments) {
      return HttpResponse.json({ message: 'Department has assignments.' }, { status: 409 })
    }
    departments.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
