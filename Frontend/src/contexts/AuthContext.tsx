import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types/auth.types';
import { DEMO_USERS } from '../services/mockData/demoUsers';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; message?: string; user?: User };
  loginWithUser: (user: User) => void;
  logout: () => void;
  // Helpers
  isAdmin: boolean;
  isSeller: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start unauthenticated on fresh app load unless an explicit active session is in sessionStorage
  const [user, setUser] = useState<User | null>(() => {
    try {
      // Clear legacy permanent localStorage to ensure login screen is required first
      localStorage.removeItem('tech_store_user');
      localStorage.removeItem('techmart_auth_user');

      const saved = sessionStorage.getItem('tech_store_session_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      return null;
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('tech_store_session_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('tech_store_session_user');
    }
  }, [user]);

  const login = (email: string, _password?: string) => {
    const trimmed = email.trim().toLowerCase();
    let matchedUser: User | undefined;

    if (trimmed.includes('admin') || trimmed === 'admin@techmart.vn') {
      matchedUser = DEMO_USERS.admin;
    } else if (trimmed.includes('seller') || trimmed.includes('gearzone') || trimmed === 'seller@gearzone.vn') {
      matchedUser = DEMO_USERS.seller;
    } else if (trimmed.includes('khachhang') || trimmed === 'khachhang@techstore.vn') {
      matchedUser = DEMO_USERS.customer;
    } else {
      // Find from any registered users in demo list
      matchedUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === trimmed);
      if (!matchedUser) {
        // Fallback create customer user for new email
        matchedUser = {
          id: Date.now(),
          name: email.split('@')[0],
          full_name: email.split('@')[0],
          email,
          role: 'customer',
          status: 'active',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          createdAt: new Date().toISOString().split('T')[0],
        };
      }
    }

    if (matchedUser.status === 'banned') {
      return { success: false, message: 'Tài khoản này đã bị khóa do vi phạm chính sách của sàn!' };
    }

    setUser(matchedUser);
    return { success: true, user: matchedUser };
  };

  const loginWithUser = (targetUser: User) => {
    setUser(targetUser);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    localStorage.removeItem('tech_store_user');
    localStorage.removeItem('techmart_auth_user');
    sessionStorage.removeItem('tech_store_session_user');
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
        login,
        loginWithUser,
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
