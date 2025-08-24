import React from 'react'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { theme } from '../utils/theme'

// Enhanced window API mocking for React hooks
export const setupWindowMocks = () => {
  // Mock window.matchMedia if not already mocked
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    })
  }

  // Mock window.addEventListener if not already mocked
  if (!window.addEventListener || typeof window.addEventListener !== 'function') {
    Object.defineProperty(window, 'addEventListener', {
      writable: true,
      configurable: true,
      value: vi.fn()
    })
  }

  // Mock window.removeEventListener if not already mocked
  if (!window.removeEventListener || typeof window.removeEventListener !== 'function') {
    Object.defineProperty(window, 'removeEventListener', {
      writable: true,
      configurable: true,
      value: vi.fn()
    })
  }

  // Mock navigator.storage if not already mocked
  if (!navigator.storage) {
    Object.defineProperty(navigator, 'storage', {
      writable: true,
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({
          quota: 1000000,
          usage: 500000,
          usageDetails: {
            indexedDB: 300000,
            caches: 200000
          }
        })
      }
    })
  }
}

// Call setup on import
setupWindowMocks()

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  accessToken: 'mock-token',
  getBasicProfile: () => ({
    getId: () => '123',
    getEmail: () => 'test@example.com',
    getName: () => 'Test User',
    getImageUrl: () => 'https://example.com/avatar.jpg',
  }),
  ...overrides,
})

export const createMockRecipe = (overrides = {}) => ({
  id: '1',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  ingredients: [
    { id: '1', name: 'Test Ingredient', amount: '1 cup', category: 'dairy' },
  ],
  instructions: ['Mix ingredients', 'Cook well'],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: 'easy' as const,
  categories: ['dinner'],
  tags: ['quick', 'easy'],
  nutrition: {
    calories: 200,
    protein: 10,
    carbs: 20,
    fat: 8,
    fiber: 2,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: '123',
  ...overrides,
})

export const createMockIngredient = (overrides = {}) => ({
  id: '1',
  name: 'Test Ingredient',
  category: 'dairy',
  unit: 'cup',
  ...overrides,
})

// Mock functions for services
export const mockGoogleAuth = {
  initialize: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  isSignedIn: vi.fn(),
  hasUserProfile: vi.fn(),
}

export const mockPWAService = {
  showInstallPrompt: vi.fn(),
  getInstallStatus: vi.fn(),
  onInstallStatusChange: vi.fn(),
  requestBackgroundSync: vi.fn(),
  getStorageEstimate: vi.fn(),
}

// Helper to wait for async operations
export const waitFor = (fn: () => void, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      try {
        fn()
        resolve(true)
      } catch (error) {
        if (Date.now() - start >= timeout) {
          reject(error)
        } else {
          setTimeout(check, 10)
        }
      }
    }
    check()
  })
}