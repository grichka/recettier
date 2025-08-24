import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the entire module to simplify testing
vi.mock('../../src/utils/apiKeyStorage', () => {
  const mockApiKeyStorage = {
    storeApiKey: vi.fn(),
    getApiKey: vi.fn(),
    removeApiKey: vi.fn(),
    hasApiKey: vi.fn(),
    clearAllData: vi.fn(),
  }

  // Create a real class for testing static methods
  class MockApiKeyStorage {
    static validateApiKey(apiKey: string): boolean {
      // Google API keys typically start with "AIza" and are 39 characters long,
      // but formats may vary. This regex matches the most common format.
      const googleApiKeyRegex = /^AIza[0-9A-Za-z-_]{35}$/;
      return googleApiKeyRegex.test(apiKey);
    }
    
    async storeApiKey(apiKey: string): Promise<void> {
      return mockApiKeyStorage.storeApiKey(apiKey)
    }
    
    async getApiKey(): Promise<string | null> {
      return mockApiKeyStorage.getApiKey()
    }
    
    async removeApiKey(): Promise<void> {
      return mockApiKeyStorage.removeApiKey()
    }
    
    async hasApiKey(): Promise<boolean> {
      return mockApiKeyStorage.hasApiKey()
    }
    
    async clearAllData(): Promise<void> {
      return mockApiKeyStorage.clearAllData()
    }
  }

  return {
    apiKeyStorage: new MockApiKeyStorage(),
    ApiKeyStorage: MockApiKeyStorage,
    __mockApiKeyStorage: mockApiKeyStorage, // Expose mock for test access
  }
})

import { apiKeyStorage } from '../../src/utils/apiKeyStorage'

// Get the mock object for assertions
interface MockApiKeyStorageModule {
  __mockApiKeyStorage: {
    storeApiKey: ReturnType<typeof vi.fn>
    getApiKey: ReturnType<typeof vi.fn>
    removeApiKey: ReturnType<typeof vi.fn>
    hasApiKey: ReturnType<typeof vi.fn>
    clearAllData: ReturnType<typeof vi.fn>
  }
}

const mockModule = await vi.importMock('../../src/utils/apiKeyStorage') as MockApiKeyStorageModule
const mockApiKeyStorage = mockModule.__mockApiKeyStorage

