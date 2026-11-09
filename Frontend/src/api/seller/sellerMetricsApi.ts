import { apiClient } from '../client';

export interface SellerMetrics {
  product_count: number;
  stock_count: number;
  low_stock_count: number;
  order_count: number;
  pending_count: number;
  confirmed_count: number;
  shipping_count: number;
  delivered_count: number;
  revenue: number;
  top_products: Array<{
    id: number;
    name: string;
    sku: string;
    sold_count: number;
    revenue: number;
    stock_quantity: number;
  }>;
}

export const sellerMetricsApi = {
  async getMetrics(days = 30): Promise<SellerMetrics> {
    return apiClient<SellerMetrics>(`seller/dashboard.php?days=${days}`);
  },

  async setFlashSale(data: {
    productId: number;
    enabled: boolean;
    title?: string;
    price?: number;
    stockLimit?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<void> {
    await apiClient<void>('seller/flash_sale.php', {
      method: 'POST',
      body: data
    });
  }
};
