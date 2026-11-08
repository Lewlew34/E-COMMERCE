import type {
  Brand,
  Category,
  Product,
  ProductVariant,
  CartItem,
  Order,
  UserAddress,
  FlashSale,
  InventoryLog,
  OrderStatus
} from '../types/ecommerce.types';
import type { User } from '../types/auth.types';
import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ADDRESSES,
  INITIAL_ORDERS,
  INITIAL_FLASH_SALE
} from './mockData/ecommerceDatabase';

const STORAGE_KEYS = {
  PRODUCTS: 'techmart_products',
  BRANDS: 'techmart_brands',
  CATEGORIES: 'techmart_categories',
  CART: 'techmart_cart_items',
  ORDERS: 'techmart_orders',
  ADDRESSES: 'techmart_addresses',
  WISHLIST: 'techmart_wishlist',
  FLASH_SALE: 'techmart_flash_sale',
  INVENTORY_LOGS: 'techmart_inventory_logs',
};

// Safe JSON parser helper
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error reading localStorage for key ${key}:`, error);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving localStorage for key ${key}:`, error);
  }
}

// ==========================================
// 1. PRODUCTS & CATALOG (LocalStorage Fallback & Admin)
// ==========================================
export const productService = {
  getAll(): Product[] {
    const rawProducts = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const brands = this.getBrands();
    const categories = this.getCategories();

    // Populate relations
    return rawProducts.map(p => ({
      ...p,
      brand: brands.find(b => b.id === p.brandId),
      category: categories.find(c => c.id === p.categoryId)
    }));
  },

  getById(id: number): Product | undefined {
    return this.getAll().find(p => p.id === id);
  },

  getBySlug(slug: string): Product | undefined {
    return this.getAll().find(p => p.slug === slug);
  },

  getVariantById(variantId: number): { product: Product; variant: ProductVariant } | null {
    const products = this.getAll();
    for (const p of products) {
      const variant = p.variants?.find(v => v.id === variantId);
      if (variant) {
        return { product: p, variant };
      }
    }
    return null;
  },

  getBrands(): Brand[] {
    return getStored<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
  },

  getCategories(): Category[] {
    return getStored<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  getFlashSale(): FlashSale {
    return getStored<FlashSale>(STORAGE_KEYS.FLASH_SALE, INITIAL_FLASH_SALE);
  },

  saveProduct(product: Product): void {
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    setStored(STORAGE_KEYS.PRODUCTS, products);
  },

  deleteProduct(id: number): void {
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    setStored(STORAGE_KEYS.PRODUCTS, filtered);
  },

  updateProductFlashSale(
    productId: number,
    config: {
      isFlashSale: boolean;
      originalPrice?: number;
      discountPercent?: number;
      flashSalePrice?: number;
      startTime?: string;
      endTime?: string;
    }
  ): void {
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const index = products.findIndex(p => p.id === productId);
    if (index >= 0) {
      const p = { ...products[index] };
      p.isFlashSale = config.isFlashSale;
      p.flashSaleOriginalPrice = config.originalPrice;
      p.flashSaleDiscountPercent = config.discountPercent;
      p.flashSalePrice = config.flashSalePrice;
      p.flashSaleStartTime = config.startTime;
      p.flashSaleEndTime = config.endTime;

      if (p.variants && p.variants.length > 0) {
        p.variants = p.variants.map((v, idx) => {
          if (idx === 0) {
            if (config.isFlashSale && config.flashSalePrice && config.originalPrice) {
              return {
                ...v,
                price: config.flashSalePrice,
                compareAtPrice: config.originalPrice
              };
            } else if (!config.isFlashSale && config.originalPrice) {
              return {
                ...v,
                price: config.originalPrice,
                compareAtPrice: undefined
              };
            }
          }
          return v;
        });
      }

      products[index] = p;
      setStored(STORAGE_KEYS.PRODUCTS, products);
    }
  }
};

// ==========================================
// 2. CART (Mapped to carts & cart_items)
// ==========================================
export const cartService = {
  getItems(): CartItem[] {
    const stored = getStored<Array<{ id: number; variantId: number; quantity: number }>>(STORAGE_KEYS.CART, [
      { id: 1, variantId: 101, quantity: 1 }
    ]);

    const items: CartItem[] = [];
    for (const item of stored) {
      const match = productService.getVariantById(item.variantId);
      if (match) {
        items.push({
          id: item.id,
          cartId: 1,
          variantId: item.variantId,
          quantity: item.quantity,
          variant: match.variant,
          product: match.product
        });
      }
    }
    return items;
  },

  addItem(variantId: number, quantity: number = 1): CartItem[] {
    const items = this.getItems();
    const existing = items.find(i => i.variantId === variantId);

    const match = productService.getVariantById(variantId);
    if (!match) return items;

    const maxStock = match.variant.stockQuantity;

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, maxStock);
    } else {
      items.push({
        id: Date.now(),
        cartId: 1,
        variantId,
        quantity: Math.min(quantity, maxStock),
        variant: match.variant,
        product: match.product
      });
    }

    this.saveRawItems(items);
    return items;
  },

  updateQuantity(variantId: number, quantity: number): CartItem[] {
    const items = this.getItems();
    const target = items.find(i => i.variantId === variantId);
    if (target) {
      const match = productService.getVariantById(variantId);
      const maxStock = match ? match.variant.stockQuantity : 99;
      if (quantity <= 0) {
        return this.removeItem(variantId);
      }
      target.quantity = Math.min(quantity, maxStock);
      this.saveRawItems(items);
    }
    return items;
  },

  removeItem(variantId: number): CartItem[] {
    const items = this.getItems().filter(i => i.variantId !== variantId);
    this.saveRawItems(items);
    return items;
  },

  clearCart(): void {
    setStored(STORAGE_KEYS.CART, []);
  },

  saveRawItems(items: CartItem[]): void {
    const raw = items.map(i => ({
      id: i.id,
      variantId: i.variantId,
      quantity: i.quantity
    }));
    setStored(STORAGE_KEYS.CART, raw);
  }
};

