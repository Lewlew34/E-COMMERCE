import { apiClient } from '../client';
import type { CartItem } from '../../types/ecommerce.types';

export const customerCartApi = {
  async getItems(): Promise<CartItem[]> {
    return apiClient<CartItem[]>('customer/cart.php?action=list');
  },

  async addItem(variantId: number, quantity: number): Promise<CartItem[]> {
    return apiClient<CartItem[]>('customer/cart.php?action=add', {
      method: 'POST',
      body: { variantId, quantity }
    });
  },

  async updateQuantity(variantId: number, quantity: number): Promise<CartItem[]> {
    return apiClient<CartItem[]>('customer/cart.php?action=quantity', {
      method: 'PUT',
      body: { variantId, quantity }
    });
  },

  async removeItem(variantId: number): Promise<CartItem[]> {
    return apiClient<CartItem[]>(`customer/cart.php?action=remove&variantId=${variantId}`, {
      method: 'DELETE'
    });
  },

  async clear(): Promise<CartItem[]> {
    return apiClient<CartItem[]>('customer/cart.php?action=clear', {
      method: 'DELETE'
    });
  }
};
