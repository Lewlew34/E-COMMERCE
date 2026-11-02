import type { Order } from '../../types/order.types';

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_01',
    code: 'TECH-20261101-098',
    customerId: 'user_cust_01',
    customerName: 'Nguyễn Văn Long',
    customerPhone: '0987654321',
    shippingAddress: 'Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh, TP. Hồ Chí Minh',
    sellerId: 'user_seller_01',
    sellerName: 'GearZone Official Store',
    items: [
      {
        productId: 'prod_01',
        productName: 'Laptop Gaming ASUS ROG Strix G16 (2025)',
        price: 36990000,
        quantity: 1,
        thumbnail: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=150',
      },
    ],
    totalAmount: 36990000,
    status: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    createdAt: '2026-11-01 10:30',
  },
  {
    id: 'ord_02',
    code: 'TECH-20261031-045',
    customerId: 'user_cust_02',
    customerName: 'Lê Hoàng Nam',
    customerPhone: '0908123456',
    shippingAddress: 'Số 18 đường Duy Tân, Cầu Giấy, Hà Nội',
    sellerId: 'user_seller_01',
    sellerName: 'GearZone Official Store',
    items: [
      {
        productId: 'prod_02',
        productName: 'Apple iPhone 16 Pro Max 256GB - Titan Sa Mạc',
        price: 34490000,
        quantity: 1,
        thumbnail: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=150',
      },
      {
        productId: 'prod_05',
        productName: 'Bàn Phím Cơ Không Dây Custom Keychron Q1 Pro',
        price: 4690000,
        quantity: 1,
        thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150',
      },
    ],
    totalAmount: 39180000,
    status: 'CONFIRMED',
    paymentMethod: 'CREDIT_CARD',
    createdAt: '2026-10-31 16:15',
  },
  {
    id: 'ord_03',
    code: 'TECH-20261030-012',
    customerId: 'user_cust_03',
    customerName: 'Phạm Thuỳ Dung',
    customerPhone: '0934567890',
    shippingAddress: 'Khu công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh',
    sellerId: 'user_seller_01',
    sellerName: 'GearZone Official Store',
    items: [
      {
        productId: 'prod_03',
        productName: 'Card Màn Hình ASUS TUF Gaming GeForce RTX 4070 Ti SUPER 16GB',
        price: 24590000,
        quantity: 1,
        thumbnail: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=150',
      },
    ],
    totalAmount: 24590000,
    status: 'SHIPPING',
    paymentMethod: 'COD',
    createdAt: '2026-10-30 09:20',
  },
];

export interface PendingSeller {
  id: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  appliedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const MOCK_PENDING_SELLERS: PendingSeller[] = [
  {
    id: 'pen_01',
    shopName: 'CyberPC Gaming Store',
    ownerName: 'Vũ Quốc Anh',
    email: 'cyberpc.vn@gmail.com',
    phone: '0978112233',
    category: 'Linh Kiện PC & Custom Watercooling',
    appliedDate: '2026-11-02 08:30',
    status: 'PENDING',
  },
  {
    id: 'pen_02',
    shopName: 'Apple Authorized Dealer - TechVibe',
    ownerName: 'Ngô Thanh Tùng',
    email: 'techvibe.apple@gmail.com',
    phone: '0933445566',
    category: 'Sản phẩm Apple & Phụ kiện chính hãng',
    appliedDate: '2026-11-01 14:10',
    status: 'PENDING',
  },
];
