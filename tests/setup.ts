import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock Google APIs
const mockGapi = {
  load: vi.fn(),
  accounts: {
    oauth2: {
      initTokenClient: vi.fn(),
    },
  },
}

// Mock window.google
Object.defineProperty(window, 'google', {
  value: mockGapi,
  writable: true,
})

// Mock Google Identity Services
const mockGoogleAccounts = {
  id: {
    initialize: vi.fn(),
    prompt: vi.fn(),
    renderButton: vi.fn(),
  },
}

Object.defineProperty(window, 'google', {
  value: {
    ...mockGapi,
    accounts: {
      ...mockGapi.accounts,
      ...mockGoogleAccounts,
    },
  },
  writable: true,
})

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve({
      scope: '/',
      unregister: vi.fn(() => Promise.resolve(true)),
      update: vi.fn(() => Promise.resolve()),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    ready: Promise.resolve({
      scope: '/',
      unregister: vi.fn(() => Promise.resolve(true)),
      update: vi.fn(() => Promise.resolve()),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock fetch
global.fetch = vi.fn()

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock BeforeInstallPromptEvent
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
const mockDispatchEvent = vi.fn()

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
  configurable: true
})

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
  configurable: true
})

Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
  configurable: true
})

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn().mockResolvedValue({
      quota: 1000000,
      usage: 500000,
      usageDetails: {
        indexedDB: 300000,
        caches: 200000
      }
    })
  },
  writable: true,
  configurable: true
})

// Expose mocks globally for test access
;(global as typeof global & { mockWindowAPI: unknown }).mockWindowAPI = {
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  dispatchEvent: mockDispatchEvent,
  matchMedia: window.matchMedia
}

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})