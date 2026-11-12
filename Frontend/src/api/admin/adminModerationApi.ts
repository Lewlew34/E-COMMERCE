import { apiClient } from '../client';
import type { User } from '../../types/auth.types';

export interface AdminReviewProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  specifications: Record<string, string | number>;
  status: string;
  brand_name: string | null;
  category_name: string | null;
  shop_name: string | null;
  seller_name: string | null;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  image: string | null;
}

export const adminModerationApi = {
  async getSellers(status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'): Promise<User[]> {
    return apiClient<User[]>(`admin/moderation.php?resource=sellers&status=${status}`);
  },

  async reviewSeller(id: number, decision: 'approve' | 'reject'): Promise<void> {
    await apiClient<void>(`admin/moderation.php?resource=sellers&id=${id}`, {
      method: 'PATCH',
      body: { decision }
    });
  },

  async getProducts(status: 'pending_review' | 'published' | 'rejected' | 'all' = 'pending_review'): Promise<AdminReviewProduct[]> {
    return apiClient<AdminReviewProduct[]>(`admin/moderation.php?resource=products&status=${status}`);
  },

  async reviewProduct(id: number, decision: 'approve' | 'reject'): Promise<void> {
    await apiClient<void>(`admin/moderation.php?resource=products&id=${id}`, {
      method: 'PATCH',
      body: { decision }
    });
  }
};
