import { apiClient } from '../client';
import type { User, UserRole, UserStatus } from '../../types/auth.types';

export const adminUserApi = {
  async getUsers(): Promise<User[]> {
    return apiClient<User[]>('admin/users.php');
  },

  async updateUserStatus(id: number, status: UserStatus): Promise<void> {
    await apiClient<void>(`admin/users.php?action=status&id=${id}`, {
      method: 'PATCH',
      body: { status }
    });
  },

  async updateUserRole(id: number, role: UserRole): Promise<void> {
    await apiClient<void>(`admin/users.php?action=role&id=${id}`, {
      method: 'PATCH',
      body: { role }
    });
  }
};
