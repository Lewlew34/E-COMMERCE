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

  const statusBadge = (status: string) => {
    if (status === 'pending_review') {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Chờ duyệt</span>;
    }
    if (status === 'published') {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Đang bán</span>;
    }
    if (status === 'rejected') {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Đã từ chối</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">{status}</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-emerald-600" />
          Kiểm duyệt sản phẩm
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Xem thông tin sản phẩm và người bán trước khi cho phép hiển thị công khai.
        </p>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shadow-xs">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Tìm tên sản phẩm, SKU hoặc shop..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          Trạng thái
          <select
            value={filter}
            onChange={event => setFilter(event.target.value as ProductFilter)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="pending_review">Chờ duyệt</option>
            <option value="published">Đang bán</option>
            <option value="rejected">Đã từ chối</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Shop / người bán</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3">Giá / tồn</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">Đang tải sản phẩm...</td>
                </tr>
              ) : filtered.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="flex items-center gap-3 min-w-64">
                      <img src={product.image || ''} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                      <div>
                        <strong className="text-slate-900">{product.name}</strong>
                        <div className="text-[10px] text-slate-500">
                          {product.brand_name || '—'} · SKU {product.sku || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-slate-900">{product.shop_name || 'Chưa đặt tên'}</span>
                    <div className="text-slate-500">{product.seller_name || '—'}</div>
                  </td>
                  <td className="p-3">{product.category_name || '—'}</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-900">
                      {product.price === null ? '—' : formatCurrencyVN(product.price)}
                    </span>
                    <div className="text-slate-500">Tồn: {product.stock_quantity}</div>
                  </td>
                  <td className="p-3">{statusBadge(product.status)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(product)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="Xem nội dung"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {product.status === 'pending_review' && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === product.id}
                            onClick={() => void review(product, 'approve')}
                            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 cursor-pointer"
                            title="Duyệt"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === product.id}
                            onClick={() => void review(product, 'reject')}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 disabled:opacity-50 cursor-pointer"
                            title="Từ chối"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">Không có sản phẩm phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs p-4 flex items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <section
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                <p className="text-xs text-slate-500">{selected.shop_name} · {selected.seller_name}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X />
              </button>
            </div>
            {selected.image && (
              <img src={selected.image} alt={selected.name} className="max-h-64 w-full rounded-xl object-contain bg-slate-50 border border-slate-100" />
            )}
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                Thương hiệu: <strong>{selected.brand_name || '—'}</strong>
                <br />
                Danh mục: <strong>{selected.category_name || '—'}</strong>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                SKU: <strong>{selected.sku || '—'}</strong>
                <br />
                Giá: <strong>{selected.price === null ? '—' : formatCurrencyVN(selected.price)}</strong>
                <br />
                Tồn kho: <strong>{selected.stock_quantity}</strong>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{selected.description || 'Chưa có mô tả.'}</p>
            <dl className="grid sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(selected.specifications).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-slate-50 border border-slate-100 p-2 text-slate-700">
                  <dt className="text-slate-500">{key}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            {selected.status === 'pending_review' && (
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => void review(selected, 'reject')}
                  className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold disabled:opacity-50 cursor-pointer"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => void review(selected, 'approve')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 cursor-pointer"
                >
                  Duyệt và đăng bán
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
