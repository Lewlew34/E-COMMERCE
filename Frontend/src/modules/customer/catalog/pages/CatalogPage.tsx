import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { productService } from '../../../../services/storageService';
import { formatCurrencyVN } from '../../../../utils/format';
import { useCart } from '../../../../contexts/CartContext';
import { useWishlist } from '../../../../contexts/WishlistContext';

export const CatalogPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('cat') || 'ALL';

  const [selectedBrandId, setSelectedBrandId] = useState<number | 'ALL'>('ALL');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(categoryParam);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const allProducts = productService.getAll();
  const brands = productService.getBrands();
  const categories = productService.getCategories();

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategorySlug(categoryParam);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [categoryParam]);

  // Filter products
  const filtered = allProducts.filter(p => {
    // Search query
    if (queryParam) {
      const matchName = p.name ? p.name.toLowerCase().includes(queryParam.toLowerCase()) : false;
      const matchBrand = p.brand?.name ? p.brand.name.toLowerCase().includes(queryParam.toLowerCase()) : false;
      if (!matchName && !matchBrand) return false;
    }

    // Category
    if (selectedCategorySlug !== 'ALL') {
      if (p.category?.slug !== selectedCategorySlug) return false;
    }

    // Brand
    if (selectedBrandId !== 'ALL') {
      if (p.brandId !== selectedBrandId) return false;
    }

    return true;
  });

  // Sort
  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {queryParam ? `Kết quả tìm kiếm cho: "${queryParam}"` : 'Sàn Thiết Bị & Linh Kiện Công Nghệ'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hiển thị <span className="text-blue-600 font-bold">{filtered.length}</span> sản phẩm công nghệ chính hãng sẵn hàng
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Sắp xếp theo:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="default">Phổ biến nhất</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Filter Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Bộ Lọc Sản Phẩm</span>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Danh Mục Công Nghệ
              </h4>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setSelectedCategorySlug('ALL')}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedCategorySlug === 'ALL'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Tất cả danh mục
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      selectedCategorySlug === cat.slug
                        ? 'bg-blue-600 text-white font-bold'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Thương Hiệu
              </h4>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setSelectedBrandId('ALL')}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedBrandId === 'ALL'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Tất cả thương hiệu
                </button>
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrandId(brand.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      selectedBrandId === brand.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Product Grid (9 cols) */}
        <div className="lg:col-span-9">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</h3>
              <p className="text-xs text-slate-400">Vui lòng thử bỏ bớt bộ lọc hoặc tìm kiếm từ khóa khác.</p>
              <button
                onClick={() => { setSelectedBrandId('ALL'); setSelectedCategorySlug('ALL'); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(product => {
                const primaryVariant = product.variants[0];
                const isFav = isInWishlist(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-4 flex flex-col justify-between hover:shadow-xl transition-all group"
                  >
                    <div>
                      {/* Thumbnail & Badges */}
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3 border border-slate-100 flex items-center justify-center">
                        <img
                          src={primaryVariant?.image || ''}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => toggleWishlist(product.id, product.name)}
                          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow transition-colors ${
                            isFav ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white'
                          }`}
                          title={isFav ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                        {product.brand?.name}
                      </div>

                      <Link
                        to={`/product/${product.id}`}
                        className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors mt-1 block"
                      >
                        {product.name}
                      </Link>

                      <div className="flex items-center gap-1.5 mt-2 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span className="text-xs font-bold text-slate-800">{product.rating || 5.0}</span>
                        <span className="text-[10px] text-slate-400">({product.soldCount || 100} đã bán)</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-blue-600">
                          {formatCurrencyVN(primaryVariant?.price || 0)}
                        </div>
                        {primaryVariant?.compareAtPrice && (
                          <div className="text-[10px] text-slate-400 line-through">
                            {formatCurrencyVN(primaryVariant.compareAtPrice)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/product/${product.id}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => primaryVariant && addToCart(primaryVariant.id, 1)}
                          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
                          title="Thêm vào giỏ"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
