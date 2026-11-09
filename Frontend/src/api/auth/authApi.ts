import { apiClient } from '../client';
import type { User } from '../../types/auth.types';

export interface RegisterCustomerInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterSellerInput {
  name: string;
  shopName: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  password: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    return apiClient<User>('auth/login.php', {
      method: 'POST',
      body: { email, password }
    });
  },

  async registerCustomer(data: RegisterCustomerInput): Promise<User> {
    return apiClient<User>('auth/register_customer.php', {
      method: 'POST',
      body: data
    });
  },

  async registerSeller(data: RegisterSellerInput): Promise<User> {
    return apiClient<User>('auth/register_seller.php', {
      method: 'POST',
      body: data
    });
  },

  async logout(): Promise<void> {
    await apiClient<void>('auth/logout.php', {
      method: 'POST',
      body: {}
    });
  },

  async getMe(): Promise<User | null> {
    return apiClient<User | null>('auth/me.php');
  }
};
