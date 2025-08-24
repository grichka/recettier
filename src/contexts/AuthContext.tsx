import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState, AuthContextType } from '../types';
import { googleAuthService } from '../services/googleAuth';
import { AuthContext } from './AuthContextDefinition';

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
      // First check if Google service can be used (API key is configured)
      const canUseGoogleService = await googleAuthService.canUseService();
      
      if (!canUseGoogleService) {
        // No API key configured - this is normal for first-time users
        console.log('Google API key not configured. Google Drive features will be unavailable until configured in Settings.');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null, // Don't treat this as an error
        }));
        return;
      }

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
      
      // No valid authentication found, but API key is configured
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Auth initialization error:', error);
      
      // Provide a more user-friendly error message
      let errorMessage = 'Failed to initialize authentication';
      if (error instanceof Error && error.message.includes('API key not configured')) {
        errorMessage = 'Google API key not configured. Please set up your API key in Settings to use Google Drive features.';
      }
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
    }
  };

  const signIn = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if Google service can be used (API key is configured)
      const canUseGoogleService = await googleAuthService.canUseService();
      
      if (!canUseGoogleService) {
        throw new Error('Google API key not configured. Please set up your API key in Settings before signing in.');
      }
      
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
      
      let errorMessage = 'Failed to sign in';
      if (error instanceof Error) {
        if (error.message.includes('API key not configured')) {
          errorMessage = 'Please configure your Google API key in Settings first.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
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
    reinitialize: initializeAuth, // Add this to allow re-initialization
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};