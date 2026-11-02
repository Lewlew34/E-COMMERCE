import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '../../../../services/mockData/techProducts';
import { formatCurrencyVN } from '../../../../utils/format';
import { SlidersHorizontal, Star } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filtered = MOCK_PRODUCTS.filter(p => {
    if (selectedBrand !== 'ALL' && !p.brand.includes(selectedBrand)) return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Danh Mục Sản Phẩm Công Nghệ</h1>
          <p className="text-xs text-slate-500 mt-1">Tìm kiếm linh kiện PC, Laptop, Điện thoại thông minh và Gaming Gear</p>
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Hiển thị: <span className="text-blue-600">{filtered.length} sản phẩm</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Bộ lọc bên trái */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 h-fit space-y-6">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Bộ Lọc Thông Số</span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Danh Mục</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              {['ALL', 'laptop', 'phone', 'pc-component', 'monitor', 'accessory'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors capitalize ${
                    selectedCategory === cat ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  {cat === 'ALL' ? 'Tất cả danh mục' : cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Thương Hiệu</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              {['ALL', 'Apple', 'ASUS', 'Samsung'].map(brand => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                    selectedBrand === brand ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  {brand === 'ALL' ? 'Tất cả thương hiệu' : brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lưới sản phẩm */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between hover:shadow-lg transition-all">
                <div>
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-slate-50">
                    <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase">{p.brand}</div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">{p.name}</h3>
                  <div className="flex items-center gap-1 mt-2 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span className="text-xs font-bold text-slate-800">{p.rating}</span>
                    <span className="text-[10px] text-slate-400">({p.soldCount} đã bán)</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-blue-600">{formatCurrencyVN(p.price)}</span>
                  <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">
                    Mua ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
