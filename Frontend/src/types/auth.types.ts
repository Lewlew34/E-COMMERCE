// User roles mapped to TechEcommerceDB [users].[role] ('admin', 'staff', 'customer')
// Supporting both lowercase (DB standard) and uppercase aliases for backward compatibility.
export type UserRole = 'admin' | 'staff' | 'customer' | 'seller' | 'ADMIN' | 'SELLER' | 'CUSTOMER';

export type UserStatus = 'active' | 'inactive' | 'banned';

export interface User {
  id: string | number;
  email: string;
  name: string; // UI alias
  full_name?: string; // DB standard
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  shopName?: string; // Dành riêng cho Người bán (staff/seller)
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
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