// ==========================================
// 3. ORDERS (Mapped to orders & order_items)
// ==========================================
export const orderService = {
  getAll(): Order[] {
    return getStored<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  getByUserId(userId: number): Order[] {
    return this.getAll().filter(o => o.userId === userId);
  },

  getByCode(code: string): Order | undefined {
    return this.getAll().find(o => o.orderCode === code);
  },

  createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const orders = this.getAll();
    const newOrder: Order = {
      ...orderData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.unshift(newOrder);
    setStored(STORAGE_KEYS.ORDERS, orders);

    orderData.items.forEach(item => {
      const match = productService.getVariantById(item.variantId);
      if (match) {
        const prevStock = match.variant.stockQuantity;
        const newStock = Math.max(0, prevStock - item.quantity);
        match.variant.stockQuantity = newStock;
        productService.saveProduct(match.product);

        inventoryService.addLog({
          id: Date.now() + Math.random(),
          variantId: item.variantId,
          type: 'order_deduct',
          quantityChanged: -item.quantity,
          previousStock: prevStock,
          newStock,
          referenceId: newOrder.orderCode,
          createdBy: orderData.userId,
          createdAt: new Date().toISOString()
        });
      }
    });

    return newOrder;
  },

  updateStatus(orderId: number, status: OrderStatus): void {
    const orders = this.getAll();
    const target = orders.find(o => o.id === orderId);
    if (target) {
      target.orderStatus = status;
      target.updatedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.ORDERS, orders);
    }
  }
};

