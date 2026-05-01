// ============================================================
// SPET — Authentication Context
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService, { normalizeUser } from '@/services/auth.service';
import { storage } from '@/utils/helpers';
import { ROLE_HIERARCHY } from '@/utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => storage.get('spet_user'));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Always refresh user from server on mount — ensures media URLs (avatar, cv) are absolute
  useEffect(() => {
    const token = storage.get('spet_access_token');
    if (!token) return;
    AuthService.getProfile()
      .then(profile => {
        storage.set('spet_user', profile);
        setUser(profile);
      })
      .catch(() => {
        storage.remove('spet_access_token');
        storage.remove('spet_refresh_token');
        storage.remove('spet_user');
        setUser(null);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data    = await AuthService.login(email, password);
      const profile = normalizeUser(data.user);
      storage.set('spet_user', profile);
      setUser(profile);
      return profile;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Erreur de connexion';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await AuthService.logout();
    } finally {
      storage.remove('spet_access_token');
      storage.remove('spet_refresh_token');
      storage.remove('spet_user');
      setUser(null);
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      storage.set('spet_user', updated);
      return updated;
    });
  }, []);

  const isAuthenticated = !!user;
  const hasRole = (...roles) => {
    if (!user) return false;
    const inherited = ROLE_HIERARCHY[user.role] || [user.role];
    return roles.some(r => inherited.includes(r));
  };

  return (
    <AuthContext.Provider value={{
      user, loading, error, isAuthenticated,
      login, logout, updateUser, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
