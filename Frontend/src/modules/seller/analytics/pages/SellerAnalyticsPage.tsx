import React, { useEffect, useState } from 'react';
import { Award, Calendar, DollarSign, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { sellerApiService, type SellerMetrics } from '../../../../services/storageService';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

type Period = '7DAYS' | '30DAYS' | '90DAYS';

export const SellerAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('30DAYS');
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    const days = Number(period.replace('DAYS', ''));
    setLoading(true);
    sellerApiService.getMetrics(days)
      .then(data => { if (active) setMetrics(data); })
      .catch(error => {
        if (active) showToast(error instanceof Error ? error.message : 'Không tải được phân tích Seller.', 'error');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  const cards = metrics ? [
    { title: `Doanh thu đã giao (${period.replace('DAYS', ' ngày')})`, value: formatCurrencyVN(Number(metrics.revenue)), icon: DollarSign },
    { title: 'Tổng đơn hàng', value: String(metrics.order_count), icon: ShoppingBag },
    { title: 'Đơn đã hoàn thành', value: String(metrics.delivered_count), icon: TrendingUp },
    { title: 'Tồn kho hiện tại', value: String(metrics.stock_count), icon: Package }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Hiệu Quả Kinh Doanh & Phân Tích Shop
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Thống kê dựa trên sản phẩm và đơn hàng được gán cho tài khoản Seller.</p>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={period}
            onChange={event => setPeriod(event.target.value as Period)}
            className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-1.5 font-semibold"
          >
            <option value="7DAYS">7 ngày gần nhất</option>
            <option value="30DAYS">30 ngày gần nhất</option>
            <option value="90DAYS">90 ngày gần nhất</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          Đang tổng hợp dữ liệu từ database...
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{card.title}</span>
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2">{card.value}</div>
                </div>
              );
            })}
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sản phẩm theo doanh thu</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b">
                  <tr><th className="py-3 px-4">Tên sản phẩm</th><th>SKU</th><th className="text-center">Đã bán</th><th>Doanh thu</th><th>Tồn kho</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.top_products.length ? metrics.top_products.map(product => (
                    <tr key={`${product.id}-${product.sku}`}>
                      <td className="py-3 px-4 font-bold text-slate-900">{product.name}</td>
                      <td className="font-mono text-slate-500">{product.sku}</td>
                      <td className="text-center font-bold">{product.sold_count}</td>
                      <td className="font-bold text-emerald-700">{formatCurrencyVN(Number(product.revenue))}</td>
                      <td>{product.stock_quantity}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">Chưa có dữ liệu bán hàng trong khoảng thời gian này.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-sm text-red-600">
          Không tải được dữ liệu phân tích.
        </div>
      )}
    </div>
  );
};
