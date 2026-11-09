import { apiClient } from '../client';
import type { UserAddress } from '../../types/ecommerce.types';

export const customerAddressApi = {
  async getAddresses(): Promise<UserAddress[]> {
    return apiClient<UserAddress[]>('customer/addresses.php');
  },

  async addAddress(data: Omit<UserAddress, 'id' | 'userId'>): Promise<{ id: number }> {
    return apiClient<{ id: number }>('customer/addresses.php', {
      method: 'POST',
      body: data
    });
  },

  async deleteAddress(id: number): Promise<void> {
    await apiClient<void>(`customer/addresses.php?id=${id}`, {
      method: 'DELETE'
    });
  }
};
