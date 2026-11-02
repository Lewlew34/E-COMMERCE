import type { User } from '../../types/auth.types';

export const DEMO_USERS: Record<string, User> = {
  customer: {
    id: 'user_cust_01',
    name: 'Nguyễn Văn Long',
    email: 'khachhang@techstore.vn',
    role: 'CUSTOMER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: '0987654321',
    createdAt: '2026-01-10',
  },
  seller: {
    id: 'user_seller_01',
    name: 'Trần Minh Hoàng',
    email: 'seller@gearzone.vn',
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '0912345678',
    shopName: 'GearZone Official Store',
    createdAt: '2025-11-20',
  },
  admin: {
    id: 'user_admin_01',
    name: 'Quản Trị Viên (Admin)',
    email: 'admin@techmart.vn',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '0900000001',
    createdAt: '2025-01-01',
  },
};
