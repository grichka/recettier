import { gapi } from 'gapi-script';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isInitialized = false;

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await new Promise<void>((resolve, reject) => {
        gapi.load('auth2', {
          callback: resolve,
          onerror: reject,
        });
      });

      await gapi.auth2.init({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
      });

      await gapi.client.init({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: [DISCOVERY_DOC],
        scope: SCOPES,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw error;
    }
  }

  async signIn(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance.signIn();
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signOut();
  }

  getCurrentUser(): any | null {
    if (!this.isInitialized) return null;

    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance.currentUser.get();
  }

  isSignedIn(): boolean {
    if (!this.isInitialized) return false;

    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  }

  getAccessToken(): string | null {
    const user = this.getCurrentUser();
    if (!user) return null;

    return user.getAuthResponse().access_token;
  }
}

export const googleAuthService = GoogleAuthService.getInstance();