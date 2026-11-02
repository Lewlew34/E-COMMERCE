import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Store, 
  Clock, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { MOCK_PENDING_SELLERS, MOCK_ORDERS } from '../../../../services/mockData/demoOrders';
import type { PendingSeller } from '../../../../services/mockData/demoOrders';
import { formatCurrencyVN } from '../../../../utils/format';

export const AdminDashboardPage: React.FC = () => {
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>(MOCK_PENDING_SELLERS);

  const handleApproveSeller = (id: string) => {
    setPendingSellers(prev =>
      prev.map(seller => seller.id === id ? { ...seller, status: 'APPROVED' } : seller)
    );
  };

  const handleRejectSeller = (id: string) => {
    setPendingSellers(prev =>
      prev.map(seller => seller.id === id ? { ...seller, status: 'REJECTED' } : seller)
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Quick Alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            Trung Tâm Quản Trị Sàn Thương Mại
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu thống kê doanh số, giao dịch và kiểm duyệt gian hàng công nghệ toàn hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Kỳ báo cáo:</span>
          <select className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none">
            <option>Tháng 11/2026 (Hiện tại)</option>
            <option>Tháng 10/2026</option>
            <option>Quý 4/2026</option>
          </select>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu sàn */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng GMV Toàn Sàn</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            1.485.200.000 ₫
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.5% so với tháng trước</span>
          </div>
        </div>

        {/* Card 2: Đơn hàng */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng Số Đơn Hàng</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            2,840 đơn
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.3% tỷ lệ hoàn thành</span>
          </div>
        </div>

        {/* Card 3: Người dùng */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Người Dùng Đăng Ký</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            14,920
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+420 tài khoản mới tuần này</span>
          </div>
        </div>

        {/* Card 4: Gian hàng active */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gian Hàng Đối Tác</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            186 Shop
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>2 shop đang chờ phê duyệt</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Duyệt Gian Hàng Mới & Phân Bổ Doanh Thu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hồ sơ đăng ký mở Shop cần duyệt */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400" />
                Hồ Sơ Đăng Ký Mở Shop Chờ Phê Duyệt
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Kiểm tra thông tin giấy phép & danh mục kinh doanh</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              {pendingSellers.filter(s => s.status === 'PENDING').length} hồ sơ chờ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Tên Gian Hàng</th>
                  <th className="py-2.5 px-3">Đại Diện & Liên Hệ</th>
                  <th className="py-2.5 px-3">Ngành Hàng</th>
                  <th className="py-2.5 px-3">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{seller.shopName}</div>
                      <div className="text-[10px] text-slate-500">{seller.appliedDate}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{seller.ownerName}</div>
                      <div className="text-[10px] text-slate-400">{seller.phone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {seller.category}
                    </td>
                    <td className="py-3 px-3">
                      {seller.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                          Chờ duyệt
                        </span>
                      )}
                      {seller.status === 'APPROVED' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Đã phê duyệt ✓
                        </span>
                      )}
                      {seller.status === 'REJECTED' && (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px]">
                          Từ chối ✕
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {seller.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveSeller(seller.id)}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleRejectSeller(seller.id)}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-red-600/30 text-red-400 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Phân bổ ngành hàng */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Tỷ Trọng Doanh Thu Ngành Hàng</h3>
            <p className="text-xs text-slate-400 mb-4">Số liệu tổng hợp GMV theo danh mục</p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Laptop & MacBook</span>
                  <span className="text-blue-400 font-bold">42% (623.7 Triệu)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Điện Thoại Flagship</span>
                  <span className="text-indigo-400 font-bold">35% (519.8 Triệu)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Linh Kiện PC (VGA, CPU)</span>
                  <span className="text-emerald-400 font-bold">15% (222.7 Triệu)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Màn Hình & Phụ Kiện</span>
                  <span className="text-amber-400 font-bold">8% (118.8 Triệu)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tất cả giao dịch được bảo vệ và giữ tiền ký quỹ Escrow an toàn.</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Các đơn hàng giao dịch mới nhất trên sàn */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Giao Dịch Đơn Hàng Mới Nhất</h3>
          <span className="text-xs text-blue-400 font-semibold cursor-pointer hover:underline">
            Xem toàn bộ đơn hàng →
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Mã Đơn</th>
                <th className="py-2.5 px-3">Khách Hàng</th>
                <th className="py-2.5 px-3">Gian Hàng Bán</th>
                <th className="py-2.5 px-3">Sản Phẩm</th>
                <th className="py-2.5 px-3">Giá Trị</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {MOCK_ORDERS.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-400">{ord.code}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-400">{ord.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-200">{ord.sellerName}</td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                    {ord.items.map(i => i.productName).join(', ')}
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {formatCurrencyVN(ord.totalAmount)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                      {ord.status}
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