// ==========================================
// 4. USER ADDRESSES (Mapped to user_addresses)
// ==========================================
export const addressService = {
  getAll(userId: number = 1): UserAddress[] {
    const stored = getStored<UserAddress[]>(STORAGE_KEYS.ADDRESSES, INITIAL_ADDRESSES);
    return stored.filter(a => a.userId === userId);
  },

  add(address: Omit<UserAddress, 'id'>): UserAddress {
    const all = getStored<UserAddress[]>(STORAGE_KEYS.ADDRESSES, INITIAL_ADDRESSES);
    const newAddress: UserAddress = {
      ...address,
      id: Date.now()
    };
    if (newAddress.isDefault) {
      all.forEach(a => { if (a.userId === address.userId) a.isDefault = false; });
    }
    all.push(newAddress);
    setStored(STORAGE_KEYS.ADDRESSES, all);
    return newAddress;
  },

  setDefault(addressId: number, userId: number = 1): void {
    const all = getStored<UserAddress[]>(STORAGE_KEYS.ADDRESSES, INITIAL_ADDRESSES);
    all.forEach(a => {
      if (a.userId === userId) {
        a.isDefault = a.id === addressId;
      }
    });
    setStored(STORAGE_KEYS.ADDRESSES, all);
  }
};

// ==========================================
// 5. WISHLIST (Mapped to wishlists)
// ==========================================
export const wishlistService = {
  getProductIds(userId: number = 1): number[] {
    const stored = getStored<Array<{ userId: number; productId: number }>>(STORAGE_KEYS.WISHLIST, [
      { userId: 1, productId: 2 },
      { userId: 1, productId: 5 }
    ]);
    return stored.filter(w => w.userId === userId).map(w => w.productId);
  },

  toggle(productId: number, userId: number = 1): boolean {
    const stored = getStored<Array<{ userId: number; productId: number }>>(STORAGE_KEYS.WISHLIST, []);
    const existsIndex = stored.findIndex(w => w.userId === userId && w.productId === productId);
    let isAdded = false;

    if (existsIndex >= 0) {
      stored.splice(existsIndex, 1);
      isAdded = false;
    } else {
      stored.push({ userId, productId });
      isAdded = true;
    }
    setStored(STORAGE_KEYS.WISHLIST, stored);
    return isAdded;
  }
};

// ==========================================
// 6. INVENTORY LOGS (Mapped to inventory_logs)
// ==========================================
export const inventoryService = {
  getLogs(): InventoryLog[] {
    return getStored<InventoryLog[]>(STORAGE_KEYS.INVENTORY_LOGS, [
      {
        id: 1,
        variantId: 101,
        type: 'import',
        quantityChanged: 20,
        previousStock: 0,
        newStock: 20,
        referenceId: 'PO-20261028-01',
        createdBy: 2,
        createdAt: '2026-10-28T08:00:00Z'
      }
    ]);
  },

  addLog(log: InventoryLog): void {
    const logs = this.getLogs();
    logs.unshift(log);
    setStored(STORAGE_KEYS.INVENTORY_LOGS, logs);
  }
};
// Bổ sung API Service gọi PHP Backend
const API_BASE_URL = 'http://localhost/TechMart/Backend/api';

interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  specifications: Record<string, string | number> | null;
  brand_id?: number | string | null;
  brand_name?: string | null;
  brand_slug?: string | null;
  brand_logo?: string | null;
  category_id?: number | string | null;
  category_name?: string | null;
  category_slug?: string | null;
  is_flash_sale?: number | string | null;
  flash_sale_start_time?: string | null;
  flash_sale_end_time?: string | null;
  price: string | number | null;
  compare_price: string | number | null;
  total_stock: string | number | null;
  thumbnail: string | null;
  variant_id: number | null;
};

interface ApiListResponse<T> {
  status: string;
  data: T[];
  message?: string;
}

