// Types mapped directly from TechEcommerceDB (script.sql)

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  description?: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  attributes: Record<string, string>; // e.g. { "RAM": "16GB", "SSD": "512GB", "Color": "Titanium Gray" }
  image: string;
}

export type ProductStatus = 'draft' | 'active' | 'archived' | 'pending_review' | 'published' | 'rejected';

export interface Product {
  id: number;
  name: string;
  slug: string;
  brandId: number;
  categoryId: number;
  description: string;
  specifications: Record<string, string | number>;
  status: ProductStatus;
  
  // Populated relation fields for UI
  brand?: Brand;
  category?: Category;
  variants: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  isFlashSale?: boolean;
  flashSaleOriginalPrice?: number;
  flashSaleDiscountPercent?: number;
  flashSalePrice?: number;
  flashSaleStartTime?: string;
  flashSaleEndTime?: string;
  isFeatured?: boolean;
}

export interface UserAddress {
  id: number;
  userId: number;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward?: string;
  district?: string;
  city: string;
  isDefault?: boolean;
}

export interface CartItem {
  id: number;
  cartId: number;
  variantId: number;
  quantity: number;
  
  // Populated UI data
  variant: ProductVariant;
  product: Product;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD';

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  productNameSnapshot: string;
  variantAttributesSnapshot: Record<string, string>;
  price: number;
  quantity: number;
  totalPrice: number;
  image?: string;
}

export interface Order {
  id: number;
  userId: number;
  orderCode: string; // e.g. "ORD-20261104-001"
  totalAmount: number;
  shippingFee: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddressSnapshot: UserAddress;
  items: OrderItem[];
  sellerTrackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashSaleItem {
  id: number;
  flashSaleId: number;
  variantId: number;
  flashSalePrice: number;
  stockLimit: number;
  soldCount: number;
  variant?: ProductVariant;
  product?: Product;
}

export interface FlashSale {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'ended';
  items: FlashSaleItem[];
}

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  createdAt: string;
  product?: Product;
}

export interface InventoryLog {
  id: number;
  variantId: number;
  type: 'import' | 'order_deduct' | 'manual_adjust' | 'return';
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  createdBy: number;
  createdAt: string;
}
