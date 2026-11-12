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
    <div className="space-y-6 max-w-7xl">
      <header className="pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-500" />
          Duyệt và quản lý gian hàng
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Chỉ Seller được Admin phê duyệt mới có thể đăng nhập và quản lý shop.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: 'Hồ sơ đang xem', value: sellers.length, icon: Store, color: 'text-slate-900', iconColor: 'text-slate-600' },
          { title: 'Chờ duyệt', value: counts.pending, icon: AlertTriangle, color: 'text-amber-600', iconColor: 'text-amber-500' },
          { title: 'Đã duyệt', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600', iconColor: 'text-emerald-500' },
          { title: 'Đã từ chối / khóa', value: counts.rejected + counts.banned, icon: XCircle, color: 'text-rose-600', iconColor: 'text-rose-500' }
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                {card.title}
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <div className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shadow-xs">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Tìm shop, người đại diện, email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          Trạng thái
          <select
            value={filter}
            onChange={event => setFilter(event.target.value as SellerFilter)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </label>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-3">Shop / ID</th>
                <th className="p-3">Đại diện & liên hệ</th>
                <th className="p-3">Thông tin kinh doanh</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Ngày đăng ký</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">Đang tải hồ sơ...</td>
                </tr>
              ) : filtered.map(seller => (
                <tr key={seller.id} className="align-top hover:bg-slate-50/60">
                  <td className="p-3">
                    <strong className="text-slate-900">{seller.shopName || 'Chưa đặt tên'}</strong>
                    <div className="text-[10px] font-mono text-slate-400">#{seller.id}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-slate-900">{seller.name}</span>
                    <div className="text-slate-500">{seller.email}</div>
                    <div className="text-slate-500">{seller.phone || '—'}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800">{seller.businessCategory || '—'}</div>
                    <div className="max-w-xs text-slate-500">{seller.shopAddress || '—'}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        seller.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : seller.status === 'inactive'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {label(seller.status)}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {seller.status === 'inactive' && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === Number(seller.id)}
                            onClick={() => void handleReview(seller, 'approve')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" /> Duyệt
                          </button>
                          <button
                            type="button"
                            disabled={busyId === Number(seller.id)}
                            onClick={() => void handleReview(seller, 'reject')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 text-rose-700 font-bold cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {seller.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => void handleStatus(seller, 'banned')}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldAlert className="w-3 h-3" /> Khóa shop
                        </button>
                      )}
                      {seller.status === 'banned' && (
                        <button
                          type="button"
                          onClick={() => void handleStatus(seller, 'active')}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold cursor-pointer"
                        >
                          Mở khóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">Không có hồ sơ phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
