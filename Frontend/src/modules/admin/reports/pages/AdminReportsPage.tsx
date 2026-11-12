import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Download, Search } from 'lucide-react';
import { adminMetricsApi } from '../../../../api';
import type { AdminReport, AdminReportPeriod } from '../../../../api';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

function localDateValue(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const AdminReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<AdminReportPeriod>('month');
  const [date, setDate] = useState(localDateValue);
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminMetricsApi.getMetrics(period, date)
      .then(data => { if (active) setReport(data); })
      .catch(loadError => {
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message : 'Không tải được báo cáo.';
        setError(message);
        showToast(message, 'error');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period, date]);

  const shops = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (report?.shops || []).filter(shop =>
      !query || `${shop.shop_name || ''} ${shop.owner_name}`.toLocaleLowerCase().includes(query)
    );
  }, [report, search]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ['Shop', 'Chủ shop', 'GMV', 'Doanh thu đã giao', 'Số đơn', 'Số đơn đã giao', 'Số đơn hủy'],
      ...shops.map(shop => [
        shop.shop_name || '',
        shop.owner_name,
        String(shop.gmv),
        String(shop.delivered_revenue),
        String(shop.order_count),
        String(shop.delivered_count),
        String(shop.cancelled_count)
      ])
    ];
    const csv = `\uFEFF${rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `lhk-tech-doanh-thu-${period}-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = period === 'day' ? 'Ngày' : period === 'week' ? 'Tuần' : period === 'year' ? 'Năm' : 'Tháng';

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Báo cáo doanh thu toàn sàn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            GMV là tổng giá trị hàng hóa chưa tính phí ship, không bao gồm đơn đã hủy. Doanh thu đã giao chỉ tính đơn hoàn tất.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <select
            value={period}
            onChange={event => setPeriod(event.target.value as AdminReportPeriod)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={exportCsv}
            disabled={!report}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất CSV
          </button>
        </div>
      </header>

      {loading && !report ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
          Đang tổng hợp dữ liệu...
        </div>
      ) : error && !report ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-sm text-rose-700">
          {error}
        </div>
      ) : report && (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              ['GMV toàn sàn', formatCurrencyVN(report.summary.gmv), 'Không gồm đơn hủy'],
              ['Doanh thu đơn đã giao', formatCurrencyVN(report.summary.delivered_revenue), `${report.summary.delivered_count} đơn hoàn tất`],
              ['Số đơn hàng', report.summary.order_count.toLocaleString('vi-VN'), `${report.summary.cancelled_count} đơn hủy`],
              ['Khoảng thời gian', periodLabel, `${report.start.slice(0, 10)} — ${report.end_inclusive}`]
            ].map(([label, value, note]) => (
              <div key={label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-medium text-slate-500">{label}</div>
                <div className="text-xl font-black text-slate-900 mt-2">{value}</div>
                <div className="text-[11px] text-slate-400 mt-1">{note}</div>
              </div>
            ))}
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Doanh thu riêng từng shop</h2>
                <p className="text-[11px] text-slate-500 mt-1">Các đơn được tính theo dòng hàng đã gắn với từng Seller.</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Tìm tên shop..."
                  className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Gian hàng</th>
                    <th className="p-3">Chủ shop</th>
                    <th className="p-3">GMV trong kỳ</th>
                    <th className="p-3">Doanh thu đã giao</th>
                    <th className="p-3">Tổng đơn</th>
                    <th className="p-3">Đã giao</th>
                    <th className="p-3">Đã hủy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shops.map(shop => (
                    <tr key={shop.seller_id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">{shop.shop_name || 'Chưa đặt tên'}</td>
                      <td className="p-3">{shop.owner_name}</td>
                      <td className="p-3">{formatCurrencyVN(shop.gmv)}</td>
                      <td className="p-3 font-semibold text-emerald-600">{formatCurrencyVN(shop.delivered_revenue)}</td>
                      <td className="p-3">{shop.order_count}</td>
                      <td className="p-3">{shop.delivered_count}</td>
                      <td className="p-3">{shop.cancelled_count}</td>
                    </tr>
                  ))}
                  {shops.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        Không có dữ liệu shop trong khoảng thời gian này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Đơn hàng trong kỳ đã chọn</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Mã đơn</th>
                    <th className="p-3">Khách hàng</th>
                    <th className="p-3">Shop</th>
                    <th className="p-3">Tổng thanh toán</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.recent_orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-semibold text-blue-600">{order.order_code}</td>
                      <td className="p-3">{order.customer_name}</td>
                      <td className="p-3">{order.shops || 'Chưa gán Seller'}</td>
                      <td className="p-3 font-medium text-slate-900">{formatCurrencyVN(order.final_amount)}</td>
                      <td className="p-3 capitalize">{order.order_status}</td>
                      <td className="p-3 text-slate-500">{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                  {report.recent_orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">Chưa có đơn hàng.</td>
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
