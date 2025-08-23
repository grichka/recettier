import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState } from '../types';
import { googleAuthService } from '../services/googleAuth';

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await googleAuthService.initialize();
      
      // Check if we have user profile information and try to get a valid token
      if (googleAuthService.hasUserProfile()) {
        const hasValidToken = await googleAuthService.ensureValidToken();
        
        if (hasValidToken) {
          const googleUser = googleAuthService.getCurrentUser();
          if (googleUser) {
            const profile = googleUser.getBasicProfile();
            const user: User = {
              id: profile.getId(),
              email: profile.getEmail(),
              name: profile.getName(),
              picture: profile.getImageUrl(),
              accessToken: googleAuthService.getAccessToken() || '',
            };
            
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          }
        }
      }
      
      // No valid authentication found
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  };

  const signIn = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Initialize first to set up the token client callback
      await googleAuthService.initialize();
      
      // This will now trigger the OAuth flow and handle both ID token and access token
      const googleUser = await googleAuthService.signIn();
      const profile = googleUser.getBasicProfile();
      
      const user: User = {
        id: profile.getId(),
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl(),
        accessToken: googleAuthService.getAccessToken() || '',
      };

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to sign in',
      });
    }
  };

  const signOut = async () => {
    try {
      await googleAuthService.signOut();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to sign out',
      }));
    }
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};