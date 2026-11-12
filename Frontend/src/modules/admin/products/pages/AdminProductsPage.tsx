import React, { useEffect, useMemo, useState } from 'react';
import { Check, Eye, Filter, PackageCheck, Search, X } from 'lucide-react';
import { adminModerationApi } from '../../../../api';
import type { AdminReviewProduct } from '../../../../api';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

type ProductFilter = 'pending_review' | 'published' | 'rejected' | 'all';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<AdminReviewProduct[]>([]);
  const [filter, setFilter] = useState<ProductFilter>('pending_review');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminReviewProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await adminModerationApi.getProducts(filter));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không tải được sản phẩm cần duyệt.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [filter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return products;
    return products.filter(product =>
      [product.name, product.sku, product.shop_name, product.seller_name, product.brand_name, product.category_name]
        .some(value => value?.toLocaleLowerCase().includes(query))
    );
  }, [products, search]);

  const review = async (product: AdminReviewProduct, decision: 'approve' | 'reject') => {
    setBusyId(product.id);
    try {
      await adminModerationApi.reviewProduct(product.id, decision);
      showToast(decision === 'approve' ? 'Đã duyệt sản phẩm, sản phẩm được đăng lên sàn.' : 'Đã từ chối sản phẩm.', 'success');
      setSelected(null);
      await loadProducts();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không cập nhật được sản phẩm.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><PackageCheck className="w-5 h-5 text-emerald-400" />Kiểm duyệt sản phẩm</h1>
        <p className="text-xs text-slate-400 mt-1">Xem thông tin sản phẩm và người bán trước khi cho phép hiển thị công khai.</p>
      </header>

      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên sản phẩm, SKU hoặc shop..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white" />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400"><Filter className="w-4 h-4" />Trạng thái
          <select value={filter} onChange={event => setFilter(event.target.value as ProductFilter)} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2">
            <option value="pending_review">Chờ duyệt</option><option value="published">Đang bán</option><option value="rejected">Đã từ chối</option><option value="all">Tất cả</option>
          </select>
        </label>
      </div>

      <section className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr><th className="p-3">Sản phẩm</th><th className="p-3">Shop / người bán</th><th className="p-3">Danh mục</th><th className="p-3">Giá / tồn</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={6} className="p-10 text-center text-slate-500">Đang tải sản phẩm...</td></tr>
                : filtered.map(product => (
                  <tr key={product.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-3 min-w-64">
                        <img src={product.image || ''} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-900" />
                        <div><strong className="text-white">{product.name}</strong><div className="text-[10px] text-slate-500">{product.brand_name || '—'} · SKU {product.sku || '—'}</div></div>
                      </div>
                    </td>
                    <td className="p-3">{product.shop_name || 'Chưa đặt tên'}<div className="text-slate-500">{product.seller_name || '—'}</div></td>
                    <td className="p-3">{product.category_name || '—'}</td>
                    <td className="p-3">{product.price === null ? '—' : formatCurrencyVN(product.price)}<div className="text-slate-500">Tồn: {product.stock_quantity}</div></td>
                    <td className="p-3 capitalize">{product.status === 'pending_review' ? 'Chờ duyệt' : product.status}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelected(product)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white" title="Xem nội dung"><Eye className="w-4 h-4" /></button>
                        {product.status === 'pending_review' && <>
                          <button disabled={busyId === product.id} onClick={() => void review(product, 'approve')} className="p-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50" title="Duyệt"><Check className="w-4 h-4" /></button>
                          <button disabled={busyId === product.id} onClick={() => void review(product, 'reject')} className="p-2 rounded-lg bg-rose-600/20 text-rose-300 disabled:opacity-50" title="Từ chối"><X className="w-4 h-4" /></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">Không có sản phẩm phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selected && <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center" onClick={() => setSelected(null)}>
        <section className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 space-y-4" onClick={event => event.stopPropagation()}>
          <div className="flex justify-between gap-4"><div><h2 className="text-lg font-bold text-white">{selected.name}</h2><p className="text-xs text-slate-400">{selected.shop_name} · {selected.seller_name}</p></div><button onClick={() => setSelected(null)} className="text-slate-400"><X /></button></div>
          {selected.image && <img src={selected.image} alt={selected.name} className="max-h-64 w-full rounded-xl object-contain bg-slate-900" />}
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="rounded-lg bg-slate-900 p-3">Thương hiệu: {selected.brand_name || '—'}<br />Danh mục: {selected.category_name || '—'}</div>
            <div className="rounded-lg bg-slate-900 p-3">SKU: {selected.sku || '—'}<br />Giá: {selected.price === null ? '—' : formatCurrencyVN(selected.price)}<br />Tồn kho: {selected.stock_quantity}</div>
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-300">{selected.description || 'Chưa có mô tả.'}</p>
          <dl className="grid sm:grid-cols-2 gap-2 text-xs">{Object.entries(selected.specifications).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-900 p-2 text-slate-300"><dt className="text-slate-500">{key}</dt><dd>{value}</dd></div>)}</dl>
          {selected.status === 'pending_review' && <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button disabled={busyId === selected.id} onClick={() => void review(selected, 'reject')} className="px-4 py-2 rounded-lg bg-rose-600/20 text-rose-300 disabled:opacity-50">Từ chối</button>
            <button disabled={busyId === selected.id} onClick={() => void review(selected, 'approve')} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">Duyệt và đăng bán</button>
          </div>}
        </section>
      </div>}
    </div>
  );
};
