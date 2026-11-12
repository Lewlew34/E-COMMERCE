import { apiClient } from '../client';

export interface AdminMetrics {
  total_customers: number;
  active_sellers: number;
  pending_sellers: number;
  published_products: number;
  pending_products: number;
  order_count: number;
  delivered_count: number;
  cancelled_count: number;
  gmv: number;
  delivered_revenue: number;
}

export type AdminReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface AdminShopMetric {
  seller_id: number;
  shop_name: string | null;
  owner_name: string;
  gmv: number;
  delivered_revenue: number;
  order_count: number;
  delivered_count: number;
  cancelled_count: number;
}

export interface AdminReport {
  period: AdminReportPeriod;
  date: string;
  start: string;
  end: string;
  end_inclusive: string;
  summary: Omit<AdminMetrics, 'total_customers' | 'active_sellers' | 'pending_sellers' | 'published_products' | 'pending_products'>;
  counts: Pick<AdminMetrics, 'total_customers' | 'active_sellers' | 'pending_sellers' | 'published_products' | 'pending_products'>;
  shops: AdminShopMetric[];
  recent_orders: Array<{
    id: number;
    order_code: string;
    final_amount: number;
    order_status: string;
    created_at: string;
    customer_name: string;
    shops: string | null;
  }>;
}

export const adminMetricsApi = {
  async getMetrics(period: AdminReportPeriod = 'month', date = new Date().toISOString().slice(0, 10)): Promise<AdminReport> {
    const query = new URLSearchParams({ period, date });
    return apiClient<AdminReport>(`admin/metrics.php?${query.toString()}`);
  }
};
