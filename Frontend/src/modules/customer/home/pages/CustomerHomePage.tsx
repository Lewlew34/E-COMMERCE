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
  CheckCircle2
} from 'lucide-react';
import { MOCK_PRODUCTS, TECH_CATEGORIES, TECH_BRANDS } from '../../../../services/mockData/techProducts';
import { formatCurrencyVN } from '../../../../utils/format';

export const CustomerHomePage: React.FC = () => {
  // Flash Sale Countdown Timer (Giả lập còn 05 giờ 42 phút 18 giây)
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashSaleProducts = MOCK_PRODUCTS.filter(p => p.isFlashSale);
  const featuredProducts = MOCK_PRODUCTS.filter(p => p.isFeatured);

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

          {/* Decorative graphic background element */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-20 lg:opacity-40 pointer-events-none flex items-center justify-center">
            <Cpu className="w-96 h-96 text-blue-500" />
          </div>
        </div>
      </section>

      {/* 2. Value Proposition Badges */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">100% Chính Hãng</div>
              <div className="text-[11px] text-slate-500">Bảo hành tại TTBH ủy quyền</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Giao Nhanh 2H</div>
              <div className="text-[11px] text-slate-500">Đóng gói chuẩn chống sốc</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Đổi Trả 30 Ngày</div>
              <div className="text-[11px] text-slate-500">Lỗi là đổi mới tức thì</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
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
            Xem tất cả ({TECH_CATEGORIES.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {TECH_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?cat=${cat.key}`}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500/50 hover:shadow-lg transition-all group text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors mb-3">
                {cat.key === 'laptop' && <Laptop className="w-5 h-5" />}
                {cat.key === 'phone' && <Smartphone className="w-5 h-5" />}
                {cat.key === 'pc-component' && <Cpu className="w-5 h-5" />}
                {cat.key === 'monitor' && <Monitor className="w-5 h-5" />}
                {cat.key === 'accessory' && <Headphones className="w-5 h-5" />}
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{cat.description}</p>
              <div className="mt-2 text-[10px] text-blue-600 font-semibold">{cat.productCount}+ sản phẩm</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Flash Sale Tech Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 p-6 text-white shadow-xl">
          {/* Flash Sale Header */}
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

            {/* Countdown timer */}
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

          {/* Flash Sale Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashSaleProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 text-slate-800 shadow-md flex flex-col justify-between hover:scale-[1.02] transition-transform"
              >
                <div>
                  <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-100">
                    <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-black uppercase tracking-wider shadow">
                      -{p.discountPercentage}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">{p.brand}</div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 hover:text-blue-600">
                    {p.name}
                  </h3>

                  {/* Tech Specs Badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.specifications.cpu && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate max-w-[150px]">
                        {p.specifications.cpu}
                      </span>
                    )}
                    {p.specifications.gpu && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium truncate max-w-[150px]">
                        {p.specifications.gpu}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black text-red-600">
                      {formatCurrencyVN(p.price)}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {formatCurrencyVN(p.originalPrice)}
                    </span>
                  </div>

                  {/* Progress bar sold */}
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                      <span>Đã bán {p.soldCount}</span>
                      <span className="text-red-500 font-bold">Còn {p.stock} suất</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Lọc nhanh:</span>
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">Tất cả</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer">Laptop i9/RTX</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer">iPhone 16</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500/60 p-4 flex flex-col justify-between hover:shadow-xl transition-all group"
            >
              <div>
                <div className="relative rounded-xl overflow-hidden mb-3 aspect-square bg-slate-50">
                  <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {p.discountPercentage > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-bold">
                      -{p.discountPercentage}%
                    </span>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Chính hãng
                  </span>
                </div>

                <div className="text-[11px] text-blue-600 font-bold uppercase">{p.brand}</div>
                <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-blue-600 transition-colors">
                  {p.name}
                </h3>

                {/* Technical specs pill list */}
                <div className="mt-2.5 space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl">
                  {p.specifications.cpu && (
                    <div className="truncate"><strong className="text-slate-800">CPU:</strong> {p.specifications.cpu}</div>
                  )}
                  {p.specifications.ram && (
                    <div className="truncate"><strong className="text-slate-800">RAM:</strong> {p.specifications.ram}</div>
                  )}
                  {p.specifications.gpu && (
                    <div className="truncate"><strong className="text-slate-800">VGA:</strong> {p.specifications.gpu}</div>
                  )}
                  {p.specifications.screen && (
                    <div className="truncate"><strong className="text-slate-800">Màn hình:</strong> {p.specifications.screen}</div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="text-xs font-bold text-slate-800 ml-1">{p.rating}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">({p.reviewCount} đánh giá)</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-blue-600">
                    {formatCurrencyVN(p.price)}
                  </div>
                  {p.discountPercentage > 0 && (
                    <div className="text-[10px] text-slate-400 line-through">
                      {formatCurrencyVN(p.originalPrice)}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Mua ngay
                </button>
              </div>
            </div>
          ))}
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {TECH_BRANDS.map((brand) => (
              <div
                key={brand.id}
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
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
