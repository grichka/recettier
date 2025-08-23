declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: any) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentNotification?: (notification: any) => void) => void;
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
            callback: (response: any) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: any) => void;
          };
          hasGrantedAllScopes: (tokenResponse: any, ...scopes: string[]) => boolean;
          hasGrantedAnyScope: (tokenResponse: any, ...scopes: string[]) => boolean;
          revoke: (accessToken: string, callback?: () => void) => void;
        };
      };
    };
    gapi: {
      load: (api: string, options: { callback: () => void; onerror: (error: any) => void }) => void;
      client: {
        init: (config: {
          apiKey: string;
          discoveryDocs: string[];
        }) => Promise<void>;
        drive?: any;
      };
    };
  }
}

export {};