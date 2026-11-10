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
    <div className="space-y-8 max-w-7xl">
      {/* Top Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Trung Tâm Quản Trị Sàn Thương Mại
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dữ liệu thống kê doanh số, giao dịch và kiểm duyệt gian hàng công nghệ toàn hệ thống LHK Tech.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Kỳ báo cáo:</span>
          <select className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500">
            <option>Tháng 11/2026 (Hiện tại)</option>
            <option>Tháng 10/2026</option>
            <option>Quý 4/2026</option>
          </select>
        </div>
      </div>

      {/* 1. KPI Figures - Mảng nền thanh lịch, đường phân cách dọc tinh tế, KHÔNG CÓ VIỀN HỘP */}
      <div className="bg-slate-50/70 rounded-2xl p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/60">
          {/* KPI 1: GMV Toàn Sàn */}
          <div className="lg:pr-6 pb-3 lg:pb-0">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Tổng GMV Toàn Sàn</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1 tracking-tight">
              1.485.200.000 ₫
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.5% so với tháng trước</span>
            </div>
          </div>

          {/* KPI 2: Đơn Hàng */}
          <div className="lg:px-6 py-3 lg:py-0">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Tổng Số Đơn Hàng</span>
              <ShoppingBag className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              2,840 đơn
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>12.3% tỷ lệ hoàn thành</span>
            </div>
          </div>

          {/* KPI 3: Người Dùng */}
          <div className="lg:px-6 py-3 lg:py-0">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Người Dùng Đăng Ký</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              14,920
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+420 tài khoản mới</span>
            </div>
          </div>

          {/* KPI 4: Gian Hàng Đối Tác */}
          <div className="lg:pl-6 pt-3 lg:pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Gian Hàng Đối Tác</span>
              <Store className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              186 Shop
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-700 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>2 shop chờ phê duyệt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Duyệt Gian Hàng & Phân Bổ Doanh Thu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-slate-100">
        {/* Left 2 Cols: Hồ sơ đăng ký mở Shop cần duyệt */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" />
                Hồ Sơ Đăng Ký Mở Shop Chờ Phê Duyệt
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Kiểm tra thông tin giấy phép & danh mục kinh doanh</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
              {pendingSellers.filter(s => s.status === 'PENDING').length} hồ sơ chờ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg font-semibold">Tên Gian Hàng</th>
                  <th className="py-2.5 px-3 font-semibold">Đại Diện & Liên Hệ</th>
                  <th className="py-2.5 px-3 font-semibold">Ngành Hàng</th>
                  <th className="py-2.5 px-3 font-semibold">Trạng Thái</th>
                  <th className="py-2.5 px-3 rounded-r-lg font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{seller.shopName}</div>
                      <div className="text-[10px] text-slate-400">{seller.appliedDate}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800">{seller.ownerName}</div>
                      <div className="text-[10px] text-slate-400">{seller.phone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {seller.category}
                    </td>
                    <td className="py-3 px-3">
                      {seller.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                          Chờ duyệt
                        </span>
                      )}
                      {seller.status === 'APPROVED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Đã phê duyệt ✓
                        </span>
                      )}
                      {seller.status === 'REJECTED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Từ chối ✕
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {seller.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApproveSeller(seller.id)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-colors cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectSeller(seller.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Phân bổ ngành hàng - Màu sắc đồng bộ Blue/Slate */}
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tỷ Trọng Doanh Thu Ngành Hàng</h3>
            <p className="text-xs text-slate-400 mb-4">Số liệu tổng hợp GMV theo danh mục</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">Laptop & MacBook</span>
                  <span className="text-blue-600 font-bold">42% (623.7 Triệu)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">Điện Thoại Flagship</span>
                  <span className="text-blue-500 font-bold">35% (519.8 Triệu)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">Linh Kiện PC (VGA, CPU)</span>
                  <span className="text-slate-700 font-bold">15% (222.7 Triệu)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-500 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">Màn Hình & Phụ Kiện</span>
                  <span className="text-slate-600 font-bold">8% (118.8 Triệu)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-300 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Tất cả giao dịch được bảo vệ và giữ tiền ký quỹ Escrow an toàn.</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Các đơn hàng giao dịch mới nhất trên sàn */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Giao Dịch Đơn Hàng Mới Nhất</h3>
          <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
            Xem toàn bộ đơn hàng →
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg font-semibold">Mã Đơn</th>
                <th className="py-2.5 px-3 font-semibold">Khách Hàng</th>
                <th className="py-2.5 px-3 font-semibold">Gian Hàng Bán</th>
                <th className="py-2.5 px-3 font-semibold">Sản Phẩm</th>
                <th className="py-2.5 px-3 font-semibold">Giá Trị</th>
                <th className="py-2.5 px-3 rounded-r-lg font-semibold text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {MOCK_ORDERS.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">{ord.code}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-400">{ord.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{ord.sellerName}</td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                    {ord.items.map(i => i.productName).join(', ')}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {formatCurrencyVN(ord.totalAmount)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
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
