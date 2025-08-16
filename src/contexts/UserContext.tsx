import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import { Hub } from 'aws-amplify/utils';

interface UserData {
  isSignedIn: boolean;
  currentUser: any;
  userDisplayName: string;
  userEmail: string;
  isLoading: boolean;
}

interface UserContextType {
  userData: UserData;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with cached data if available for instant display
  const initialUserData = (): UserData => {
    if (typeof window !== 'undefined') {
      const cachedEmail = localStorage.getItem('userEmail');
      const cachedUsername = localStorage.getItem('username');
      
      if (cachedEmail && cachedUsername) {
        return {
          isSignedIn: true,
          currentUser: null,
          userDisplayName: cachedUsername,
          userEmail: cachedEmail,
          isLoading: false,
        };
      }
    }
    
    return {
      isSignedIn: false,
      currentUser: null,
      userDisplayName: '',
      userEmail: '',
      isLoading: true,
    };
  };

  const [userData, setUserData] = useState<UserData>(initialUserData());

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = async () => {
    // Prevent multiple concurrent refresh calls
    if (isRefreshing) {
      console.log('User refresh already in progress, skipping...');
      return;
    }

    setIsRefreshing(true);
    
    // Check for cached user data first for fast display
    const cachedEmail = localStorage.getItem('userEmail');
    const cachedUsername = localStorage.getItem('username');
    
    // Show cached data immediately if available, regardless of current state
    if (cachedEmail && cachedUsername) {
      setUserData({
        isSignedIn: true,
        currentUser: null,
        userDisplayName: cachedUsername,
        userEmail: cachedEmail,
        isLoading: false,
      });
    } else if (!userData.isSignedIn) {
      setUserData(prev => ({ ...prev, isLoading: true }));
    }
    
    try {
      const user = await getCurrentUser();
      const userEmail = user.signInDetails?.loginId || user.username;
      
      // Cache email immediately
      localStorage.setItem('userEmail', userEmail);
      
      let displayName = '';
      
      // Try to get from cache first
      const cachedDisplayName = localStorage.getItem('username');
      if (cachedDisplayName) {
        displayName = cachedDisplayName;
      } else {
        // Fetch user details from DynamoDB to get display name
        try {
          const client = generateClient<Schema>();
          const userDetails = await client.models.Users.get({
            email: userEmail
          });
          
          if (userDetails.data?.firstName && userDetails.data?.lastName) {
            displayName = `${userDetails.data.firstName} ${userDetails.data.lastName}`;
            localStorage.setItem('username', displayName);
          } else if (userDetails.data?.username) {
            displayName = userDetails.data.username;
            localStorage.setItem('username', userDetails.data.username);
          } else {
            // Fallback to email username or first part of email
            displayName = (userEmail || '').split('@')[0];
            localStorage.setItem('username', displayName);
          }
        } catch (dbError) {
          console.warn('Failed to fetch user details from DB:', dbError);
          // Fallback if database fetch fails
          displayName = (userEmail || '').split('@')[0];
          localStorage.setItem('username', displayName);
        }
      }

      setUserData({
        isSignedIn: true,
        currentUser: user,
        userDisplayName: displayName,
        userEmail: userEmail || '',
        isLoading: false,
      });
    } catch (error) {
      // Only log error if it's not a normal "not authenticated" case
      if (error && typeof error === 'object' && 'name' in error && error.name !== 'UserUnauthorizedException') {
        console.warn('Authentication error:', error);
      }
      
      // Clear any existing auth tokens or data
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      
      setUserData({
        isSignedIn: false,
        currentUser: null,
        userDisplayName: '',
        userEmail: '',
        isLoading: false,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Initial user refresh
    if (isMounted) {
      refreshUser();
    }

    // Listen for sign in/out events using Amplify Hub
    const listener = (data: any) => {
      if (!isMounted) return;
      
      const event = data.payload.event;
      console.log('Auth event received:', event);
      
      if (event === 'signedIn' || event === 'signedOut' || event === 'tokenRefresh_failure') {
        // For signedIn events, show cached data immediately then verify
        if (event === 'signedIn') {
          const cachedEmail = localStorage.getItem('userEmail');
          const cachedUsername = localStorage.getItem('username');
          
          if (cachedEmail && cachedUsername) {
            // Show cached data immediately for instant UI update
            setUserData({
              isSignedIn: true,
              currentUser: null,
              userDisplayName: cachedUsername,
              userEmail: cachedEmail,
              isLoading: false,
            });
          }
          
          // Then refresh to get complete user data
          refreshUser();
        } else {
          // Add a small delay for other events to prevent race conditions
          setTimeout(() => {
            if (isMounted) {
              refreshUser();
            }
          }, 100);
        }
      }
    };
    
    const unsubscribe = Hub.listen('auth', listener);
    
    // Remove storage listener as it can cause excessive refreshes
    // and is not necessary for most use cases
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ userData, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};