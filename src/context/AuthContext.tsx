// ============================================================
// SMART AUTH CONTEXT - Works with Backend OR Demo Mode
// ============================================================
// Automatically detects if backend is available
// Falls back to demo mode if backend is down
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
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API configuration
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
const USE_BACKEND = (import.meta as any).env?.VITE_USE_BACKEND === 'true';

// ============================================================
// MOCK USERS (Demo Mode)
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
  const [isDemoMode, setIsDemoMode] = useState(!USE_BACKEND);

  // ============================================================
  // CHECK BACKEND AVAILABILITY
  // ============================================================

  useEffect(() => {
    const checkBackend = async () => {
      if (!USE_BACKEND) {
        // Demo mode - load from localStorage
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
        return;
      }

      try {
        // Try to verify session with backend
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
            setIsDemoMode(false);
          }
        }
      } catch (error) {
        console.log('Backend not available, using demo mode');
        setIsDemoMode(true);
        
        // Load from localStorage in demo mode
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            localStorage.removeItem('auth_user');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkBackend();
  }, []);

  // ============================================================
  // LOGIN - Smart (Backend or Demo)
  // ============================================================

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);

    // Try backend first if enabled
    if (USE_BACKEND && !isDemoMode) {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.data.user);
          setIsLoading(false);
          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: data.error || 'Login failed' };
      } catch (error) {
        console.log('Backend login failed, falling back to demo mode');
        setIsDemoMode(true);
      }
    }

    // Demo mode login
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (!mockUser) {
      setIsLoading(false);
      return { success: false, error: 'Invalid email or password' };
    }

    if (!mockUser.isActive) {
      setIsLoading(false);
      return { success: false, error: 'Account is deactivated' };
    }

    const { password: _, ...userWithoutPassword } = mockUser;
    localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
    setIsLoading(false);

    return { success: true };
  }, [isDemoMode]);

  // ============================================================
  // LOGOUT - Smart (Backend or Demo)
  // ============================================================

  const logout = useCallback(async () => {
    // Try backend logout if not in demo mode
    if (USE_BACKEND && !isDemoMode) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Backend logout failed:', error);
      }
    }

    // Always clear localStorage
    localStorage.removeItem('auth_user');
    setUser(null);
  }, [isDemoMode]);

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
        isDemoMode,
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
