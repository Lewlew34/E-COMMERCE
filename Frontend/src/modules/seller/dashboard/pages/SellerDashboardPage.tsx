import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Package,
  PlusCircle,
  Truck
} from 'lucide-react';
import { sellerApiService, type SellerMetrics } from '../../../../services/storageService';
import type { Order } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

export const SellerDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([sellerApiService.getMetrics(30), sellerApiService.getOrders()])
      .then(([nextMetrics, nextOrders]) => {
        setMetrics(nextMetrics);
        setOrders(nextOrders.slice(0, 5));
      })
      .catch(error => showToast(error instanceof Error ? error.message : 'Không tải được dữ liệu Seller.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const todoCards = [
    { title: 'Chờ xác nhận', value: metrics?.pending_count ?? 0, icon: Clock, caption: 'Đơn mới cần xử lý' },
    { title: 'Chờ bàn giao', value: metrics?.confirmed_count ?? 0, icon: Package, caption: 'Đơn đã duyệt' },
    { title: 'Sắp hết hàng', value: metrics?.low_stock_count ?? 0, icon: AlertTriangle, caption: 'Sản phẩm còn tối đa 5 món' },
    { title: 'Đang vận chuyển', value: metrics?.shipping_count ?? 0, icon: Truck, caption: 'Đơn đang giao' }
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổng Quan Tình Hình Gian Hàng</h1>
          <p className="text-xs text-slate-400 mt-1">Số liệu được tổng hợp trực tiếp từ database của gian hàng.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/seller/products')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Đang tải dữ liệu từ database...
        </div>
      ) : metrics ? (
        <>
          {/* 1. Việc cần xử lý - Mảng nền thanh lịch gom nhóm, đường kẻ dọc phân cách, KHÔNG CÓ VIỀN HỘP */}
          <div className="bg-slate-50/70 rounded-2xl p-5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Việc cần xử lý
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
              {todoCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className={`${idx !== 0 ? 'sm:pl-6' : ''} ${idx !== todoCards.length - 1 ? 'sm:pr-6' : ''} py-2 sm:py-0`}>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>{card.title}</span>
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">{card.value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">{card.caption}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Chỉ số Doanh số & Tồn kho - Mảng nền thanh lịch, tone màu tối giản */}
          <div className="bg-slate-50/70 rounded-2xl p-5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Hiệu quả kinh doanh
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
              <div className="sm:pr-6 pb-3 sm:pb-0">
                <div className="text-xs font-medium text-slate-500">Doanh thu đơn hoàn thành (30 ngày)</div>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrencyVN(Number(metrics.revenue))}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> Chỉ tính đơn đã giao
                </div>
              </div>
              <div className="sm:px-6 py-3 sm:py-0">
                <div className="text-xs font-medium text-slate-500">Sản phẩm đang quản lý</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.product_count}</div>
                <div className="text-xs text-slate-400 mt-1">{metrics.stock_count} sản phẩm tồn kho</div>
              </div>
              <div className="sm:pl-6 pt-3 sm:pt-0">
                <div className="text-xs font-medium text-slate-500">Tổng đơn của gian hàng</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.order_count}</div>
                <div className="text-xs text-slate-400 mt-1">{metrics.delivered_count} đơn đã giao</div>
              </div>
            </div>
          </div>

          {/* 3. Bảng hiển thị Đơn hàng gần đây - Table Header Strip sạch đẹp */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Đơn hàng gần đây</h2>
                <p className="text-xs text-slate-400 mt-0.5">Các đơn có sản phẩm thuộc gian hàng</p>
              </div>
              <Link to="/seller/orders" className="text-xs text-emerald-600 font-semibold hover:underline">
                Quản lý đơn hàng →
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-xs text-slate-400">Chưa có đơn hàng Seller trong database.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-lg font-semibold">Mã đơn</th>
                      <th className="py-2.5 px-3 font-semibold">Khách hàng</th>
                      <th className="py-2.5 px-3 font-semibold">Sản phẩm</th>
                      <th className="py-2.5 px-3 font-semibold">Tổng tiền shop</th>
                      <th className="py-2.5 px-3 rounded-r-lg font-semibold text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-blue-600">{order.orderCode}</td>
                        <td className="py-3 px-3 text-slate-800">{order.shippingAddressSnapshot.recipientName}</td>
                        <td className="py-3 px-3 text-slate-600">{order.items.length} sản phẩm</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{formatCurrencyVN(order.finalAmount)}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-xs text-red-500">
          Không tải được dữ liệu Seller.
        </div>
      )}
    </div>
  );
};
