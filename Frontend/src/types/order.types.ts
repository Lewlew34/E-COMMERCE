export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  variantName?: string;
  thumbnail: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  code: string; // ví dụ: "ORD-20261102-001"
  customerId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  createdAt: string;
}
