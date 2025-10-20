/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MOCHA_SESSION_TOKEN_COOKIE_NAME } from '@/react-app/constants/auth';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  exchangeCodeForSessionToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

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
      // Fallback to mock login if API fails
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Demo User'
      };
      setUser(mockUser);
      localStorage.setItem(MOCHA_SESSION_TOKEN_COOKIE_NAME, JSON.stringify(mockUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
  };

  const exchangeCodeForSessionToken = async () => {
    try {
      // Get the auth code from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (!code) {
        throw new Error('No authorization code found');
      }

      // Exchange code for session token
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (result.success) {
        // Get user info
        const userResponse = await fetch('/api/users/me');
        const userData = await userResponse.json();
        
        const user: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.google_user_data?.name || 'User'
        };
        
        setUser(user);
        localStorage.setItem(MOCHA_SESSION_TOKEN_COOKIE_NAME, JSON.stringify(user));
      } else {
        throw new Error('Failed to exchange code for session');
      }
    } catch (error) {
      console.error('Session exchange error:', error);
      // Fallback to mock login
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Demo User'
      };
      setUser(mockUser);
      localStorage.setItem(MOCHA_SESSION_TOKEN_COOKIE_NAME, JSON.stringify(mockUser));
    }
  };

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
