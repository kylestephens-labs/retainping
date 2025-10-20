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

  const login = () => {
    // Mock login - in a real app, this would redirect to OAuth
    const mockUser: User = {
      id: '1',
      email: 'user@example.com',
      name: 'Demo User'
    };
    setUser(mockUser);
    localStorage.setItem(MOCHA_SESSION_TOKEN_COOKIE_NAME, JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(MOCHA_SESSION_TOKEN_COOKIE_NAME);
  };

  const exchangeCodeForSessionToken = async () => {
    // Mock implementation
    login();
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
