import { apiClient } from '../client';
import type { Order, OrderStatus } from '../../types/ecommerce.types';

export const sellerOrderApi = {
  async getOrders(): Promise<Order[]> {
    return apiClient<Order[]>('seller/orders.php');
  },

  async updateOrderStatus(id: number, status: OrderStatus, trackingNumber?: string): Promise<void> {
    await apiClient<void>(`seller/orders.php?id=${id}`, {
      method: 'PATCH',
      body: { status, trackingNumber }
    });
  }
};
