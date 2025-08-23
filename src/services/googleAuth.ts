const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file openid email profile';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface TokenClient {
  callback?: (tokenResponse: TokenResponse) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface GoogleUserWithMethods extends GoogleUser {
  accessToken?: string;
  getBasicProfile: () => {
    getId: () => string;
    getEmail: () => string;
    getName: () => string;
    getImageUrl: () => string;
  };
}

interface StoredAuthState {
  user: {
    id: string;
    email: string;
    name: string;
    picture: string;
  } | null;
  // Note: We no longer store access tokens for security reasons
  // Access tokens will be kept in memory only and refreshed as needed
  lastAuthTime: number | null;
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private tokenClient: TokenClient | null = null;
  private currentUser: GoogleUser | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private static readonly AUTH_STORAGE_KEY = 'recettier_auth_state';

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  private saveAuthState(): void {
    const authState: StoredAuthState = {
      user: this.currentUser,
      lastAuthTime: Date.now(),
    };
    localStorage.setItem(GoogleAuthService.AUTH_STORAGE_KEY, JSON.stringify(authState));
  }

  private loadAuthState(): StoredAuthState | null {
    try {
      const stored = localStorage.getItem(GoogleAuthService.AUTH_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load auth state from localStorage:', error);
      this.clearAuthState();
      return null;
    }
  }

  private clearAuthState(): void {
    localStorage.removeItem(GoogleAuthService.AUTH_STORAGE_KEY);
  }

  private isTokenValid(expiresAt: number | null): boolean {
    if (!expiresAt) return false;
    // Add 5 minute buffer to account for network delays
    return Date.now() < (expiresAt - 5 * 60 * 1000);
  }

  private async refreshTokenSilently(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      const originalCallback = this.tokenClient.callback;
      
      this.tokenClient.callback = (tokenResponse: TokenResponse) => {
        if (tokenResponse.access_token) {
          this.accessToken = tokenResponse.access_token;
          this.tokenExpiresAt = Date.now() + (tokenResponse.expires_in * 1000);
          // Restore original callback
          if (this.tokenClient && originalCallback) {
            this.tokenClient.callback = originalCallback;
          }
          resolve();
        } else {
          // Restore original callback
          if (this.tokenClient && originalCallback) {
            this.tokenClient.callback = originalCallback;
          }
          reject(new Error('Failed to get access token'));
        }
      };

      // Try to get token silently
      try {
        this.tokenClient.requestAccessToken({ prompt: '' });
      } catch (error) {
        // Restore original callback
        this.tokenClient.callback = originalCallback;
        reject(error);
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Check for existing user profile (but not access token for security)
      const storedAuth = this.loadAuthState();
      if (storedAuth && storedAuth.user && storedAuth.lastAuthTime) {
        // Check if the last auth was recent (within 24 hours)
        const hoursSinceAuth = (Date.now() - storedAuth.lastAuthTime) / (1000 * 60 * 60);
        if (hoursSinceAuth < 24) {
          this.currentUser = storedAuth.user;
          // We'll attempt to get a fresh token silently below
        } else {
          // Too old, clear stored state
          this.clearAuthState();
        }
      }

      // Wait for both Google Identity Services and GAPI to be available
      await Promise.all([
        this.waitForGoogle(),
        this.waitForGapi()
      ]);

      // Initialize GAPI client for Drive API
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', {
          callback: resolve,
          onerror: reject,
        });
      });

      await window.gapi.client.init({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
        discoveryDocs: [DISCOVERY_DOC],
      });

      // Initialize OAuth2 token client for API access
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: TokenResponse) => {
          this.accessToken = tokenResponse.access_token;
          // Calculate expiration time (keep in memory only)
          this.tokenExpiresAt = Date.now() + (tokenResponse.expires_in * 1000);
          this.fetchUserInfo();
        },
        error_callback: (error: Error | unknown) => {
          console.error('Token request error:', error);
        }
      });

      // If we have a stored user, try to get a fresh token silently
      if (this.currentUser) {
        try {
          await this.refreshTokenSilently();
        } catch {
          console.log('Silent token refresh failed, user will need to sign in again');
          this.currentUser = null;
          this.clearAuthState();
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  private waitForGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkGoogle = () => {
        if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };

      checkGoogle();

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Google Identity Services failed to load'));
      }, 10000);
    });
  }

  private waitForGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkGapi = () => {
        if (typeof window !== 'undefined' && window.gapi) {
          resolve();
        } else {
          setTimeout(checkGapi, 100);
        }
      };

      checkGapi();

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Google API failed to load'));
      }, 10000);
    });
  }

  private async fetchUserInfo(): Promise<void> {
    if (!this.accessToken) return;

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.ok) {
        const userInfo = await response.json();
        this.currentUser = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        };
        
        // Save authentication state to localStorage
        this.saveAuthState();
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  async signIn(): Promise<GoogleUserWithMethods> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      const originalCallback = this.tokenClient.callback;
      
      this.tokenClient.callback = async (tokenResponse: TokenResponse) => {
        if (tokenResponse.access_token) {
          this.accessToken = tokenResponse.access_token;
          // Calculate expiration time
          this.tokenExpiresAt = Date.now() + (tokenResponse.expires_in * 1000);
          
          // Fetch user info
          await this.fetchUserInfo();
          
          if (this.currentUser) {
            const user: GoogleUserWithMethods = {
              ...this.currentUser,
              accessToken: this.accessToken,
              getBasicProfile: () => ({
                getId: () => this.currentUser!.id,
                getEmail: () => this.currentUser!.email,
                getName: () => this.currentUser!.name,
                getImageUrl: () => this.currentUser!.picture,
              })
            };
            
            // Restore original callback
            if (this.tokenClient && originalCallback) {
              this.tokenClient.callback = originalCallback;
            }
            resolve(user);
          } else {
            reject(new Error('Failed to get user information'));
          }
        } else {
          reject(new Error('Failed to get access token'));
        }
      };

      // Request access token - this will open OAuth popup
      this.tokenClient?.requestAccessToken();
    });
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    if (this.accessToken) {
      window.google.accounts.oauth2.revoke(this.accessToken);
    }
    
    this.currentUser = null;
    this.accessToken = null;
    this.tokenExpiresAt = null;
    
    // Clear stored authentication state
    this.clearAuthState();
  }

  getCurrentUser(): GoogleUserWithMethods | null {
    if (!this.isInitialized || !this.currentUser) return null;

    return {
      ...this.currentUser,
      getBasicProfile: () => ({
        getId: () => this.currentUser!.id,
        getEmail: () => this.currentUser!.email,
        getName: () => this.currentUser!.name,
        getImageUrl: () => this.currentUser!.picture,
      })
    };
  }

  isSignedIn(): boolean {
    if (!this.isInitialized || !this.currentUser) {
      return false;
    }
    
    // Check if we have a valid access token in memory
    if (!this.accessToken || !this.isTokenValid(this.tokenExpiresAt)) {
      // No valid token in memory, but we might be able to refresh it silently
      // For now, return false - the app can attempt silent refresh if needed
      return false;
    }
    
    return true;
  }

  hasUserProfile(): boolean {
    return !!this.currentUser;
  }

  async ensureValidToken(): Promise<boolean> {
    if (this.accessToken && this.isTokenValid(this.tokenExpiresAt)) {
      return true;
    }

    if (this.currentUser) {
      try {
        await this.refreshTokenSilently();
        return true;
      } catch {
        console.log('Silent token refresh failed');
        return false;
      }
    }

    return false;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const googleAuthService = GoogleAuthService.getInstance();