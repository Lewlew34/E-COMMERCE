import { apiClient } from '../client';
import type { Brand, Category, Product } from '../../types/ecommerce.types';

export interface ApiRawProduct {
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
}

export function mapRawProductToModel(
  item: ApiRawProduct,
  brands: Brand[] = [],
  categories: Category[] = []
): Product {
  const brandId = Number(item.brand_id) || 0;
  const categoryId = Number(item.category_id) || 0;
  const matchedBrand = brands.find(b => b.id === brandId);
  const matchedCat = categories.find(c => c.id === categoryId);

  const price = Number(item.price) || 0;
  const compareAtPrice = Number(item.compare_price) || undefined;
  const isFs = Number(item.is_flash_sale) === 1;

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
      name: item.category_name || matchedCat?.name || '',
      slug: item.category_slug || matchedCat?.slug || ''
    },
    isFeatured: true,
    isFlashSale: isFs,
    flashSalePrice: isFs ? price : undefined,
    flashSaleOriginalPrice: isFs ? compareAtPrice : undefined,
    flashSaleStartTime: item.flash_sale_start_time || undefined,
    flashSaleEndTime: item.flash_sale_end_time || undefined,
    rating: 5.0,
    reviewCount: 24,
    soldCount: 15,
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

export const catalogApi = {
  async getCategories(): Promise<Category[]> {
    interface RawCat {
      id: number;
      name: string;
      slug: string;
      parent_id: number | null;
      description?: string | null;
    }
    const list = await apiClient<RawCat[]>('common/categories.php');
    return list.map(c => ({
      id: Number(c.id),
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id == null ? null : Number(c.parent_id),
      description: c.description || undefined
    }));
  },

  async getBrands(): Promise<Brand[]> {
    interface RawBrand {
      id: number;
      name: string;
      slug: string;
      logo?: string | null;
    }
    const list = await apiClient<RawBrand[]>('common/brands.php');
    return list.map(b => ({
      id: Number(b.id),
      name: b.name,
      slug: b.slug,
      logo: b.logo || ''
    }));
  },

  async getProducts(limit = 50): Promise<Product[]> {
    const [rawProducts, brands, categories] = await Promise.all([
      apiClient<ApiRawProduct[]>(`common/products.php?limit=${limit}`),
      this.getBrands(),
      this.getCategories()
    ]);
    return rawProducts.map(p => mapRawProductToModel(p, brands, categories));
  },

  async getProductDetail(idOrSlug: number | string): Promise<Product | null> {
    const query = typeof idOrSlug === 'number' ? `id=${idOrSlug}` : `slug=${encodeURIComponent(idOrSlug)}`;
    try {
      interface DetailRaw {
        id: number;
        name: string;
        slug: string;
        description: string;
        specifications: Record<string, string | number>;
        brand_id: number;
        brand_name: string;
        brand_slug: string;
        brand_logo: string;
        category_id: number;
        category_name: string;
        category_slug: string;
        variants: Array<{
          id: number;
          productId: number;
          sku: string;
          price: number;
          compareAtPrice: number | null;
          stockQuantity: number;
          attributes: Record<string, string>;
          image: string;
          isFlashSale: boolean;
        }>;
        isFlashSale: boolean;
      }
      const data = await apiClient<DetailRaw>(`common/product_detail.php?${query}`);
      return {
        id: Number(data.id),
        name: data.name,
        slug: data.slug,
        brandId: Number(data.brand_id),
        categoryId: Number(data.category_id),
        description: data.description || '',
        specifications: data.specifications || {},
        status: 'active',
        brand: {
          id: Number(data.brand_id),
          name: data.brand_name || '',
          slug: data.brand_slug || '',
          logo: data.brand_logo || ''
        },
        category: {
          id: Number(data.category_id),
          name: data.category_name || '',
          slug: data.category_slug || ''
        },
        isFeatured: true,
        isFlashSale: data.isFlashSale,
        rating: 5.0,
        reviewCount: 32,
        soldCount: 18,
        variants: data.variants.map(v => ({
          ...v,
          compareAtPrice: v.compareAtPrice ?? undefined
        }))
      };
    } catch (e) {
      console.warn(`Không thể lấy chi tiết sản phẩm ${idOrSlug}:`, e);
      return null;
    }
  }
};
