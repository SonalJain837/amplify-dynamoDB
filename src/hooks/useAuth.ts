import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser();
      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
    }
  };

  useEffect(() => {
    checkAuthState();

    // Listen for authentication state changes
    const removeListener = Hub.listen('auth', ({ payload }) => {
      const { event } = payload;
      
      if (event === 'signedIn' || event === 'signedOut') {
        checkAuthState();
      }
    });

    return removeListener;
  }, []);

  return authState;
};