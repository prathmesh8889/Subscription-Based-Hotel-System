// ============================================================
// AUTH CONTEXT - Real API Integration with HttpOnly Cookies
// ============================================================
// Uses HttpOnly cookies for secure JWT storage
// No tokens in localStorage/sessionStorage
// ============================================================

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { UserRole } from '../types';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hotelId: string | null;
  isActive: boolean;
  hotel?: {
    id: string;
    name: string;
    subscriptionPlan: string;
    subscriptionEnd: string;
    isActive: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL - use environment variable or default to localhost
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================
  // VERIFY SESSION ON MOUNT
  // ============================================================
  // Check if user has valid session cookie
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: 'GET',
          credentials: 'include', // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
          }
        }
      } catch (error) {
        console.error('Session verification failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  // ============================================================
  // LOGIN - Real API Call with HttpOnly Cookie
  // ============================================================

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.success && data.data?.user) {
        setUser(data.data.user);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================
  // LOGOUT - Clear Cookie via API
  // ============================================================

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  // ============================================================
  // ROLE CHECK
  // ============================================================

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ============================================================
// API HELPER - Include Credentials for Cookie Auth
// ============================================================

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Session expired or invalid
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}
