import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, CreditCard, ShoppingBag, Download, CheckCircle2 } from 'lucide-react';
import { formatCurrencyVN } from '../../../../utils/format';

export const AdminReportsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

  // Transactions mapped to TechEcommerceDB [orders] & [payments] tables
  const reportOrders = [
    {
      id: 1,
      order_code: 'TECH-20261101-098',
      customer: 'Nguyễn Văn Long',
      total_amount: 36990000,
      shipping_fee: 0,
      final_amount: 36990000,
      payment_method: 'BANK_TRANSFER',
      payment_status: 'paid',
      order_status: 'completed',
      created_at: '2026-11-01 10:30',
    },
    {
      id: 2,
      order_code: 'TECH-20261031-045',
      customer: 'Lê Hoàng Nam',
      total_amount: 39180000,
      shipping_fee: 0,
      final_amount: 39180000,
      payment_method: 'CREDIT_CARD',
      payment_status: 'paid',
      order_status: 'shipping',
      created_at: '2026-10-31 16:15',
    },
    {
      id: 3,
      order_code: 'TECH-20261030-012',
      customer: 'Vũ Thị Mai',
      total_amount: 28990000,
      shipping_fee: 30000,
      final_amount: 29020000,
      payment_method: 'COD',
      payment_status: 'pending',
      order_status: 'confirmed',
      created_at: '2026-10-30 09:20',
    },
    {
      id: 4,
      order_code: 'TECH-20261028-088',
      customer: 'Trần Đình Trọng',
      total_amount: 15490000,
      shipping_fee: 0,
      final_amount: 15490000,
      payment_method: 'BANK_TRANSFER',
      payment_status: 'paid',
      order_status: 'completed',
      created_at: '2026-10-28 14:00',
    },
    {
      id: 5,
      order_code: 'TECH-20261025-003',
      customer: 'Bùi Tiến Dũng',
      total_amount: 44990000,
      shipping_fee: 0,
      final_amount: 44990000,
      payment_method: 'CREDIT_CARD',
      payment_status: 'refunded',
      order_status: 'cancelled',
      created_at: '2026-10-25 11:10',
    },
  ];

  const totalGMV = 1485200000;
  const netRevenue = 1440210000;
  const totalOrders = 2840;
  const completedOrders = 2690;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Báo Cáo Doanh Thu & Chỉ Số Toàn Sàn</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dữ liệu tổng hợp từ các bảng [orders], [payments] và [order_items] trong CSDL LHK Tech
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="MONTH">Tháng 11/2026 (Hiện tại)</option>
            <option value="QUARTER">Quý 4/2026</option>
            <option value="YEAR">Cả năm 2026</option>
          </select>
          <button
            type="button"
            onClick={() => alert('Đang xuất tệp báo cáo Excel/CSV...')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Xuất file</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview - Pure Typography, ZERO-BOX */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-8 border-b border-slate-100">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tổng Giá Trị Giao Dịch (GMV)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
            {formatCurrencyVN(totalGMV)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.5% so với tháng trước</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Thanh Toán Thành Công (Paid)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-600 mt-1.5 tracking-tight">
            {formatCurrencyVN(netRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Tỷ lệ thành công: 97.2%
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Số Lượng Đơn Đặt Hàng</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
            {totalOrders.toLocaleString()} đơn
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            {completedOrders} đơn giao thành công
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Phí Hoa Hồng Sàn Ước Tính</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600 mt-1.5 tracking-tight">
            {formatCurrencyVN(Math.round(totalGMV * 0.05))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Áp dụng mức 5% phí sàn công nghệ
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown - Flat display */}
      <div className="pb-8 border-b border-slate-100">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
          Phân bổ phương thức thanh toán ([payments].[payment_method])
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-800">Chuyển Khoản Ngân Hàng (BANK_TRANSFER)</span>
              <span className="text-emerald-600 font-bold">58%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '58%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-800">Thẻ Tín Dụng / Visa (CREDIT_CARD)</span>
              <span className="text-blue-600 font-bold">32%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '32%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-800">Thanh Toán Khi Nhận (COD)</span>
              <span className="text-amber-600 font-bold">10%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Transaction Log Table - Pure Table, NO BOX */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Giao Dịch Đơn Hàng Gần Đây
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Hiển thị {reportOrders.length} giao dịch mẫu</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 pr-4">Mã Đơn</th>
                <th className="py-2.5 px-4">Khách Hàng</th>
                <th className="py-2.5 px-4">Tổng Hàng</th>
                <th className="py-2.5 px-4">Phí Vận Chuyển</th>
                <th className="py-2.5 px-4">Tổng Thanh Toán</th>
                <th className="py-2.5 px-4">Phương Thức</th>
                <th className="py-2.5 px-4">Thanh Toán</th>
                <th className="py-2.5 px-4">Trạng Thái Đơn</th>
                <th className="py-2.5 pl-4 text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-blue-600 font-bold">{o.order_code}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{o.customer}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">{formatCurrencyVN(o.total_amount)}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{formatCurrencyVN(o.shipping_fee)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{formatCurrencyVN(o.final_amount)}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                      {o.payment_method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {o.payment_status === 'paid' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        ✓ Đã thanh toán
                      </span>
                    )}
                    {o.payment_status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                        Chờ thanh toán
                      </span>
                    )}
                    {o.payment_status === 'refunded' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                        Đã hoàn tiền
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="capitalize font-semibold text-slate-800">{o.order_status}</span>
                  </td>
                  <td className="py-3.5 pl-4 text-right font-mono text-[11px] text-slate-400">{o.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
