// Enhanced security utilities for HTTP requests and authentication

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

interface RequestResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

class SecureHttpClient {
  private defaultTimeout = 10000; // 10 seconds
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.setupRequestInterceptors();
  }

  private setupRequestInterceptors() {
    // Add security headers to all requests
    this.addDefaultHeaders();
  }

  private addDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      // Add CSRF protection if needed
      'X-CSRF-Token': this.getCSRFToken(),
    };
  }

  private getCSRFToken(): string {
    // Generate or retrieve CSRF token
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return token || this.generateCSRFToken();
  }

  private generateCSRFToken(): string {
    // Generate a random CSRF token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async makeRequest<T>(config: RequestConfig): Promise<RequestResponse<T>> {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout
    } = config;

    // Validate URL to prevent open redirects
    this.validateUrl(url);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.addDefaultHeaders(),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: 'same-origin', // Prevent credential leakage
        mode: 'cors',
        cache: 'no-cache', // Prevent sensitive data caching
      });

      clearTimeout(timeoutId);

      // Check for successful response
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType?.includes('text/')) {
      return await response.text() as unknown as T;
    }
    
    return await response.blob() as unknown as T;
  }

  private validateUrl(url: string): void {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS in production
      if (import.meta.env.PROD && urlObj.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed in production');
      }
      
      // Whitelist allowed domains
      const allowedDomains = [
        'googleapis.com',
        'accounts.google.com',
        'www.googleapis.com',
        'oauth2.googleapis.com',
        'drive.googleapis.com',
      ];
      
      const isAllowed = allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed && !urlObj.hostname.includes('localhost')) {
        throw new Error(`Domain ${urlObj.hostname} is not in the allowed list`);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Invalid URL format');
      }
      throw error;
    }
  }

  public async get<T>(url: string, headers?: Record<string, string>): Promise<RequestResponse<T>> {
    return this.makeRequest<T>({ url, method: 'GET', headers });
  }

  public async post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<RequestResponse<T>> {
    return this.makeRequest<T>({ url, method: 'POST', body, headers });
  }

  public async put<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<RequestResponse<T>> {
    return this.makeRequest<T>({ url, method: 'PUT', body, headers });
  }

  public async delete<T>(url: string, headers?: Record<string, string>): Promise<RequestResponse<T>> {
    return this.makeRequest<T>({ url, method: 'DELETE', headers });
  }

  public async patch<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<RequestResponse<T>> {
    return this.makeRequest<T>({ url, method: 'PATCH', body, headers });
  }

  // Retry mechanism for failed requests
  public async requestWithRetry<T>(config: RequestConfig, retries = this.maxRetries): Promise<RequestResponse<T>> {
    try {
      return await this.makeRequest<T>(config);
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        console.warn(`Request failed, retrying... (${this.maxRetries - retries + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay);
        return this.requestWithRetry<T>(config, retries - 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: unknown): boolean {
    // Retry on network errors or 5xx server errors
    return (
      error instanceof TypeError || // Network error
      (error instanceof Error && error.message.includes('fetch')) ||
      (typeof error === 'object' && error !== null && 'status' in error && 
       typeof (error as { status: number }).status === 'number' && 
       (error as { status: number }).status >= 500)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Token security utilities
export class TokenSecurity {
  public static encryptToken(token: string): string {
    // In a real implementation, use proper encryption
    // For now, we'll use base64 encoding as a basic obfuscation
    return btoa(token);
  }

  public static decryptToken(encryptedToken: string): string {
    try {
      return atob(encryptedToken);
    } catch {
      throw new Error('Invalid token format');
    }
  }

  public static isTokenExpired(token: string): boolean {
    try {
      // Parse JWT token to check expiration
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp ? payload.exp < now : false;
    } catch {
      return true; // Assume expired if parsing fails
    }
  }

  public static sanitizeStoredData(): void {
    // Clear potentially sensitive data from localStorage
    const sensitiveKeys = [
      'recettier_auth_state',
      'recettier_token_security',
      'google_auth_token',
      'access_token',
    ];
    
    sensitiveKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Cleared sensitive data: ${key}`);
      }
    });
  }

  public static logSecurityEvent(event: string, details?: Record<string, unknown>): void {
    // Log security events for monitoring - use debug level in development
    if (import.meta.env.DEV) {
      console.debug(`Security Event: ${event}`, details);
    } else {
      console.warn(`Security Event: ${event}`, details);
    }
    
    // In production, send to monitoring service
    if (import.meta.env.PROD) {
      // Example: sendToMonitoring(event, details);
    }
  }
}

// Content Security Policy utilities
export class CSPUtils {
  public static reportViolation(violationReport: SecurityPolicyViolationEvent): void {
    // Filter out known safe violations in development
    if (import.meta.env.DEV) {
      // Google APIs analytics endpoint is expected and safe
      if (violationReport.blockedURI?.includes('gen_204')) {
        console.debug('CSP: Blocked Google analytics endpoint (expected):', violationReport.blockedURI);
        return;
      }
    }
    
    console.error('CSP Violation:', violationReport);
    
    // In production, report to security monitoring
    if (import.meta.env.PROD) {
      // Example: reportToSecurityService(violationReport);
    }
  }

  public static setupCSPReporting(): void {
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (e: SecurityPolicyViolationEvent) => {
      this.reportViolation(e);
    });
  }
}

// Initialize security measures
export function initializeSecurity(): void {
  // Setup CSP reporting
  CSPUtils.setupCSPReporting();
  
  // Clean up any existing sensitive data on startup
  TokenSecurity.sanitizeStoredData();
  
  // Log initialization
  console.log('Security measures initialized');
}

// Export singleton instance
export const secureHttpClient = new SecureHttpClient();

export default secureHttpClient;