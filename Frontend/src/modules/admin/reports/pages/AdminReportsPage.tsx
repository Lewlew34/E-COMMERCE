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
    link.download = `techmart-doanh-thu-${period}-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = period === 'day' ? 'ngày' : period === 'week' ? 'tuần' : period === 'year' ? 'năm' : 'tháng';

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-400" />Báo cáo doanh thu toàn sàn</h1>
          <p className="text-xs text-slate-400 mt-1">GMV là tổng giá trị hàng hóa chưa tính phí ship, không bao gồm đơn đã hủy. Doanh thu đã giao chỉ tính đơn hoàn tất.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-500" />
          <select value={period} onChange={event => setPeriod(event.target.value as AdminReportPeriod)} className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2">
            <option value="day">Theo ngày</option><option value="week">Theo tuần</option><option value="month">Theo tháng</option><option value="year">Theo năm</option>
          </select>
          <input type="date" value={date} onChange={event => setDate(event.target.value)} className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2" />
          <button onClick={exportCsv} disabled={!report} className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 disabled:opacity-50 px-3 py-2 rounded-lg text-xs text-white"><Download className="w-3.5 h-3.5" />Xuất CSV</button>
        </div>
      </header>

      {loading && !report ? <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-400">Đang tổng hợp dữ liệu...</div>
        : error && !report ? <div className="bg-slate-950 border border-rose-900 rounded-2xl p-8 text-center text-sm text-rose-300">{error}</div>
          : report && <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                ['GMV toàn sàn', formatCurrencyVN(report.summary.gmv), 'Không gồm đơn hủy'],
                ['Doanh thu đơn đã giao', formatCurrencyVN(report.summary.delivered_revenue), `${report.summary.delivered_count} đơn hoàn tất`],
                ['Số đơn hàng', report.summary.order_count.toLocaleString('vi-VN'), `${report.summary.cancelled_count} đơn hủy`],
                ['Khoảng thời gian', periodLabel, `${report.start.slice(0, 10)} — ${report.end_inclusive}`]
              ].map(([label, value, note]) => <div key={label} className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400">{label}</div><div className="text-xl font-black text-white mt-2">{value}</div><div className="text-[11px] text-slate-500 mt-1">{note}</div>
              </div>)}
            </div>

            <section className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div><h2 className="text-sm font-bold text-white">Doanh thu riêng từng shop</h2><p className="text-[11px] text-slate-500 mt-1">Các đơn được tính theo dòng hàng đã gắn với từng Seller.</p></div>
                <div className="relative"><Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên shop..." className="pl-8 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white" /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]"><tr><th className="p-3">Gian hàng</th><th className="p-3">Chủ shop</th><th className="p-3">GMV trong kỳ</th><th className="p-3">Doanh thu đã giao</th><th className="p-3">Tổng đơn</th><th className="p-3">Đã giao</th><th className="p-3">Đã hủy</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">
                    {shops.map(shop => <tr key={shop.seller_id}>
                      <td className="p-3 font-semibold text-white">{shop.shop_name || 'Chưa đặt tên'}</td><td className="p-3">{shop.owner_name}</td>
                      <td className="p-3">{formatCurrencyVN(shop.gmv)}</td><td className="p-3 text-emerald-300">{formatCurrencyVN(shop.delivered_revenue)}</td>
                      <td className="p-3">{shop.order_count}</td><td className="p-3">{shop.delivered_count}</td><td className="p-3">{shop.cancelled_count}</td>
                    </tr>)}
                    {shops.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">Không có dữ liệu shop trong khoảng thời gian này.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800"><h2 className="text-sm font-bold text-white">Đơn hàng trong kỳ đã chọn</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]"><tr><th className="p-3">Mã đơn</th><th className="p-3">Khách hàng</th><th className="p-3">Shop</th><th className="p-3">Tổng thanh toán</th><th className="p-3">Trạng thái</th><th className="p-3">Thời gian</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">
                    {report.recent_orders.map(order => <tr key={order.id}>
                      <td className="p-3 font-mono text-blue-300">{order.order_code}</td><td className="p-3">{order.customer_name}</td><td className="p-3">{order.shops || 'Chưa gán Seller'}</td>
                      <td className="p-3">{formatCurrencyVN(order.final_amount)}</td><td className="p-3 capitalize">{order.order_status}</td><td className="p-3">{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                    </tr>)}
                    {report.recent_orders.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">Chưa có đơn hàng.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>}
    </div>
  );
};
