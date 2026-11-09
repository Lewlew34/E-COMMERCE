import { apiClient } from '../client';
import type { Product } from '../../types/ecommerce.types';

export interface SellerProductInput {
  variantId?: number;
  name: string;
  brandId: number;
  categoryId: number;
  description: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  variantAttr: string;
  image: string;
}

export const sellerProductApi = {
  async getProducts(): Promise<Product[]> {
    return apiClient<Product[]>('seller/products.php');
  },

  async createProduct(data: SellerProductInput): Promise<Product> {
    return apiClient<Product>('seller/products.php', {
      method: 'POST',
      body: data
    });
  },

  async updateProduct(id: number, data: SellerProductInput): Promise<Product> {
    return apiClient<Product>(`seller/products.php?id=${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async addVariant(productId: number, data: SellerProductInput): Promise<{ id: number; productId: number }> {
    return apiClient<{ id: number; productId: number }>(`seller/variants.php?productId=${productId}`, {
      method: 'POST',
      body: data
    });
  },

  async deleteProduct(id: number): Promise<void> {
    await apiClient<void>(`seller/products.php?id=${id}`, {
      method: 'DELETE'
    });
  }
};
