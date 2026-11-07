import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Headphones, 
  ArrowRight, 
  Star, 
  Cpu, 
  Laptop, 
  Smartphone, 
  Monitor, 
  CheckCircle2,
  Heart,
  ShoppingCart
} from 'lucide-react';
import { productService } from '../../../../services/storageService';
import { formatCurrencyVN } from '../../../../utils/format';
import { useCart } from '../../../../contexts/CartContext';
import { useWishlist } from '../../../../contexts/WishlistContext';

export const CustomerHomePage: React.FC = () => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const allProducts = productService.getAll();
  const categories = productService.getCategories();
  const brands = productService.getBrands();

  const flashSaleProducts = allProducts.filter(p => p.isFlashSale);
  const featuredProducts = allProducts.filter(p => p.isFeatured);

  // Flash Sale Countdown Timer synchronized with active sales
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  useEffect(() => {
    const calcTime = () => {
      const activeSaleWithEnd = flashSaleProducts.find(p => p.flashSaleEndTime);
      if (activeSaleWithEnd?.flashSaleEndTime) {
        const diffMs = Math.max(0, new Date(activeSaleWithEnd.flashSaleEndTime).getTime() - Date.now());
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        return { hours, minutes, seconds };
      }
      return null;
    };

    const initial = calcTime();
    if (initial) setTimeLeft(initial);

    const timer = setInterval(() => {
      const calculated = calcTime();
      if (calculated) {
        setTimeLeft(calculated);
      } else {
        setTimeLeft(prev => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
          if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
          return prev;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-10 pb-12">
      {/* 1. Hero Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-8 md:p-12 overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold mb-4 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Đại Tiệc Công Nghệ 2026
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Nâng Tầm Trải Nghiệm <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
                Hiệu Năng Vượt Trội
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed mb-6">
              Sở hữu ngay các dòng laptop gaming RTX 40-series, flagship iPhone 16 Pro Max và linh kiện PC đồ họa chính hãng với ưu đãi giảm tới 30%.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/catalog"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/40 transition-all flex items-center gap-2"
              >
                <span>Khám phá ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/catalog?cat=pc-component"
                className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
              >
                Build PC cấu hình cao
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-20 lg:opacity-40 pointer-events-none flex items-center justify-center">
            <Cpu className="w-96 h-96 text-blue-500" />
          </div>
        </div>
      </section>

      {/* 2. Value Propositions Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">100% Chính Hãng</div>
              <div className="text-[11px] text-slate-500">Phân phối ủy quyền tại VN</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Giao Hỏa Tốc 2H</div>
              <div className="text-[11px] text-slate-500">Miễn phí cho đơn từ 500k</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">1 Đổi 1 Trong 30 Ngày</div>
              <div className="text-[11px] text-slate-500">Nếu phát sinh lỗi từ nhà SX</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Kỹ Thuật 24/7</div>
              <div className="text-[11px] text-slate-500">Tư vấn cấu hình chuyên nghiệp</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tech Categories Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
            Danh Mục Thiết Bị Công Nghệ
          </h2>
          <Link to="/catalog" className="text-xs text-blue-600 font-bold hover:underline">
            Xem tất cả ({categories.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?cat=${cat.slug}`}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500/50 hover:shadow-lg transition-all group text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors mb-3">
                {cat.slug === 'laptop' && <Laptop className="w-5 h-5" />}
                {cat.slug === 'phone' && <Smartphone className="w-5 h-5" />}
                {cat.slug === 'pc-component' && <Cpu className="w-5 h-5" />}
                {cat.slug === 'monitor' && <Monitor className="w-5 h-5" />}
                {cat.slug === 'accessory' && <Headphones className="w-5 h-5" />}
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Flash Sale Tech Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 p-6 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white text-red-600 rounded-xl shadow-md">
                <Flame className="w-6 h-6 fill-red-600" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide">
                  Flash Sale Giờ Vàng
                </h2>
                <div className="text-xs text-rose-100">Giá sốc công nghệ - Số lượng có hạn</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-rose-100">KẾT THÚC TRONG:</span>
              <div className="flex items-center gap-1">
                <span className="px-2.5 py-1.5 rounded-lg bg-slate-950 text-white font-mono text-sm">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="px-2.5 py-1.5 rounded-lg bg-slate-950 text-white font-mono text-sm">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="px-2.5 py-1.5 rounded-lg bg-slate-950 text-white font-mono text-sm">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashSaleProducts.map((p) => {
              const v = p.variants[0];
              const discountPercent = p.flashSaleDiscountPercent ?? (
                v?.compareAtPrice && v.compareAtPrice > v.price
                  ? Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100)
                  : 15
              );
              const salePrice = p.flashSalePrice ?? v?.price ?? 0;
              const origPrice = p.flashSaleOriginalPrice ?? v?.compareAtPrice ?? (salePrice > 0 ? Math.round(salePrice / (1 - discountPercent / 100)) : 0);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-4 text-slate-800 shadow-md flex flex-col justify-between hover:scale-[1.02] transition-transform"
                >
                  <div>
                    <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-100">
                      <img src={v?.image || ''} alt={p.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-black uppercase tracking-wider shadow">
                        -{discountPercent}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">{p.brand?.name}</div>
                    <Link
                      to={`/product/${p.id}`}
                      className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 hover:text-blue-600 block"
                    >
                      {p.name}
                    </Link>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-red-600">
                        {formatCurrencyVN(salePrice)}
                      </span>
                      {origPrice > 0 && origPrice > salePrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrencyVN(origPrice)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Link
                        to={`/product/${p.id}`}
                        className="flex-1 py-2 text-center rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs"
                      >
                        Săn ngay
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Featured Tech Products with Specs Filter */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
              Sản Phẩm Công Nghệ Nổi Bật
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Top thiết bị cấu hình mạnh, bảo hành chính hãng</p>
          </div>
          <Link to="/catalog" className="text-xs font-bold text-blue-600 hover:underline">
            Xem toàn bộ sản phẩm →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProducts.map((p) => {
            const v = p.variants[0];
            const isFav = isInWishlist(p.id);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500/60 p-4 flex flex-col justify-between hover:shadow-xl transition-all group"
              >
                <div>
                  <div className="relative rounded-xl overflow-hidden mb-3 aspect-square bg-slate-50">
                    <img
                      src={v?.image || ''}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => toggleWishlist(p.id, p.name)}
                      className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow ${
                        isFav ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white'
                      }`}
                      title={isFav ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Chính hãng
                    </span>
                  </div>

                  <div className="text-[11px] text-blue-600 font-bold uppercase">{p.brand?.name}</div>
                  <Link
                    to={`/product/${p.id}`}
                    className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-blue-600 transition-colors block"
                  >
                    {p.name}
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="text-xs font-bold text-slate-800 ml-1">{p.rating || 5.0}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">({p.reviewCount || 99} đánh giá)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-blue-600">
                      {formatCurrencyVN(v?.price || 0)}
                    </div>
                    {v?.compareAtPrice && (
                      <div className="text-[10px] text-slate-400 line-through">
                        {formatCurrencyVN(v.compareAtPrice)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => v && addToCart(v.id, 1)}
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors cursor-pointer"
                      title="Thêm vào giỏ hàng"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/product/${p.id}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Official Brand Logos */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6">
          <div className="text-center mb-6">
            <h2 className="text-base font-black text-slate-900">
              Thương Hiệu Công Nghệ Hàng Đầu
            </h2>
            <p className="text-xs text-slate-500 mt-1">Đối tác phân phối trực tiếp và bảo hành chính hãng</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/catalog?q=${encodeURIComponent(brand.name)}`}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-12 h-12 object-cover rounded-full mb-2 filter grayscale group-hover:grayscale-0 transition-all"
                />
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
