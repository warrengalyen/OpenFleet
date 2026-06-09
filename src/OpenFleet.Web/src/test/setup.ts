import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { clearTestStorage, installLocalStorageMock } from './localStorage'
import { server } from './msw/server'

installLocalStorageMock()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  clearTestStorage()
})
afterAll(() => server.close())
