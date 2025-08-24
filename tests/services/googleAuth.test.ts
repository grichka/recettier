/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { googleAuthService } from '../../src/services/googleAuth'

// Mock the API key storage module
vi.mock('../../src/utils/apiKeyStorage', () => ({
  apiKeyStorage: {
    getApiKey: vi.fn(),
    setApiKey: vi.fn(),
    removeApiKey: vi.fn(),
    hasApiKey: vi.fn(),
    clearAllData: vi.fn(),
  },
  ApiKeyStorage: {
    validateApiKey: vi.fn(),
  },
}))

// Import the mocked storage
import { apiKeyStorage } from '../../src/utils/apiKeyStorage'

// Mock Google APIs
const mockTokenClient = {
  callback: vi.fn(),
  requestAccessToken: vi.fn(),
}

const mockGapi = {
  load: vi.fn(),
  client: {
    init: vi.fn(),
  },
}

describe('Google Auth Service', () => {
  let authService: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock API key storage to return a valid API key
    ;(apiKeyStorage.getApiKey as any).mockResolvedValue('test-api-key-12345')
    
    // Create a fresh instance for each test
    authService = googleAuthService
    
    // Reset the service state
    authService.isInitialized = false
    authService.initializationPromise = null
    authService.tokenClient = null
    authService.currentUser = null
    authService.accessToken = null
    authService.tokenExpiresAt = null
    
    // Mock global objects
    ;(global as any).window = {
      ...global.window,
      google: {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn().mockReturnValue(mockTokenClient),
            revoke: vi.fn(),
          },
        },
      },
      gapi: mockGapi,
    }
    
    ;(global as any).gapi = mockGapi
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    
    // Mock fetch
    global.fetch = vi.fn()
  })
  
  afterEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize Google APIs successfully', async () => {
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)

      await authService.initialize()
      
      expect(mockGapi.load).toHaveBeenCalledWith('client', expect.any(Object))
      expect(mockGapi.client.init).toHaveBeenCalled()
      expect((global as any).window.google.accounts.oauth2.initTokenClient).toHaveBeenCalled()
    })

    it('should handle initialization errors gracefully', async () => {
      const loadError = new Error('Load failed')
      mockGapi.load.mockImplementation((apis, callback) => {
        if (callback && typeof callback.onerror === 'function') {
          callback.onerror(loadError)
        } else {
          throw loadError
        }
      })

      await expect(authService.initialize()).rejects.toThrow('Load failed')
    })

    it('should not reinitialize if already initialized', async () => {
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)

      await authService.initialize()
      
      // Clear the mock to track subsequent calls
      vi.clearAllMocks()
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      await authService.initialize() // Second call should not reinitialize
      
      expect(mockGapi.load).not.toHaveBeenCalled()
    })
  })

  describe('Sign In', () => {
    beforeEach(async () => {
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)
      await authService.initialize()
    })

    it('should sign in user successfully', async () => {
      const mockUserInfo = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      })

      mockTokenClient.requestAccessToken.mockImplementation(() => {
        // Simulate token callback
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: 'mock_token',
            expires_in: 3600,
            scope: 'test',
            token_type: 'Bearer',
          })
        }
      })

      const user = await authService.signIn()
      
      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.getBasicProfile().getEmail()).toBe('test@example.com')
    })

    it('should handle sign in failure when no access token received', async () => {
      mockTokenClient.requestAccessToken.mockImplementation(() => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: '',
            expires_in: 0,
            scope: '',
            token_type: '',
          })
        }
      })

      await expect(authService.signIn()).rejects.toThrow()
    })

    it('should handle user info fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      mockTokenClient.requestAccessToken.mockImplementation(() => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: 'mock_token',
            expires_in: 3600,
            scope: 'test',
            token_type: 'Bearer',
          })
        }
      })

      await expect(authService.signIn()).rejects.toThrow('Failed to get user information')
    })

    it('should handle network errors during user info fetch', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      mockTokenClient.requestAccessToken.mockImplementation(() => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: 'mock_token',
            expires_in: 3600,
            scope: 'test',
            token_type: 'Bearer',
          })
        }
      })

      await expect(authService.signIn()).rejects.toThrow('Failed to get user information')
    })
  })

  describe('Sign Out', () => {
    beforeEach(async () => {
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)
      
      // Mock the revoke function for sign out tests
      ;(global as any).window.google.accounts.oauth2.revoke = vi.fn()
      
      await authService.initialize()
    })

    it('should sign out user successfully', async () => {
      // First sign in a user to have something to sign out
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/avatar.jpg'
        })
      })

      mockTokenClient.requestAccessToken.mockImplementation(() => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: 'mock_token',
            expires_in: 3600,
            scope: 'test',
            token_type: 'Bearer',
          })
        }
      })

      // Sign in first
      await authService.signIn()
      
      // Now test sign out
      await authService.signOut()
      
      expect((global as any).window.google.accounts.oauth2.revoke).toHaveBeenCalled()
      expect(localStorage.removeItem).toHaveBeenCalled()
    })

    it('should handle token revocation failure gracefully', async () => {
      ;(global as any).window.google.accounts.oauth2.revoke.mockImplementation(() => {
        throw new Error('Revocation failed')
      })

      // Should not throw - graceful handling
      await expect(authService.signOut()).resolves.toBeUndefined()
    })

    it('should handle network errors during token revocation', async () => {
      ;(global as any).window.google.accounts.oauth2.revoke.mockRejectedValue(new Error('Network error'))

      // Should not throw - graceful handling  
      await expect(authService.signOut()).resolves.toBeUndefined()
    })
  })

  describe('Current User', () => {
    beforeEach(async () => {
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)
      await authService.initialize()
    })

    it('should return null when no user is signed in', () => {
      const user = authService.getCurrentUser()
      expect(user).toBeNull()
    })

    it('should return current user when signed in', async () => {
      const mockUserInfo = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      })

      mockTokenClient.requestAccessToken.mockImplementation(() => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: 'mock_token',
            expires_in: 3600,
            scope: 'test',
            token_type: 'Bearer',
          })
        }
      })

      await authService.signIn()
      
      const user = authService.getCurrentUser()
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })
  })

  describe('Sign In Status', () => {
    beforeEach(async () => {
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)
      await authService.initialize()
    })

    it('should return false when no user is signed in', () => {
      const isSignedIn = authService.isSignedIn()
      expect(isSignedIn).toBe(false)
    })

    it('should return true when user is signed in', async () => {
      const mockUserInfo = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      })

      mockTokenClient.requestAccessToken.mockImplementation(() => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: 'mock_token',
            expires_in: 3600,
            scope: 'test',
            token_type: 'Bearer',
          })
        }
      })

      await authService.signIn()
      
      const isSignedIn = authService.isSignedIn()
      expect(isSignedIn).toBe(true)
    })
  })

  describe('User Profile Check', () => {
    beforeEach(async () => {
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)
      await authService.initialize()
    })

    it('should return false when no user profile exists', () => {
      const hasProfile = authService.hasUserProfile()
      expect(hasProfile).toBe(false)
    })

    it('should return true when user profile exists', async () => {
      const mockUserInfo = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      })

      mockTokenClient.requestAccessToken.mockImplementation(() => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: 'mock_token',
            expires_in: 3600,
            scope: 'test',
            token_type: 'Bearer',
          })
        }
      })

      await authService.signIn()
      
      const hasProfile = authService.hasUserProfile()
      expect(hasProfile).toBe(true)
    })
  })

  describe('Authentication State Persistence', () => {
    beforeEach(async () => {
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)
      await authService.initialize()
    })

    it('should save authentication state to localStorage', async () => {
      const mockUserInfo = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      })

      mockTokenClient.requestAccessToken.mockImplementation(() => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: 'mock_token',
            expires_in: 3600,
            scope: 'test',
            token_type: 'Bearer',
          })
        }
      })

      await authService.signIn()
      
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('should load authentication state from localStorage', async () => {
      // Create a new service instance to test fresh initialization
      const { GoogleAuthService } = await import('../../src/services/googleAuth')
      const freshAuthService = new GoogleAuthService()
      
      localStorage.getItem = vi.fn().mockReturnValue('encrypted_data')
      
      mockGapi.load.mockImplementation((apis, callback) => {
        if (typeof callback === 'function') {
          callback()
        } else if (callback && typeof callback.callback === 'function') {
          callback.callback()
        }
      })
      
      mockGapi.client.init.mockResolvedValue(undefined)
      
      // Should handle loading gracefully (mocking the actual decrypt is complex)
      await expect(freshAuthService.initialize()).resolves.toBeUndefined()
      expect(localStorage.getItem).toHaveBeenCalled()
    })

    it('should handle corrupted localStorage data', async () => {
      localStorage.getItem = vi.fn().mockReturnValue('corrupted_data')
      
      // Should not throw
      await expect(authService.initialize()).resolves.toBeUndefined()
    })

    it('should handle expired tokens in localStorage', async () => {
      localStorage.getItem = vi.fn().mockReturnValue('expired_data')
      
      // Should handle gracefully
      await expect(authService.initialize()).resolves.toBeUndefined()
    })
  })
})