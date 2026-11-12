import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  Store,
  Users
} from 'lucide-react';
import { adminMetricsApi, adminModerationApi } from '../../../../api';
import type { AdminReport, AdminReportPeriod } from '../../../../api';
import type { User } from '../../../../types/auth.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

function localDateValue(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const AdminDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<AdminReportPeriod>('month');
  const [date, setDate] = useState(localDateValue);
  const [report, setReport] = useState<AdminReport | null>(null);
  const [pendingSellers, setPendingSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextReport, sellers] = await Promise.all([
        adminMetricsApi.getMetrics(period, date),
        adminModerationApi.getSellers('pending')
      ]);
      setReport(nextReport);
      setPendingSellers(sellers);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu quản trị.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [period, date]);

  const cards = report ? [
    {
      title: 'GMV toàn sàn',
      value: formatCurrencyVN(report.summary.gmv),
      note: 'Đơn không bị hủy, gồm mọi trạng thái',
      icon: DollarSign,
      iconClass: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Doanh thu đã giao',
      value: formatCurrencyVN(report.summary.delivered_revenue),
      note: `${report.summary.delivered_count} đơn hoàn tất`,
      icon: CheckCircle2,
      iconClass: 'text-emerald-600 bg-emerald-50'
    },
    {
      title: 'Đơn hàng trong kỳ',
      value: report.summary.order_count.toLocaleString('vi-VN'),
      note: `${report.summary.cancelled_count} đơn đã hủy`,
      icon: ShoppingBag,
      iconClass: 'text-indigo-600 bg-indigo-50'
    },
    {
      title: 'Hồ sơ chờ duyệt',
      value: report.counts.pending_sellers.toLocaleString('vi-VN'),
      note: `${report.counts.pending_products} sản phẩm chờ duyệt`,
      icon: Clock,
      iconClass: 'text-amber-600 bg-amber-50'
    }
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trung Tâm Quản Trị Sàn Thương Mại</h1>
          <p className="text-xs text-slate-500 mt-1">Doanh thu thực, hiệu quả từng shop và hàng chờ kiểm duyệt.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500" htmlFor="admin-period">Kỳ báo cáo</label>
          <select
            id="admin-period"
            value={period}
            onChange={event => setPeriod(event.target.value as AdminReportPeriod)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading && !report ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
          Đang tải báo cáo từ database...
        </div>
      ) : error && !report ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          {error}
        </div>
      ) : report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>{card.title}</span>
                    <span className={`p-2 rounded-lg ${card.iconClass}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-3">{card.value}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{card.note}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-500" /> Hồ sơ Seller chờ duyệt
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">{pendingSellers.length} hồ sơ cần xem xét</p>
                </div>
                <Link to="/admin/sellers" className="text-xs font-semibold text-blue-600 hover:underline">
                  Mở quản lý Seller
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="p-3">Gian hàng</th>
                      <th className="p-3">Đại diện</th>
                      <th className="p-3">Ngành hàng</th>
                      <th className="p-3">Ngày đăng ký</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSellers.slice(0, 5).map(seller => (
                      <tr key={seller.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-semibold text-slate-900">{seller.shopName || 'Chưa đặt tên'}</td>
                        <td className="p-3">
                          {seller.name}
                          <div className="text-[10px] text-slate-400">{seller.phone}</div>
                        </td>
                        <td className="p-3">{seller.businessCategory || '—'}</td>
                        <td className="p-3 text-slate-500">
                          {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                    {pendingSellers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">Không có hồ sơ đang chờ duyệt.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Kiểm duyệt sản phẩm</h2>
                <PackageCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <span className="text-slate-600">Sản phẩm đang bán</span>
                  <strong className="text-slate-900">{report.counts.published_products}</strong>
                </div>
                <div className="flex justify-between rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <span className="text-amber-800">Chờ duyệt</span>
                  <strong className="text-amber-700">{report.counts.pending_products}</strong>
                </div>
                <Link
                  to="/admin/products"
                  className="block text-center rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 font-bold text-white transition-colors"
                >
                  Duyệt sản phẩm
                </Link>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-500">
                  <span>Khách hàng</span>
                  <span className="font-semibold text-slate-900">
                    <Users className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                    {report.counts.total_customers}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Shop đang hoạt động</span>
                  <span className="font-semibold text-slate-900">{report.counts.active_sellers}</span>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Doanh thu và đơn hàng theo shop</h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kỳ báo cáo: {report.start.slice(0, 10)} – {report.end_inclusive}
                </p>
              </div>
              <Link to="/admin/reports" className="text-xs font-semibold text-blue-600 hover:underline">
                Xem báo cáo chi tiết
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Gian hàng</th>
                    <th className="p-3">GMV trong kỳ</th>
                    <th className="p-3">Doanh thu đã giao</th>
                    <th className="p-3">Tổng đơn</th>
                    <th className="p-3">Đã giao</th>
                    <th className="p-3">Đã hủy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.shops.slice(0, 8).map(shop => (
                    <tr key={shop.seller_id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">{shop.shop_name || shop.owner_name}</td>
                      <td className="p-3">{formatCurrencyVN(shop.gmv)}</td>
                      <td className="p-3 font-semibold text-emerald-600">{formatCurrencyVN(shop.delivered_revenue)}</td>
                      <td className="p-3">{shop.order_count}</td>
                      <td className="p-3">{shop.delivered_count}</td>
                      <td className="p-3">{shop.cancelled_count}</td>
                    </tr>
                  ))}
                  {report.shops.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Chưa có đơn gắn với Seller trong kỳ này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Đơn hàng gần đây trong kỳ
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Mã đơn</th>
                    <th className="p-3">Khách hàng</th>
                    <th className="p-3">Shop</th>
                    <th className="p-3">Giá trị</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.recent_orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-semibold text-blue-600">{order.order_code}</td>
                      <td className="p-3">{order.customer_name}</td>
                      <td className="p-3">{order.shops || 'Chưa gán shop'}</td>
                      <td className="p-3 font-medium text-slate-900">{formatCurrencyVN(order.final_amount)}</td>
                      <td className="p-3 capitalize">{order.order_status}</td>
                      <td className="p-3 text-slate-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                  {report.recent_orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Không có đơn trong kỳ đã chọn.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
