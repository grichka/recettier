interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GoogleMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
  callback?: (response: GoogleTokenResponse) => void;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentNotification?: (notification: GoogleMomentNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            type?: 'standard' | 'icon';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
            width?: number;
            locale?: string;
          }) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: Error | unknown) => void;
          }) => GoogleTokenClient;
          hasGrantedAllScopes: (tokenResponse: GoogleTokenResponse, ...scopes: string[]) => boolean;
          hasGrantedAnyScope: (tokenResponse: GoogleTokenResponse, ...scopes: string[]) => boolean;
          revoke: (accessToken: string, callback?: () => void) => void;
        };
      };
    };
    gapi: {
        load: (api: string, options: { callback: () => void; onerror: (error: Error | unknown) => void }) => void;
        client: {
          init: (config: {
            apiKey: string;
            discoveryDocs: string[];
          }) => Promise<void>;
          drive: {
            files: {
              list: (params: {
                q?: string;
                fields?: string;
                spaces?: string;
                orderBy?: string;
                pageSize?: number;
                pageToken?: string;
              }) => Promise<{
                result: {
                  files?: Array<{
                    id?: string;
                    name?: string;
                    mimeType?: string;
                    parents?: string[];
                    createdTime?: string;
                    modifiedTime?: string;
                    size?: string;
                  }>;
                  nextPageToken?: string;
                };
              }>;
              get: (params: {
                fileId: string;
                fields?: string;
                alt?: string;
              }) => Promise<{
                result: {
                  id?: string;
                  name?: string;
                  mimeType?: string;
                  parents?: string[];
                  createdTime?: string;
                  modifiedTime?: string;
                  size?: string;
                };
                body?: string;
              }>;
              create: (params: {
                resource: {
                  name: string;
                  mimeType: string;
                  parents?: string[];
                };
                fields?: string;
              }) => Promise<{
                result: {
                  id?: string;
                  name?: string;
                  mimeType?: string;
                  parents?: string[];
                };
              }>;
              delete: (params: {
                fileId: string;
              }) => Promise<void>;
            };
          };
        };
      };
  }
}

export {};