async function fetchApiList<T>(endpoint: string): Promise<T[]> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`);
  if (!response.ok) {
    throw new Error(`PHP API ${endpoint} trả về HTTP ${response.status}`);
  }

  const result = await response.json() as ApiListResponse<T>;
  if (result.status !== 'success' || !Array.isArray(result.data)) {
    throw new Error(result.message || `PHP API ${endpoint} trả về dữ liệu không hợp lệ`);
  }
  return result.data;
}

function normalizeCatalogValue(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase() || '';
}

function mapApiProduct(
  item: ApiProduct,
  brands: Brand[] = [],
  categories: Category[] = []
): Product {
  const matchedBrand = brands.find(brand =>
    (item.brand_id != null && Number(item.brand_id) === brand.id)
    || normalizeCatalogValue(item.brand_name) === normalizeCatalogValue(brand.name)
    || normalizeCatalogValue(item.brand_slug) === normalizeCatalogValue(brand.slug)
  );
  const matchedCategory = categories.find(category =>
    (item.category_id != null && Number(item.category_id) === category.id)
    || normalizeCatalogValue(item.category_name) === normalizeCatalogValue(category.name)
    || normalizeCatalogValue(item.category_slug) === normalizeCatalogValue(category.slug)
  );
  const brandId = Number(item.brand_id) || matchedBrand?.id || 0;
  const categoryId = Number(item.category_id) || matchedCategory?.id || 0;
  const price = Number(item.price) || 0;
  const compareAtPrice = Number(item.compare_price) || undefined;

  return {
    id: Number(item.id),
    name: item.name,
    slug: item.slug,
    brandId,
    categoryId,
    description: item.description || '',
    specifications: item.specifications || {},
    status: 'active',
    brand: {
      id: brandId,
      name: item.brand_name || matchedBrand?.name || 'Chính hãng',
      slug: item.brand_slug || matchedBrand?.slug || '',
      logo: item.brand_logo || matchedBrand?.logo || ''
    },
    category: {
      id: categoryId,
      name: item.category_name || matchedCategory?.name || '',
      slug: item.category_slug || matchedCategory?.slug || ''
    },
    isFeatured: true,
    isFlashSale: Number(item.is_flash_sale) === 1,
    flashSalePrice: Number(item.is_flash_sale) === 1 ? price : undefined,
    flashSaleOriginalPrice: Number(item.is_flash_sale) === 1 ? compareAtPrice : undefined,
    flashSaleStartTime: item.flash_sale_start_time || undefined,
    flashSaleEndTime: item.flash_sale_end_time || undefined,
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    variants: [{
      id: Number(item.variant_id) || Number(item.id) * 100,
      productId: Number(item.id),
      sku: item.slug,
      price,
      compareAtPrice,
      stockQuantity: Number(item.total_stock) || 0,
      attributes: {},
      image: item.thumbnail || ''
    }]
  };
}

export const phpApiService = {
  async getCatalogLookups(): Promise<{ brands: Brand[]; categories: Category[] }> {
    const [brands, categories] = await Promise.all([
      fetchApiList<Brand>('brands.php'),
      fetchApiList<Omit<Category, 'parentId'> & { parent_id?: number | null }>('categories.php')
    ]);
    return {
      brands: brands.map(brand => ({ ...brand, id: Number(brand.id), logo: brand.logo || '' })),
      categories: categories.map(category => ({
        ...category,
        id: Number(category.id),
        parentId: category.parent_id == null ? null : Number(category.parent_id)
      }))
    };
  },

  async getHomeProducts(): Promise<Product[]> {
    try {
      const products = (await fetchApiList<ApiProduct>('products.php')).map(item => mapApiProduct(item));
      products.forEach(product => productService.saveProduct(product));
      return products;
    } catch (error) {
      console.warn("Không thể nối tới PHP API, chuyển sang mockData LocalStorage:", error);
      return [];
    }
  },

  async getCatalogData(): Promise<{ products: Product[]; brands: Brand[]; categories: Category[] }> {
    const [apiProducts, brands, categories] = await Promise.all([
      fetchApiList<ApiProduct>('products.php'),
      fetchApiList<Brand>('brands.php'),
      fetchApiList<Omit<Category, 'parentId'> & { parent_id?: number | null }>('categories.php')
    ]);
    const normalizedBrands = brands.map(brand => ({
      ...brand,
      id: Number(brand.id),
      logo: brand.logo || ''
    }));
    const normalizedCategories = categories.map(category => ({
      ...category,
      id: Number(category.id),
      parentId: category.parent_id == null ? null : Number(category.parent_id)
    }));
    const products = apiProducts.map(item =>
      mapApiProduct(item, normalizedBrands, normalizedCategories)
    );

    if (products.length > 0 && products.every(product => product.categoryId === 0)) {
      throw new Error(
        'products.php chưa trả về category_id/category_name/category_slug. ' +
        'Cập nhật file Backend/api/products.php trong thư mục XAMPP/htdocs.'
      );
    }

    products.forEach(product => productService.saveProduct(product));

    return {
      products,
      brands: normalizedBrands,
      categories: normalizedCategories
    };
  }
};

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

export interface SellerMetrics {
  product_count: number;
  stock_count: number;
  low_stock_count: number;
  order_count: number;
  pending_count: number;
  confirmed_count: number;
  shipping_count: number;
  delivered_count: number;
  revenue: number;
  top_products: Array<{
    id: number;
    name: string;
    sku: string;
    sold_count: number;
    revenue: number;
    stock_quantity: number;
  }>;
}

async function sellerRequest<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: options.method || 'GET',
    credentials: 'include',
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const result = await response.json() as { status: string; data?: T; user?: T; message?: string };
  if (!response.ok || result.status !== 'success') {
    throw new Error(result.message || `Seller API trả về HTTP ${response.status}`);
  }
  if ('user' in result) return result.user as T;
  return result.data as T;
}

export const sellerApiService = {
  async login(email: string, password: string): Promise<User> {
    return sellerRequest<User>('seller_auth.php?action=login', {
      method: 'POST',
      body: { email, password }
    });
  },

  async register(data: {
    name: string;
    shopName: string;
    email: string;
    phone: string;
    address: string;
    category: string;
    password: string;
  }): Promise<User> {
    return sellerRequest<User>('seller_auth.php?action=register', { method: 'POST', body: data });
  },

  async registerCustomer(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<User> {
    return sellerRequest<User>('seller_auth.php?action=register-customer', {
      method: 'POST',
      body: data
    });
  },

  async logout(): Promise<void> {
    await sellerRequest<void>('seller_auth.php?action=logout', { method: 'POST', body: {} });
  },

  async getProducts(): Promise<Product[]> {
    return sellerRequest<Product[]>('seller.php?action=products');
  },

  async createProduct(data: SellerProductInput): Promise<Product> {
    return sellerRequest<Product>('seller.php?action=products', { method: 'POST', body: data });
  },

  async updateProduct(id: number, data: SellerProductInput): Promise<Product> {
    return sellerRequest<Product>(`seller.php?action=products&id=${id}`, { method: 'PUT', body: data });
  },

  async addVariant(productId: number, data: SellerProductInput): Promise<Product> {
    return sellerRequest<Product>(`seller.php?action=variants&productId=${productId}`, {
      method: 'POST',
      body: data
    });
  },

  async deleteProduct(id: number): Promise<void> {
    await sellerRequest<void>(`seller.php?action=products&id=${id}`, { method: 'DELETE' });
  },

  async setFlashSale(data: {
    productId: number;
    enabled: boolean;
    title?: string;
    price?: number;
    stockLimit?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<void> {
    await sellerRequest<void>('seller.php?action=flash-sale', { method: 'POST', body: data });
  },

  async getOrders(): Promise<Order[]> {
    return sellerRequest<Order[]>('seller.php?action=orders');
  },

  async updateOrderStatus(
    id: number,
    status: OrderStatus,
    trackingNumber?: string
  ): Promise<void> {
    await sellerRequest<void>(`seller.php?action=orders&id=${id}`, {
      method: 'PATCH',
      body: { status, trackingNumber }
    });
  },

  async getMetrics(days = 30): Promise<SellerMetrics> {
    return sellerRequest<SellerMetrics>(`seller.php?action=dashboard&days=${days}`);
  },

  async createCustomerOrder(data: {
    items: Array<{ variantId: number; quantity: number }>;
    shippingAddress: Pick<UserAddress, 'recipientName' | 'phone' | 'addressLine' | 'ward' | 'district' | 'city'>;
    paymentMethod: Order['paymentMethod'];
  }): Promise<Order> {
    return sellerRequest<Order>('customer_orders.php?action=create', {
      method: 'POST',
      body: data
    });
  }
};