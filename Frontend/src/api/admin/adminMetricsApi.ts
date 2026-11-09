import { apiClient } from '../client';

export interface AdminMetrics {
  total_customers: number;
  total_sellers: number;
  total_products: number;
  total_orders: number;
  total_gmv: number;
  pending_orders: number;
}

export const adminMetricsApi = {
  async getMetrics(): Promise<AdminMetrics> {
    return apiClient<AdminMetrics>('admin/metrics.php');
  }
};
