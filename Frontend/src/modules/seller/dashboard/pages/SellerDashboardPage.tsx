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
    { title: 'Chờ xác nhận', value: metrics?.pending_count ?? 0, icon: Clock, color: 'amber', caption: 'Đơn mới cần xử lý' },
    { title: 'Chờ bàn giao', value: metrics?.confirmed_count ?? 0, icon: Package, color: 'blue', caption: 'Đơn đã duyệt' },
    { title: 'Sắp hết hàng', value: metrics?.low_stock_count ?? 0, icon: AlertTriangle, color: 'rose', caption: 'Sản phẩm còn tối đa 5 món' },
    { title: 'Đang vận chuyển', value: metrics?.shipping_count ?? 0, icon: Truck, color: 'emerald', caption: 'Đơn đang giao' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tổng Quan Tình Hình Gian Hàng</h1>
          <p className="text-xs text-slate-500 mt-0.5">Số liệu được tổng hợp từ database của gian hàng.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/seller/products')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
        >
          <PlusCircle className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          Đang tải báo cáo từ database...
        </div>
      ) : metrics ? (
        <>
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Việc cần xử lý</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {todoCards.map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{card.title}</span><Icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-black mt-1 text-slate-900">{card.value}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{card.caption}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Doanh thu đơn hoàn thành (30 ngày)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{formatCurrencyVN(Number(metrics.revenue))}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500"><ArrowUpRight className="w-3.5 h-3.5" /> Chỉ tính đơn đã giao</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Sản phẩm đang quản lý</div>
              <div className="text-xl font-black text-slate-900 mt-1">{metrics.product_count}</div>
              <div className="text-xs text-slate-500 mt-1">{metrics.stock_count} sản phẩm tồn kho</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Tổng đơn của gian hàng</div>
              <div className="text-xl font-black text-slate-900 mt-1">{metrics.order_count}</div>
              <div className="text-xs text-slate-500 mt-1">{metrics.delivered_count} đơn đã giao</div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Đơn hàng gần đây</h2>
                <p className="text-xs text-slate-500 mt-0.5">Các đơn có sản phẩm thuộc gian hàng</p>
              </div>
              <Link to="/seller/orders" className="text-xs text-emerald-700 font-bold hover:underline">
                Quản lý đơn hàng →
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có đơn hàng Seller trong database.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[10px] uppercase text-slate-500 border-b">
                    <tr><th className="py-2">Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng tiền shop</th><th>Trạng thái</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td className="py-3 font-mono font-bold text-blue-600">{order.orderCode}</td>
                        <td>{order.shippingAddressSnapshot.recipientName}</td>
                        <td>{order.items.length} sản phẩm</td>
                        <td className="font-bold">{formatCurrencyVN(order.finalAmount)}</td>
                        <td className="capitalize">{order.orderStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-sm text-red-600">
          Không tải được dữ liệu Seller.
        </div>
      )}
    </div>
  );
};
