// ============================================================
// AUTH CONTEXT - Mock Authentication (Demo Mode)
// ============================================================
// Works without backend - uses localStorage for session
// For production, replace with real API calls
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

// ============================================================
// MOCK USERS DATABASE
// ============================================================

const MOCK_USERS = [
  {
    id: 'user-sa-1',
    email: 'admin@platform.com',
    password: 'ChangeThisPassword123!',
    name: 'Platform Admin',
    role: 'SUPER_ADMIN' as UserRole,
    hotelId: null,
    isActive: true,
  },
  {
    id: 'user-own-1',
    email: 'owner@tajpalace.com',
    password: 'Owner@123',
    name: 'Rajesh Kumar',
    role: 'OWNER' as UserRole,
    hotelId: 'hotel-1',
    isActive: true,
    hotel: {
      id: 'hotel-1',
      name: 'Taj Palace Restaurant',
      subscriptionPlan: 'PRO',
      subscriptionEnd: '2026-12-31',
      isActive: true,
    },
  },
  {
    id: 'user-kit-1',
    email: 'kitchen@tajpalace.com',
    password: 'Kitchen@123',
    name: 'Chef Anil',
    role: 'KITCHEN' as UserRole,
    hotelId: 'hotel-1',
    isActive: true,
    hotel: {
      id: 'hotel-1',
      name: 'Taj Palace Restaurant',
      subscriptionPlan: 'PRO',
      subscriptionEnd: '2026-12-31',
      isActive: true,
    },
  },
  {
    id: 'user-wait-1',
    email: 'waiter@tajpalace.com',
    password: 'Waiter@123',
    name: 'Suresh',
    role: 'WAITER' as UserRole,
    hotelId: 'hotel-1',
    isActive: true,
    hotel: {
      id: 'hotel-1',
      name: 'Taj Palace Restaurant',
      subscriptionPlan: 'PRO',
      subscriptionEnd: '2026-12-31',
      isActive: true,
    },
  },
];

// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================
  // VERIFY SESSION ON MOUNT
  // ============================================================
  // Check localStorage for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  // ============================================================
  // LOGIN - Mock Authentication
  // ============================================================

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (!mockUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!mockUser.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }

    // Store user in localStorage (excluding password)
    const { password: _, ...userWithoutPassword } = mockUser;
    localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);

    return { success: true };
  }, []);

  // ============================================================
  // LOGOUT - Clear localStorage
  // ============================================================

  const logout = useCallback(async () => {
    localStorage.removeItem('auth_user');
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
// API HELPER - Mock Implementation
// ============================================================
// For production, replace with real API calls
// ============================================================

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Mock implementation - returns success for all calls
  console.log('API Call (mock):', endpoint, options);
  
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: {} }),
  } as Response;
}
