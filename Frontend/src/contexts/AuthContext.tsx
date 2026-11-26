import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, UserRole } from '../types/auth.types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  setAuthenticatedUser: (user: User) => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSeller: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRevision = useRef(0);

  useEffect(() => {
    let active = true;
    const requestRevision = sessionRevision.current;

    // Remove legacy client-side identities. The PHP session is the source of truth.
    try {
      sessionStorage.removeItem('tech_store_session_user');
      localStorage.removeItem('tech_store_user');
      localStorage.removeItem('techmart_auth_user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_user');
    } catch {
      // Storage may be unavailable; session validation still runs against the server.
    }

    authApi.getMe()
      .then(serverUser => {
        if (active && requestRevision === sessionRevision.current) setUser(serverUser);
      })
      .catch(() => {
        if (active && requestRevision === sessionRevision.current) setUser(null);
      })
      .finally(() => {
        if (active && requestRevision === sessionRevision.current) setLoading(false);
      });

    const handleUnauthorized = () => {
      sessionRevision.current += 1;
      setUser(null);
      setLoading(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      active = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const setAuthenticatedUser = (authenticatedUser: User) => {
    sessionRevision.current += 1;
    setUser(authenticatedUser);
    setLoading(false);
  };

  const logout = async () => {
    sessionRevision.current += 1;
    setUser(null);
    setLoading(false);
    // Keep the UI signed out, but let the caller report if the server session remains.
    await authApi.logout();
  };

  const currentRole = user?.role ? String(user.role).toLowerCase() : null;
  const isAdmin = currentRole === 'admin';
  const isSeller = currentRole === 'staff' || currentRole === 'seller';
  const isCustomer = currentRole === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        loading,
        setAuthenticatedUser,
        logout,
        isAdmin,
        isSeller,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
