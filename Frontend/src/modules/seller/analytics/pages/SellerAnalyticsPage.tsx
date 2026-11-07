import React, { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Eye, Star, Award, Calendar } from 'lucide-react';
import { formatCurrencyVN } from '../../../../utils/format';

export const SellerAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'7DAYS' | '30DAYS' | '90DAYS'>('30DAYS');

  // Top products sold mapped to TechEcommerceDB [order_items]
  const topProducts = [
    {
      id: 1,
      name: 'Laptop Gaming ASUS ROG Strix G16 (2026)',
      sku: 'G614JIR-N4001W-16GB',
      soldCount: 42,
      revenue: 1553580000,
      rating: 4.9,
      reviews: 128,
      stock: 15,
    },
    {
      id: 2,
      name: 'Apple MacBook Pro 16 inch M3 Max',
      sku: 'MBP16-M3MAX-48GB',
      soldCount: 28,
      revenue: 2239720000,
      rating: 5.0,
      reviews: 94,
      stock: 6,
    },
    {
      id: 3,
      name: 'Card Đồ Họa ASUS ROG Strix GeForce RTX 4080 Super',
      sku: 'ROG-STRIX-RTX4080S-16G',
      soldCount: 35,
      revenue: 1154650000,
      rating: 4.8,
      reviews: 62,
      stock: 10,
    },
    {
      id: 4,
      name: 'Apple iPhone 16 Pro Max 256GB - Titan Sa Mạc',
      sku: 'IP16PM-256GB-DESERT',
      soldCount: 56,
      revenue: 1931440000,
      rating: 4.9,
      reviews: 210,
      stock: 18,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Hiệu Quả Kinh Doanh & Phân Tích Shop</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tổng hợp từ các đơn đặt hàng [orders] và mặt hàng [order_items] của gian hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none shadow-xs font-semibold"
          >
            <option value="7DAYS">7 ngày gần nhất</option>
            <option value="30DAYS">30 ngày qua (Tháng 11/2026)</option>
            <option value="90DAYS">Quý gần nhất</option>
          </select>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Doanh Thu Gian Hàng</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            6.879.390.000 ₫
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+24.8% so với kỳ trước</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tổng Đơn Xuất Kho</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            161 đơn hàng
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Tỷ lệ giao thành công: 98.1%
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Lượt Xem Sản Phẩm</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            28,450 lượt
          </div>
          <div className="text-xs text-indigo-600 font-semibold mt-2">
            Tỷ lệ chuyển đổi: 4.8%
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Đánh Giá Shop</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            4.9 / 5.0
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-2">
            Dựa trên 494 lượt đánh giá
          </div>
        </div>
      </div>

      {/* Top Selling Tech Devices */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Top Thiết Bị Công Nghệ Doanh Số Cao Nhất (order_items)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Sắp xếp theo doanh thu</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tên Thiết Bị</th>
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4 text-center">Đã Bán</th>
                <th className="py-3 px-4">Doanh Thu Đem Lại</th>
                <th className="py-3 px-4">Đánh Giá Sao</th>
                <th className="py-3 px-4">Tồn Kho Hiện Tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {topProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 max-w-sm">{p.name}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 bg-slate-50 rounded px-2">
                    {p.sku}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{p.soldCount} cái</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 font-mono">
                    {formatCurrencyVN(p.revenue)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{p.rating}</span>
                      <span className="text-slate-400 text-[10px]">({p.reviews})</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.stock} cái
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
