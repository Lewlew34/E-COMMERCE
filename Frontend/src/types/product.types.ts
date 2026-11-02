export interface TechSpecification {
  cpu?: string;
  ram?: string;
  storage?: string;
  gpu?: string;
  screen?: string;
  battery?: string;
  os?: string;
  weight?: string;
  warrantyMonths?: number;
  [key: string]: string | number | undefined;
}

export interface ProductVariant {
  id: string;
  name: string; // ví dụ: "256GB - Titan Tự Nhiên" hoặc "16GB RAM - 512GB SSD"
  price: number;
  originalPrice: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: 'laptop' | 'phone' | 'pc-component' | 'monitor' | 'accessory';
  categoryName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  stock: number;
  thumbnail: string;
  images: string[];
  description: string;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  specifications: TechSpecification;
  variants?: ProductVariant[];
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
}

export interface CategoryItem {
  id: string;
  key: string;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}
