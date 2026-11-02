import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types/auth.types';
import { DEMO_USERS } from '../services/mockData/demoUsers';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loginAs: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tech_store_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_USERS.customer;
      }
    }
    return DEMO_USERS.customer;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('tech_store_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tech_store_user');
    }
  }, [user]);

  const loginAs = (targetRole: UserRole) => {
    if (targetRole === 'ADMIN') setUser(DEMO_USERS.admin);
    else if (targetRole === 'SELLER') setUser(DEMO_USERS.seller);
    else setUser(DEMO_USERS.customer);
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    loginAs(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        loginAs,
        logout,
        switchRole,
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
