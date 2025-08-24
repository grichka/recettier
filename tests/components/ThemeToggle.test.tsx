import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../src/contexts/ThemeProvider'
import ThemeToggle from '../../src/components/common/ThemeToggle'
import { CssBaseline } from '@mui/material'

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

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('Theme Context and Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ThemeProvider', () => {
    it('should provide default light theme', () => {
      const TestComponent = () => {
        return <div data-testid="test-content">Test Content</div>
      }

      render(
        <ThemeProvider>
          <CssBaseline />
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })

    it('should use saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const TestComponent = () => {
        return <div data-testid="test-content">Test Content</div>
      }

      render(
        <ThemeProvider>
          <CssBaseline />
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })

    it('should use system preference when no saved theme', () => {
      ;(window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const TestComponent = () => {
        return <div data-testid="test-content">Test Content</div>
      }

      render(
        <ThemeProvider>
          <CssBaseline />
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })
  })

  describe('ThemeToggle Component', () => {
    it('should render menu variant by default', () => {
      render(
        <ThemeProvider initialTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      expect(screen.getByText('Dark Mode')).toBeInTheDocument()
    })

    it('should toggle theme when clicked', () => {
      render(
        <ThemeProvider initialTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const toggleButton = screen.getByText('Dark Mode')
      fireEvent.click(toggleButton)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-mode', 'dark')
    })

    it('should render switch variant', () => {
      render(
        <ThemeProvider initialTheme="light">
          <ThemeToggle variant="switch" />
        </ThemeProvider>
      )

      expect(screen.getByRole('switch')).toBeInTheDocument()
      expect(screen.getByText('Light Mode')).toBeInTheDocument()
    })

    it('should render button variant', () => {
      render(
        <ThemeProvider initialTheme="light">
          <ThemeToggle variant="button" />
        </ThemeProvider>
      )

      expect(screen.getByText('Switch to Dark Mode')).toBeInTheDocument()
    })

    it('should show correct text for dark mode', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      expect(screen.getByText('Light Mode')).toBeInTheDocument()
    })

    it('should call onClose when provided', () => {
      const onCloseMock = vi.fn()

      render(
        <ThemeProvider initialTheme="light">
          <ThemeToggle onClose={onCloseMock} />
        </ThemeProvider>
      )

      const toggleButton = screen.getByText('Dark Mode')
      fireEvent.click(toggleButton)

      expect(onCloseMock).toHaveBeenCalled()
    })

    it('should hide label when showLabel is false', () => {
      render(
        <ThemeProvider initialTheme="light">
          <ThemeToggle variant="switch" showLabel={false} />
        </ThemeProvider>
      )

      expect(screen.queryByText('Light Mode')).not.toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })

  describe('Theme Persistence', () => {
    it('should save theme preference to localStorage', () => {
      render(
        <ThemeProvider initialTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const toggleButton = screen.getByText('Dark Mode')
      fireEvent.click(toggleButton)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-mode', 'dark')
    })

    it('should load theme preference from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      )

      expect(screen.getByText('Light Mode')).toBeInTheDocument()
    })
  })
})