// ============================================================
// STEP 5: SECRET SUPER ADMIN ROUTE - COMPLETE IMPLEMENTATION
// ============================================================
// This file demonstrates the complete implementation of a secret
// Super Admin login route with additional security measures.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle, Lock, Fingerprint } from 'lucide-react';

// ============================================================
// SECURITY CONFIGURATION
// ============================================================
// In production, these would be environment variables

const SECRET_ROUTE = '/platform/login';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// ============================================================
// SUPER ADMIN LOGIN PAGE
// ============================================================

export function SuperAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================
  // SECURITY: Check if user is already locked out
  // ============================================================
  useEffect(() => {
    const lockData = sessionStorage.getItem('admin_lockout');
    if (lockData) {
      const { lockedUntil, attempts: savedAttempts } = JSON.parse(lockData);
      const now = Date.now();
      
      if (now < lockedUntil) {
        setIsLocked(true);
        setAttempts(savedAttempts);
        setLockoutTime(Math.ceil((lockedUntil - now) / 1000));
        
        // Countdown timer
        const interval = setInterval(() => {
          const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
          if (remaining <= 0) {
            setIsLocked(false);
            setAttempts(0);
            setLockoutTime(0);
            sessionStorage.removeItem('admin_lockout');
            clearInterval(interval);
          } else {
            setLockoutTime(remaining);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        sessionStorage.removeItem('admin_lockout');
      }
    }
  }, []);

  // ============================================================
  // SECURITY: Verify we're on the correct secret route
  // ============================================================
  useEffect(() => {
    if (location.pathname !== SECRET_ROUTE) {
      // Redirect to regular login if not on secret route
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  // ============================================================
  // LOGIN HANDLER WITH SECURITY MEASURES
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if locked out
    if (isLocked) {
      setError(`Too many failed attempts. Please try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Verify user is SUPER_ADMIN
        const stored = sessionStorage.getItem('auth_user');
        if (stored) {
          const user = JSON.parse(stored);
          
          if (user.role === 'SUPER_ADMIN') {
            // Clear any lockout data
            sessionStorage.removeItem('admin_lockout');
            setAttempts(0);
            
            // Log successful admin access
            console.log('✅ Super Admin access granted:', user.email);
            
            // Navigate to admin dashboard
            navigate('/platform/dashboard', { replace: true });
          } else {
            // Non-admin user tried to access admin route
            setError('Access denied. This area is restricted to Super Admins only.');
            
            // Increment attempts
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            
            // Lock account if too many attempts
            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
              const lockedUntil = Date.now() + LOCKOUT_DURATION;
              setIsLocked(true);
              setLockoutTime(LOCKOUT_DURATION / 1000);
              
              sessionStorage.setItem('admin_lockout', JSON.stringify({
                lockedUntil,
                attempts: newAttempts,
              }));
              
              setError(`Too many failed attempts. Account locked for 15 minutes.`);
            }
          }
        }
      } else {
        // Login failed
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Lock account if too many attempts
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockedUntil = Date.now() + LOCKOUT_DURATION;
          setIsLocked(true);
          setLockoutTime(LOCKOUT_DURATION / 1000);
          
          sessionStorage.setItem('admin_lockout', JSON.stringify({
            lockedUntil,
            attempts: newAttempts,
          }));
          
          setError(`Too many failed attempts. Account locked for 15 minutes.`);
        } else {
          setError(result.error || 'Invalid credentials');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER: LOCKED STATE
  // ============================================================
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-2xl mb-4 shadow-lg shadow-red-500/20">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Access Locked</h1>
            <p className="text-red-300 mt-1">Too many failed attempts</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                This account has been temporarily locked due to multiple failed login attempts.
              </p>
              <p className="text-3xl font-bold text-red-600">
                {Math.floor(lockoutTime / 60)}:{String(lockoutTime % 60).padStart(2, '0')}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Time remaining
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <p className="font-medium">Security Notice</p>
              <p className="text-xs mt-1">
                All access attempts are logged. If you believe this is an error, contact the system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: LOGIN FORM
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/20">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Platform Admin</h1>
          <p className="text-purple-300 mt-1">Super Admin Access</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Fingerprint size={20} className="text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">Secure Login</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Restricted access area - All attempts are logged</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {attempts > 0 && attempts < MAX_LOGIN_ATTEMPTS && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              <AlertCircle size={16} />
              {MAX_LOGIN_ATTEMPTS - attempts} attempts remaining before lockout
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="admin@platform.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Access Platform'
              )}
            </button>
          </form>

          {/* Security Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs font-medium text-purple-800 mb-1">🔒 Security Features</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• All login attempts are logged and monitored</li>
                <li>• Account locks after {MAX_LOGIN_ATTEMPTS} failed attempts</li>
                <li>• IP address and user agent are recorded</li>
                <li>• Two-factor authentication recommended</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <p className="text-xs text-purple-300">
            🔒 This is a restricted area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
