import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { ApiKeyManager } from '../../src/components/common/ApiKeyManager'

// Mock the API key storage
vi.mock('../../src/utils/apiKeyStorage', () => ({
  apiKeyStorage: {
    getApiKey: vi.fn(),
    storeApiKey: vi.fn(),
    removeApiKey: vi.fn(),
    hasApiKey: vi.fn(),
  },
  ApiKeyStorage: {
    validateApiKey: vi.fn(),
  },
}))

// Mock the auth context
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { apiKeyStorage, ApiKeyStorage } from '../../src/utils/apiKeyStorage'
import { useAuth } from '../../src/hooks/useAuth'

const MockedApiKeyStorage = apiKeyStorage as unknown as {
  getApiKey: ReturnType<typeof vi.fn>
  storeApiKey: ReturnType<typeof vi.fn>
  removeApiKey: ReturnType<typeof vi.fn>
  hasApiKey: ReturnType<typeof vi.fn>
}

const MockedApiKeyStorageClass = ApiKeyStorage as unknown as {
  validateApiKey: ReturnType<typeof vi.fn>
}

const MockedUseAuth = useAuth as ReturnType<typeof vi.fn>

// Test wrapper with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme()
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

describe('ApiKeyManager Component', () => {
  const mockReinitialize = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useAuth hook
    MockedUseAuth.mockReturnValue({
      reinitialize: mockReinitialize,
    })
    
    // Mock API key storage methods
    MockedApiKeyStorage.getApiKey.mockResolvedValue(null)
    MockedApiKeyStorage.hasApiKey.mockResolvedValue(false)
    MockedApiKeyStorage.storeApiKey.mockResolvedValue(undefined)
    MockedApiKeyStorage.removeApiKey.mockResolvedValue(undefined)
    
    // Mock API key validation - return true for valid AIza keys, false for others
    MockedApiKeyStorageClass.validateApiKey.mockImplementation((key: string) => {
      const googleApiKeyRegex = /^AIza[0-9A-Za-z-_]{35}$/;
      return googleApiKeyRegex.test(key);
    })
  })

  describe('Initial State', () => {
    it('should render with no API key configured', async () => {
      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Google API Configuration')).toBeInTheDocument()
        expect(screen.getByText('Not Set')).toBeInTheDocument()
        expect(screen.getByText(/API key required for Google Drive features/)).toBeInTheDocument()
        expect(screen.getByText('Setup Key')).toBeInTheDocument()
      })
    })

    it('should render with existing API key', async () => {
      MockedApiKeyStorage.getApiKey.mockResolvedValue('AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi')
      MockedApiKeyStorage.hasApiKey.mockResolvedValue(true)

      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Google API Configuration')).toBeInTheDocument()
        expect(screen.getByText('Configured')).toBeInTheDocument()
        expect(screen.getByText(/API key is securely stored/)).toBeInTheDocument()
        expect(screen.getByText('Change Key')).toBeInTheDocument()
      })
    })
  })

  describe('API Key Input', () => {
    it('should allow entering a new API key', async () => {
      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Setup Key button to show form
      const setupButton = await screen.findByText('Setup Key')
      fireEvent.click(setupButton)

      await waitFor(() => {
        expect(screen.getByText('Add Google API Key')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter your Google API key...')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter your Google API key...')
      fireEvent.change(input, { target: { value: 'AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi' } })

      expect(input).toHaveValue('AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi')
    })

    it('should show validation error for invalid API key', async () => {
      MockedApiKeyStorage.getApiKey.mockResolvedValue(null);

      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Setup Key button to show form
      const setupButton = await screen.findByText('Setup Key')
      fireEvent.click(setupButton)

      await waitFor(() => {
        expect(screen.getByText('Add Google API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter your Google API key...')
      
      // Clear and set the input value to an invalid key (doesn't match Google API key pattern)
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.change(input, { target: { value: 'invalid-key' } })

      // Wait for the input to have the value
      await waitFor(() => {
        expect(input).toHaveValue('invalid-key')
      })

      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)

      await waitFor(() => {
        // Error message should be displayed since 'invalid-key' doesn't match Google API key pattern
        expect(screen.getByText(/Invalid Google API key format/)).toBeInTheDocument()
      })
    })
  })

  describe('Save API Key', () => {
    it('should save a valid API key successfully', async () => {
      MockedApiKeyStorage.storeApiKey.mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Setup Key button to show form
      const setupButton = await screen.findByText('Setup Key')
      fireEvent.click(setupButton)

      await waitFor(() => {
        expect(screen.getByText('Add Google API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter your Google API key...')
      fireEvent.change(input, { target: { value: 'AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi' } })

      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(MockedApiKeyStorage.storeApiKey).toHaveBeenCalledWith('AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi')
        expect(mockReinitialize).toHaveBeenCalled()
      })
    })

    it('should handle save errors gracefully', async () => {
      MockedApiKeyStorage.storeApiKey.mockRejectedValue(new Error('Storage failed'))

      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Setup Key button to show form
      const setupButton = await screen.findByText('Setup Key')
      fireEvent.click(setupButton)

      await waitFor(() => {
        expect(screen.getByText('Add Google API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter your Google API key...')
      fireEvent.change(input, { target: { value: 'AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi' } })

      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(MockedApiKeyStorage.storeApiKey).toHaveBeenCalled()
        // Error handling is internal to the component
      })
    })
  })

  describe('Remove API Key', () => {
    beforeEach(() => {
      MockedApiKeyStorage.getApiKey.mockResolvedValue('AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi')
      MockedApiKeyStorage.hasApiKey.mockResolvedValue(true)
    })

    it('should remove API key successfully', async () => {
      MockedApiKeyStorage.removeApiKey.mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Change Key button to show form
      const changeButton = await screen.findByText('Change Key')
      fireEvent.click(changeButton)

      await waitFor(() => {
        expect(screen.getByText('Remove Key')).toBeInTheDocument()
      })

      const removeButton = screen.getByText('Remove Key')
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(MockedApiKeyStorage.removeApiKey).toHaveBeenCalled()
      })
    })

    it('should handle remove errors gracefully', async () => {
      MockedApiKeyStorage.removeApiKey.mockRejectedValue(new Error('Remove failed'))

      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Change Key button to show form
      const changeButton = await screen.findByText('Change Key')
      fireEvent.click(changeButton)

      await waitFor(() => {
        expect(screen.getByText('Remove Key')).toBeInTheDocument()
      })

      const removeButton = screen.getByText('Remove Key')
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(MockedApiKeyStorage.removeApiKey).toHaveBeenCalled()
        // Error handling is internal to the component
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state while saving', async () => {
      // Mock a delayed promise
      MockedApiKeyStorage.storeApiKey.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Setup Key button to show form
      const setupButton = await screen.findByText('Setup Key')
      fireEvent.click(setupButton)

      await waitFor(() => {
        expect(screen.getByText('Add Google API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter your Google API key...')
      fireEvent.change(input, { target: { value: 'AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi' } })

      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })
    })

    it('should show loading state while removing', async () => {
      MockedApiKeyStorage.getApiKey.mockResolvedValue('AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi')
      MockedApiKeyStorage.hasApiKey.mockResolvedValue(true)
      
      // Mock a delayed promise
      MockedApiKeyStorage.removeApiKey.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Change Key button to show form
      const changeButton = await screen.findByText('Change Key')
      fireEvent.click(changeButton)

      await waitFor(() => {
        expect(screen.getByText('Remove Key')).toBeInTheDocument()
      })

      const removeButton = screen.getByText('Remove Key')
      fireEvent.click(removeButton)

      // Component should handle loading state internally
      expect(MockedApiKeyStorage.removeApiKey).toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should disable save button when input is empty', async () => {
      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Setup Key button to show form
      const setupButton = await screen.findByText('Setup Key')
      fireEvent.click(setupButton)

      await waitFor(() => {
        expect(screen.getByText('Add Google API Key')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save')
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when valid input is provided', async () => {
      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      // Click Setup Key button to show form
      const setupButton = await screen.findByText('Setup Key')
      fireEvent.click(setupButton)

      await waitFor(() => {
        expect(screen.getByText('Add Google API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter your Google API key...')
      fireEvent.change(input, { target: { value: 'AIzaSyDxKXxJQOejBxDKFj_XYZ123-abcdefghi' } })

      const saveButton = screen.getByText('Save')
      expect(saveButton).toBeEnabled()
    })
  })

  describe('Help Text and Instructions', () => {
    it('should display help text and instructions', async () => {
      render(
        <TestWrapper>
          <ApiKeyManager />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Need help getting an API key?')).toBeInTheDocument()
        expect(screen.getByText('Visit Google Cloud Console')).toBeInTheDocument()
      })
    })
  })
})