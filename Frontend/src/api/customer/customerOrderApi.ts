import { apiClient } from '../client';
import type { Order, UserAddress, PaymentMethod } from '../../types/ecommerce.types';

export interface CreateOrderInput {
  items: Array<{ variantId: number; quantity: number }>;
  shippingAddress: Pick<UserAddress, 'recipientName' | 'phone' | 'addressLine' | 'ward' | 'district' | 'city'>;
  paymentMethod: PaymentMethod;
}

export const customerOrderApi = {
  async createOrder(data: CreateOrderInput): Promise<Order> {
    return apiClient<Order>('customer/orders.php?action=create', {
      method: 'POST',
      body: data
    });
  },

  async getMyOrders(): Promise<Order[]> {
    return apiClient<Order[]>('customer/orders.php?action=list');
  },

  async cancelOrder(orderId: number): Promise<void> {
    await apiClient<void>(`customer/orders.php?action=cancel&id=${orderId}`, {
      method: 'POST',
      body: {}
    });
  }
};