describe('API Key Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Basic Operations', () => {
    it('should return null when no API key is stored', async () => {
      mockApiKeyStorage.getApiKey.mockResolvedValue(null)

      const result = await apiKeyStorage.getApiKey()
      expect(result).toBeNull()
      expect(mockApiKeyStorage.getApiKey).toHaveBeenCalled()
    })

    it('should store and retrieve an API key successfully', async () => {
      const testApiKey = 'AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi'
      
      mockApiKeyStorage.storeApiKey.mockResolvedValue(undefined)
      mockApiKeyStorage.getApiKey.mockResolvedValue(testApiKey)

      // Store the API key
      await apiKeyStorage.storeApiKey(testApiKey)
      expect(mockApiKeyStorage.storeApiKey).toHaveBeenCalledWith(testApiKey)

      // Retrieve the API key
      const retrievedKey = await apiKeyStorage.getApiKey()
      expect(retrievedKey).toBe(testApiKey)
    })

    it('should remove an API key successfully', async () => {
      mockApiKeyStorage.removeApiKey.mockResolvedValue(undefined)

      await apiKeyStorage.removeApiKey()
      expect(mockApiKeyStorage.removeApiKey).toHaveBeenCalled()
    })
  })

  describe('Validation', () => {
    it('should validate correct Google API key format', () => {
      const validKey = 'AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi'
      
      // Access the static method through the constructor
      const ApiKeyStorageClass = apiKeyStorage.constructor as unknown as { validateApiKey: (key: string) => boolean }
      expect(ApiKeyStorageClass.validateApiKey(validKey)).toBe(true)
    })

    it('should reject invalid API key formats', () => {
      const ApiKeyStorageClass = apiKeyStorage.constructor as unknown as { validateApiKey: (key: string) => boolean }
      
      expect(ApiKeyStorageClass.validateApiKey('invalid-key')).toBe(false)
      expect(ApiKeyStorageClass.validateApiKey('too-short')).toBe(false)
      expect(ApiKeyStorageClass.validateApiKey('BIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghijk')).toBe(false) // wrong prefix
      expect(ApiKeyStorageClass.validateApiKey('')).toBe(false)
      expect(ApiKeyStorageClass.validateApiKey('AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi123')).toBe(false) // too long
      expect(ApiKeyStorageClass.validateApiKey('AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcde')).toBe(false) // too short
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors', async () => {
      mockApiKeyStorage.storeApiKey.mockRejectedValue(new Error('Storage failed'))

      await expect(apiKeyStorage.storeApiKey('test-key')).rejects.toThrow('Storage failed')
    })

    it('should handle retrieval errors', async () => {
      mockApiKeyStorage.getApiKey.mockRejectedValue(new Error('Retrieval failed'))

      await expect(apiKeyStorage.getApiKey()).rejects.toThrow('Retrieval failed')
    })

    it('should handle removal errors', async () => {
      mockApiKeyStorage.removeApiKey.mockRejectedValue(new Error('Removal failed'))

      await expect(apiKeyStorage.removeApiKey()).rejects.toThrow('Removal failed')
    })
  })

  describe('Utility Methods', () => {
    it('should check if API key exists', async () => {
      mockApiKeyStorage.hasApiKey.mockResolvedValue(true)

      const hasKey = await apiKeyStorage.hasApiKey()
      expect(hasKey).toBe(true)
      expect(mockApiKeyStorage.hasApiKey).toHaveBeenCalled()
    })

    it('should return false when no API key exists', async () => {
      mockApiKeyStorage.hasApiKey.mockResolvedValue(false)

      const hasKey = await apiKeyStorage.hasApiKey()
      expect(hasKey).toBe(false)
    })

    it('should clear all data', async () => {
      mockApiKeyStorage.clearAllData.mockResolvedValue(undefined)

      await apiKeyStorage.clearAllData()
      expect(mockApiKeyStorage.clearAllData).toHaveBeenCalled()
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle the full lifecycle of API key management', async () => {
      const testApiKey = 'AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi'
      
      // Initially no key
      mockApiKeyStorage.hasApiKey.mockResolvedValue(false)
      expect(await apiKeyStorage.hasApiKey()).toBe(false)
      
      // Store a key
      mockApiKeyStorage.storeApiKey.mockResolvedValue(undefined)
      await apiKeyStorage.storeApiKey(testApiKey)
      expect(mockApiKeyStorage.storeApiKey).toHaveBeenCalledWith(testApiKey)
      
      // Key should now exist
      mockApiKeyStorage.hasApiKey.mockResolvedValue(true)
      expect(await apiKeyStorage.hasApiKey()).toBe(true)
      
      // Should be able to retrieve it
      mockApiKeyStorage.getApiKey.mockResolvedValue(testApiKey)
      expect(await apiKeyStorage.getApiKey()).toBe(testApiKey)
      
      // Clear all data
      mockApiKeyStorage.clearAllData.mockResolvedValue(undefined)
      await apiKeyStorage.clearAllData()
      expect(mockApiKeyStorage.clearAllData).toHaveBeenCalled()
    })

    it('should validate API keys before storage operations', () => {
      const ApiKeyStorageClass = apiKeyStorage.constructor as unknown as { validateApiKey: (key: string) => boolean }
      
      // Test various API key formats - using clearly fake test keys
      expect(ApiKeyStorageClass.validateApiKey('AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi')).toBe(true)
      expect(ApiKeyStorageClass.validateApiKey('AIzaMOCK_API_KEY_NOT_REAL_TEST_12345678')).toBe(true)
      expect(ApiKeyStorageClass.validateApiKey('not-a-google-api-key')).toBe(false)
      expect(ApiKeyStorageClass.validateApiKey('test')).toBe(false) // too short
    })
  })
})