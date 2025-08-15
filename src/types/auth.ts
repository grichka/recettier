export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}