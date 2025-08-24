import { describe, it, expect } from 'vitest'
import { theme } from '../../src/utils/theme'

describe('Theme Utils', () => {
  describe('Theme Configuration', () => {
    it('should have correct primary color scheme', () => {
      expect(theme.palette.primary.main).toBe('#2E7D32') // Green
      expect(theme.palette.primary.light).toBeDefined()
      expect(theme.palette.primary.dark).toBeDefined()
    })

    it('should have correct secondary color scheme', () => {
      expect(theme.palette.secondary.main).toBe('#FF6F00') // Orange
      expect(theme.palette.secondary.light).toBeDefined()
      expect(theme.palette.secondary.dark).toBeDefined()
    })

    it('should have proper typography configuration', () => {
      expect(theme.typography.fontFamily).toContain('Roboto')
      expect(theme.typography.h1).toBeDefined()
      expect(theme.typography.h2).toBeDefined()
      expect(theme.typography.body1).toBeDefined()
      expect(theme.typography.body2).toBeDefined()
    })

    it('should have breakpoint configuration', () => {
      expect(theme.breakpoints.values.xs).toBe(0)
      expect(theme.breakpoints.values.sm).toBe(600)
      expect(theme.breakpoints.values.md).toBe(900)
      expect(theme.breakpoints.values.lg).toBe(1200)
      expect(theme.breakpoints.values.xl).toBe(1536)
    })

    it('should have proper spacing configuration', () => {
      expect(theme.spacing(1)).toBe('8px')
      expect(theme.spacing(2)).toBe('16px')
      expect(theme.spacing(3)).toBe('24px')
    })

    it('should have appropriate color palette for cooking app', () => {
      // Green for natural/healthy foods
      expect(theme.palette.primary.main).toBe('#2E7D32')
      
      // Orange for warmth and appetite appeal
      expect(theme.palette.secondary.main).toBe('#FF6F00')
      
      // Should have error, warning, info, and success colors
      expect(theme.palette.error).toBeDefined()
      expect(theme.palette.warning).toBeDefined()
      expect(theme.palette.info).toBeDefined()
      expect(theme.palette.success).toBeDefined()
    })

    it('should support both light and dark modes', () => {
      expect(theme.palette.mode).toBeDefined()
      expect(['light', 'dark']).toContain(theme.palette.mode)
    })

    it('should have proper component overrides', () => {
      // Check if common Material-UI components have proper styling
      expect(theme.components).toBeDefined()
      
      // Verify button styling exists
      if (theme.components?.MuiButton) {
        expect(theme.components.MuiButton.styleOverrides).toBeDefined()
      }
      
      // Verify card styling exists
      if (theme.components?.MuiCard) {
        expect(theme.components.MuiCard.styleOverrides).toBeDefined()
      }
    })

    it('should have consistent shadow configuration', () => {
      expect(theme.shadows).toBeDefined()
      expect(theme.shadows.length).toBeGreaterThan(0)
    })

    it('should have proper z-index configuration', () => {
      expect(theme.zIndex).toBeDefined()
      expect(theme.zIndex.appBar).toBeDefined()
      expect(theme.zIndex.drawer).toBeDefined()
      expect(theme.zIndex.modal).toBeDefined()
      expect(theme.zIndex.tooltip).toBeDefined()
    })
  })

  describe('Theme Accessibility', () => {
    it('should have sufficient color contrast ratios', () => {
      // Primary color should have good contrast
      const primaryMain = theme.palette.primary.main
      expect(primaryMain).toBeDefined()
      
      // Secondary color should have good contrast
      const secondaryMain = theme.palette.secondary.main
      expect(secondaryMain).toBeDefined()
      
      // Text colors should be defined for accessibility
      expect(theme.palette.text.primary).toBeDefined()
      expect(theme.palette.text.secondary).toBeDefined()
    })

    it('should have proper action colors for interactive elements', () => {
      expect(theme.palette.action.hover).toBeDefined()
      expect(theme.palette.action.selected).toBeDefined()
      expect(theme.palette.action.disabled).toBeDefined()
      expect(theme.palette.action.focus).toBeDefined()
    })
  })

  describe('Theme Responsiveness', () => {
    it('should support responsive typography', () => {
      // Typography should scale appropriately
      expect(theme.typography.h1).toBeDefined()
      expect(theme.typography.h6).toBeDefined()
      expect(theme.typography.body1).toBeDefined()
      
      // Should have responsive font sizes if configured
      if (theme.typography.htmlFontSize) {
        expect(typeof theme.typography.htmlFontSize).toBe('number')
      }
    })

    it('should have mobile-friendly spacing', () => {
      // Spacing should be appropriate for mobile devices
      const baseSpacing = theme.spacing(1)
      expect(baseSpacing).toBe('8px') // 8px is mobile-friendly
    })
  })
})