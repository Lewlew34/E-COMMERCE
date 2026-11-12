import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Filter, Search, ShieldAlert, Store, UserCheck, XCircle } from 'lucide-react';
import { adminModerationApi, adminUserApi } from '../../../../api';
import type { User, UserStatus } from '../../../../types/auth.types';
import { useToast } from '../../../../contexts/ToastContext';

type SellerFilter = 'all' | 'pending' | 'approved' | 'rejected';

export const AdminSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<User[]>([]);
  const [allSellers, setAllSellers] = useState<User[]>([]);
  const [filter, setFilter] = useState<SellerFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadSellers = async () => {
    setLoading(true);
    try {
      const [visible, all] = await Promise.all([
        adminModerationApi.getSellers(filter),
        adminModerationApi.getSellers('all')
      ]);
      setSellers(visible);
      setAllSellers(all);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không tải được hồ sơ Seller.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSellers();
  }, [filter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return sellers;
    return sellers.filter(seller =>
      [seller.shopName, seller.name, seller.email, seller.phone, seller.businessCategory]
        .some(value => value?.toLocaleLowerCase().includes(query))
    );
  }, [sellers, search]);

  const handleReview = async (seller: User, decision: 'approve' | 'reject') => {
    const id = Number(seller.id);
    setBusyId(id);
    try {
      await adminModerationApi.reviewSeller(id, decision);
      showToast(decision === 'approve' ? 'Đã phê duyệt gian hàng.' : 'Đã từ chối hồ sơ Seller.', 'success');
      await loadSellers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không cập nhật được hồ sơ Seller.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatus = async (seller: User, status: UserStatus) => {
    try {
      await adminUserApi.updateUserStatus(Number(seller.id), status);
      showToast(status === 'active' ? 'Đã mở lại gian hàng.' : 'Đã khóa gian hàng.', 'success');
      await loadSellers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không cập nhật được trạng thái.', 'error');
    }
  };

  const counts = {
    pending: allSellers.filter(seller => seller.status === 'inactive').length,
    approved: allSellers.filter(seller => seller.status === 'active').length,
    rejected: allSellers.filter(seller => seller.status === 'rejected').length,
    banned: allSellers.filter(seller => seller.status === 'banned').length
  };

  const label = (status?: string) => {
    if (status === 'inactive') return 'Chờ duyệt';
    if (status === 'active') return 'Đang hoạt động';
    if (status === 'rejected') return 'Đã từ chối';
    if (status === 'banned') return 'Đã khóa';
    return status || '—';
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Store className="w-5 h-5 text-amber-400" />Duyệt và quản lý gian hàng</h1>
        <p className="text-xs text-slate-400 mt-1">Chỉ Seller được Admin phê duyệt mới có thể đăng nhập và quản lý shop.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: 'Hồ sơ đang xem', value: sellers.length, icon: Store, color: 'text-white' },
          { title: 'Chờ duyệt', value: counts.pending, icon: AlertTriangle, color: 'text-amber-300' },
          { title: 'Đã duyệt', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-300' },
          { title: 'Đã từ chối / khóa', value: counts.rejected + counts.banned, icon: XCircle, color: 'text-rose-300' }
        ].map(card => {
          const Icon = card.icon;
          return <div key={card.title} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">{card.title}<Icon className={`w-4 h-4 ${card.color}`} /></div>
            <div className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</div>
          </div>;
        })}
      </div>

      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm shop, người đại diện, email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white" />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400"><Filter className="w-4 h-4" />Trạng thái
          <select value={filter} onChange={event => setFilter(event.target.value as SellerFilter)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2">
            <option value="all">Tất cả</option><option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option><option value="rejected">Đã từ chối</option>
          </select>
        </label>
      </div>

      <section className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr><th className="p-3">Shop / ID</th><th className="p-3">Đại diện & liên hệ</th><th className="p-3">Thông tin kinh doanh</th><th className="p-3">Trạng thái</th><th className="p-3">Ngày đăng ký</th><th className="p-3 text-right">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={6} className="p-10 text-center text-slate-500">Đang tải hồ sơ...</td></tr>
                : filtered.map(seller => (
                  <tr key={seller.id} className="align-top">
                    <td className="p-3"><strong className="text-white">{seller.shopName || 'Chưa đặt tên'}</strong><div className="text-[10px] text-slate-500">#{seller.id}</div></td>
                    <td className="p-3">{seller.name}<div className="text-slate-500">{seller.email}</div><div className="text-slate-500">{seller.phone || '—'}</div></td>
                    <td className="p-3"><div>{seller.businessCategory || '—'}</div><div className="max-w-xs text-slate-500">{seller.shopAddress || '—'}</div></td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-[10px] ${seller.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : seller.status === 'inactive' ? 'bg-amber-500/10 text-amber-300' : 'bg-rose-500/10 text-rose-300'}`}>{label(seller.status)}</span></td>
                    <td className="p-3 text-slate-400">{seller.createdAt ? new Date(seller.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {seller.status === 'inactive' && <>
                          <button disabled={busyId === Number(seller.id)} onClick={() => void handleReview(seller, 'approve')} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold inline-flex items-center gap-1"><UserCheck className="w-3 h-3" />Duyệt</button>
                          <button disabled={busyId === Number(seller.id)} onClick={() => void handleReview(seller, 'reject')} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 disabled:opacity-50 text-rose-300 font-bold">Từ chối</button>
                        </>}
                        {seller.status === 'active' && <button onClick={() => void handleStatus(seller, 'banned')} className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 inline-flex items-center gap-1"><ShieldAlert className="w-3 h-3" />Khóa shop</button>}
                        {seller.status === 'banned' && <button onClick={() => void handleStatus(seller, 'active')} className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300">Mở khóa</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">Không có hồ sơ phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
