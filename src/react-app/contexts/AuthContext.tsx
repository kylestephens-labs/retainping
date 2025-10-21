/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MOCHA_SESSION_TOKEN_COOKIE_NAME } from '@/react-app/constants/auth';

interface User {
  id: string;
  email: string;
  name: string;
  google_user_data?: {
    name: string;
    email: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  exchangeCodeForSessionToken: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isAuthCallback = urlParams.has('code');

    if (isAuthCallback) {
      // We'll exchange the code for a fresh session; skip loading stale data.
      setIsLoading(false);
      return;
    }

    // Check if user is already logged in
    const savedUser = localStorage.getItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Verify the session is still valid
        verifySession();
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
        localStorage.removeItem('supabase_session_token');
      }
    }
    setIsLoading(false);
  }, []);

  const verifySession = async () => {
    try {
      const sessionToken = localStorage.getItem('supabase_session_token');
      if (!sessionToken) {
        setUser(null);
        localStorage.removeItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
        return;
      }

      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (!response.ok) {
        // Session is invalid, clear user data
        setUser(null);
        localStorage.removeItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
        localStorage.removeItem('supabase_session_token');
      }
    } catch (error) {
      console.error('Session verification error:', error);
      setUser(null);
      localStorage.removeItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
      localStorage.removeItem('supabase_session_token');
    }
  };

  const login = async () => {
    try {
      // Get OAuth redirect URL
      const redirectResponse = await fetch('/api/oauth/google/redirect_url');
      const redirectData = await redirectResponse.json();
      
      if (redirectData.redirectUrl) {
        // Redirect to OAuth URL
        window.location.href = redirectData.redirectUrl;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Don't fallback to mock - let the error propagate
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
    localStorage.removeItem('supabase_session_token');
  };

  const exchangeCodeForSessionToken = useCallback(async () => {
    try {
      // Get the auth code from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      console.log('Auth callback - code found:', !!code);
      
      if (!code) {
        throw new Error('No authorization code found');
      }

      console.log('Exchanging code for session token...');
      
      // Exchange code for session token
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      console.log('Session exchange result:', result);

      if (result.success) {
        // Store the session token
        localStorage.setItem('supabase_session_token', result.sessionToken);
        console.log('Session token stored, fetching user data...');
        
        // Get user info
        const userResponse = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${result.sessionToken}`
          }
        });
        
        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user data: ${userResponse.status}`);
        }
        
        const userData = await userResponse.json();
        console.log('User data received:', userData);
        
        const user: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.google_user_data?.name || 'User',
          google_user_data: userData.google_user_data
        };
        
        console.log('Setting user:', user);
        setUser(user);
        localStorage.setItem(MOCHA_SESSION_TOKEN_COOKIE_NAME, JSON.stringify(user));
        
        // Clear the URL params immediately to prevent infinite loop
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return user; // Return the user to indicate success
      } else {
        throw new Error(`Failed to exchange code for session: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Session exchange error:', error);
      // Don't fallback to mock - throw the error so AuthCallback can handle it
      throw error;
    }
  }, []); // Empty dependency array - function should be stable

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, exchangeCodeForSessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
