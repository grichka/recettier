/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { secureHttpClient, TokenSecurity, CSPUtils } from '../../src/utils/security'

describe('Security Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('SecureHttpClient', () => {
    describe('HTTP Methods', () => {
      beforeEach(() => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve({ data: 'test' }),
          text: () => Promise.resolve('test'),
          blob: () => Promise.resolve(new Blob(['test'])),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          formData: () => Promise.resolve(new FormData()),
        })
      })

      it('should make GET requests with security headers', async () => {
        await secureHttpClient.get('http://localhost:3000/data')
        
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/data',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'X-Requested-With': 'XMLHttpRequest',
              'Content-Type': 'application/json',
            }),
            credentials: 'same-origin',
            mode: 'cors',
            cache: 'no-cache',
          })
        )
      })

      it('should make POST requests with body serialization', async () => {
        const testData = { name: 'test', value: 123 }
        await secureHttpClient.post('http://localhost:3000/data', testData)
        
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/data',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(testData),
          })
        )
      })

      it('should handle HTTP error responses', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })

        await expect(
          secureHttpClient.get('http://localhost:3000/notfound')
        ).rejects.toThrow('HTTP Error: 404 Not Found')
      })

      it('should handle network errors', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

        await expect(
          secureHttpClient.get('http://localhost:3000/data')
        ).rejects.toThrow('Network error')
      })
    })

    describe('Retry Mechanism', () => {
    it('should retry failed requests up to maxRetries', async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new TypeError('Network error'))
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: {
            get: vi.fn().mockReturnValue('application/json'),
          },
          json: () => Promise.resolve({ data: 'success' }),
          text: () => Promise.resolve('success'),
          blob: () => Promise.resolve(new Blob()),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          formData: () => Promise.resolve(new FormData())
        })
      })

      const httpClient = new (secureHttpClient as any).constructor({ maxRetries: 3 })
      const result = await httpClient.requestWithRetry({ url: 'https://www.googleapis.com/test', method: 'GET' }, 3)
      
      expect(result).toMatchObject({ 
        data: { data: 'success' },
        status: 200
      })
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('should stop retrying after max attempts', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Network error'))

      const httpClient = new (secureHttpClient as any).constructor({ maxRetries: 3 })
      
      await expect(httpClient.requestWithRetry({ url: 'https://www.googleapis.com/test', method: 'GET' }, 3)).rejects.toThrow('Network error')
      
      // 1 initial attempt + 3 retries = 4 total calls
      expect(global.fetch).toHaveBeenCalledTimes(4)
    })

    it('should use configurable options', () => {
      const httpClient = new (secureHttpClient as any).constructor({ 
        maxRetries: 5, 
        defaultTimeout: 15000, 
        retryDelay: 2000 
      })
      
      expect(httpClient['maxRetries']).toBe(5)
      expect(httpClient['defaultTimeout']).toBe(15000)
      expect(httpClient['retryDelay']).toBe(2000)
    })

    it('should use default options when none provided', () => {
      const httpClient = new (secureHttpClient as any).constructor()
      
      expect(httpClient['maxRetries']).toBe(3)
      expect(httpClient['defaultTimeout']).toBe(10000)
      expect(httpClient['retryDelay']).toBe(1000)
    })
    })
  })

  describe('TokenSecurity', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    describe('Token Encryption/Decryption', () => {
      it('should encrypt and decrypt tokens correctly', () => {
        const originalToken = 'test-access-token-12345'
        const encrypted = TokenSecurity.encryptToken(originalToken)
        const decrypted = TokenSecurity.decryptToken(encrypted)
        
        expect(encrypted).not.toBe(originalToken)
        expect(decrypted).toBe(originalToken)
      })

      it('should handle decryption of invalid tokens', () => {
        expect(() => {
          TokenSecurity.decryptToken('invalid-base64!')
        }).toThrow('Invalid token format')
      })
    })

    describe('Token Expiration', () => {
      it('should correctly identify expired JWT tokens', () => {
        // Create a mock expired JWT token
        const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 } // expired 1 hour ago
        const mockToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`
        
        expect(TokenSecurity.isTokenExpired(mockToken)).toBe(true)
      })

      it('should correctly identify valid JWT tokens', () => {
        // Create a mock valid JWT token
        const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 } // expires in 1 hour
        const mockToken = `header.${btoa(JSON.stringify(validPayload))}.signature`
        
        expect(TokenSecurity.isTokenExpired(mockToken)).toBe(false)
      })

      it('should handle malformed tokens as expired', () => {
        expect(TokenSecurity.isTokenExpired('invalid-token')).toBe(true)
        expect(TokenSecurity.isTokenExpired('')).toBe(true)
      })
    })

    describe('Security Event Logging', () => {
      it('should log security events in development', () => {
        const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
        
        TokenSecurity.logSecurityEvent('token_refresh', { userId: '123' })
        
        expect(consoleSpy).toHaveBeenCalledWith(
          'Security Event: token_refresh',
          { userId: '123' }
        )
        
        consoleSpy.mockRestore()
      })
    })
  })

  describe('CSPUtils', () => {
    describe('CSP Violation Reporting', () => {
      it('should filter known safe violations in development', () => {
        const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        
        const mockViolation = {
          blockedURI: 'https://apis.google.com/js/gen_204?c=50%3A1',
          violatedDirective: 'connect-src',
        } as SecurityPolicyViolationEvent
        
        CSPUtils.reportViolation(mockViolation)
        
        expect(consoleSpy).toHaveBeenCalledWith(
          'CSP: Blocked Google analytics endpoint (expected):',
          mockViolation.blockedURI
        )
        expect(consoleErrorSpy).not.toHaveBeenCalled()
        
        consoleSpy.mockRestore()
        consoleErrorSpy.mockRestore()
      })

      it('should report genuine CSP violations', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        
        const mockViolation = {
          blockedURI: 'https://malicious.example.com/script.js',
          violatedDirective: 'script-src',
        } as SecurityPolicyViolationEvent
        
        CSPUtils.reportViolation(mockViolation)
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'CSP Violation:',
          mockViolation
        )
        
        consoleErrorSpy.mockRestore()
      })
    })

    describe('CSP Setup', () => {
      it('should register CSP violation event listener', () => {
        const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
        
        CSPUtils.setupCSPReporting()
        
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          'securitypolicyviolation',
          expect.any(Function)
        )
        
        addEventListenerSpy.mockRestore()
      })
    })
  })
})