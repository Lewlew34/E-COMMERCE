export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SELLER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  shopName?: string; // Dành riêng cho Người bán (SELLER)
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCustomerData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterSellerData {
  name: string;
  email: string;
  password: string;
  phone: string;
  shopName: string;
  businessAddress: string;
  category: string;
}
