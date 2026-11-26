import { apiClient } from '../client';
import type { CartItem } from '../../types/ecommerce.types';

export const customerCartApi = {
  getItems: () => apiClient<CartItem[]>('customer/cart.php?action=list'),
  addItem: (variantId: number, quantity: number) => apiClient<CartItem[]>('customer/cart.php?action=add', {
    method: 'POST', body: { variantId, quantity }
  }),
  updateItem: (variantId: number, quantity: number) => apiClient<CartItem[]>('customer/cart.php?action=update', {
    method: 'POST', body: { variantId, quantity }
  }),
  removeItem: (variantId: number) => apiClient<CartItem[]>('customer/cart.php?action=remove', {
    method: 'POST', body: { variantId }
  }),
  removeItems: (variantIds: number[]) => apiClient<CartItem[]>('customer/cart.php?action=remove-selected', {
    method: 'POST', body: { variantIds }
  }),
  clear: () => apiClient<CartItem[]>('customer/cart.php?action=clear', { method: 'POST', body: {} }),
  merge: (items: Array<{ variantId: number; quantity: number }>) => apiClient<CartItem[]>('customer/cart.php?action=merge', {
    method: 'POST', body: { items }
  })
};
