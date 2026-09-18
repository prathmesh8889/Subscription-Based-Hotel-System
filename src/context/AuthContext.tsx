// ============================================================
// AUTH CONTEXT - Real API Integration
// ============================================================
// Replaces mock data with real backend API calls
// Uses sessionStorage for token storage (more secure than localStorage)
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('auth_token');
    const storedUser = sessionStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  // ============================================================
  // LOGIN - Real API Call
  // ============================================================

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const { token: newToken, user: userData } = data.data;

      // Store in session storage (not localStorage for better security)
      sessionStorage.setItem('auth_token', newToken);
      sessionStorage.setItem('auth_user', JSON.stringify(userData));

      // Update state
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = useCallback(() => {
    // Clear storage
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');

    // Clear state
    setToken(null);
    setUser(null);
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
        token,
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

// Helper function for API calls with authentication
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}
