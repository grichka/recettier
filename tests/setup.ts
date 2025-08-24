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

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  databases: vi.fn().mockResolvedValue([]),
  deleteDatabase: vi.fn(),
}

const mockIDBDatabase = {
  close: vi.fn(),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn(),
  transaction: vi.fn(),
  objectStoreNames: [],
  version: 1,
  name: 'test-db',
}

const mockIDBObjectStore = {
  add: vi.fn(),
  clear: vi.fn(),
  count: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  getAllKeys: vi.fn(),
  getKey: vi.fn(),
  put: vi.fn(),
  openCursor: vi.fn(),
  openKeyCursor: vi.fn(),
  index: vi.fn(),
  createIndex: vi.fn(),
  deleteIndex: vi.fn(),
  indexNames: [],
  keyPath: null,
  name: 'test-store',
  autoIncrement: false,
}

const mockIDBTransaction = {
  abort: vi.fn(),
  commit: vi.fn(),
  objectStore: vi.fn().mockReturnValue(mockIDBObjectStore),
  db: mockIDBDatabase,
  durability: 'default',
  mode: 'readonly',
  objectStoreNames: [],
  error: null,
}

const mockIDBRequest = {
  result: null as unknown,
  error: null,
  source: null,
  transaction: mockIDBTransaction,
  readyState: 'done' as IDBRequestReadyState,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onsuccess: null as ((event: Event) => void) | null,
  onerror: null as ((event: Event) => void) | null,
}

// Setup IndexedDB mock behavior
mockIndexedDB.open.mockImplementation(() => {
  const request = { ...mockIDBRequest }
  // Simulate successful connection
  setTimeout(() => {
    request.result = mockIDBDatabase
    if (request.onsuccess) {
      const event = { target: request } as unknown as Event
      request.onsuccess(event)
    }
  }, 0)
  return request
})

mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction)

// Mock crypto.subtle for Web Crypto API
const mockCryptoSubtle = {
  importKey: vi.fn(),
  exportKey: vi.fn(),
  generateKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  sign: vi.fn(),
  verify: vi.fn(),
  digest: vi.fn(),
  deriveBits: vi.fn(),
  deriveKey: vi.fn(),
  wrapKey: vi.fn(),
  unwrapKey: vi.fn(),
}

// Setup crypto mock behavior for our encryption needs
mockCryptoSubtle.importKey.mockResolvedValue({} as CryptoKey)
mockCryptoSubtle.deriveKey.mockResolvedValue({} as CryptoKey)
mockCryptoSubtle.encrypt.mockResolvedValue(new ArrayBuffer(32))
mockCryptoSubtle.decrypt.mockResolvedValue(new ArrayBuffer(32))
mockCryptoSubtle.digest.mockResolvedValue(new ArrayBuffer(32))

Object.defineProperty(window, 'crypto', {
  value: {
    subtle: mockCryptoSubtle,
    getRandomValues: vi.fn().mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }),
    randomUUID: vi.fn().mockReturnValue('test-uuid-1234-5678-9012'),
  },
  writable: true,
  configurable: true
})

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
  configurable: true
})

// Mock btoa and atob for base64 encoding/decoding
Object.defineProperty(global, 'btoa', {
  value: (str: string) => Buffer.from(str, 'binary').toString('base64'),
  writable: true,
  configurable: true
})

Object.defineProperty(global, 'atob', {
  value: (str: string) => {
    try {
      // Check if string contains only valid base64 characters
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) {
        throw new Error('Invalid character')
      }
      return Buffer.from(str, 'base64').toString('binary')
    } catch {
      throw new Error('Invalid character')
    }
  },
  writable: true,
  configurable: true
})

// Mock sessionStorage  
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn().mockReturnValue('test-session'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Define the mock window API type
interface MockWindowAPI {
  addEventListener: typeof mockAddEventListener
  removeEventListener: typeof mockRemoveEventListener
  dispatchEvent: typeof mockDispatchEvent
  matchMedia: typeof window.matchMedia
  indexedDB: typeof mockIndexedDB
  crypto: {
    subtle: typeof mockCryptoSubtle
    getRandomValues: ReturnType<typeof vi.fn>
    randomUUID: ReturnType<typeof vi.fn>
  }
  localStorage: typeof localStorageMock
}

// Expose mocks globally for test access
;(global as typeof global & { mockWindowAPI: MockWindowAPI }).mockWindowAPI = {
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  dispatchEvent: mockDispatchEvent,
  matchMedia: window.matchMedia,
  indexedDB: mockIndexedDB,
  crypto: {
    subtle: mockCryptoSubtle,
    getRandomValues: vi.fn(),
    randomUUID: vi.fn(),
  },
  localStorage: localStorageMock,
}

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  
  // Reset IndexedDB mocks
  mockIDBObjectStore.get.mockResolvedValue(undefined)
  mockIDBObjectStore.put.mockResolvedValue('test-key')
  mockIDBObjectStore.delete.mockResolvedValue(undefined)
  mockIDBObjectStore.clear.mockResolvedValue(undefined)
})