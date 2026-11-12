import React, { useState } from 'react';
import { Store, Search, Filter, CheckCircle2, XCircle, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';
import { DEMO_USERS } from '../../../../services/mockData/demoUsers';
import type { User, UserStatus } from '../../../../types/auth.types';
import { useToast } from '../../../../contexts/ToastContext';

export const AdminSellersPage: React.FC = () => {
  const initialSellers: User[] = [
    DEMO_USERS.seller,
    DEMO_USERS.seller_pending,
    DEMO_USERS.seller_banned,
    {
      id: 6,
      name: 'Nguyễn Văn Minh (Hacom Store)',
      full_name: 'Nguyễn Văn Minh',
      email: 'hacom@techstore.vn',
      phone: '0901234567',
      role: 'staff',
      status: 'active',
      shopName: 'HACOM Computer Official',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: '2026-02-14',
      created_at: '2026-02-14T08:00:00Z',
    },
    {
      id: 7,
      name: 'Lê Thanh Tùng (PhongVu Tech)',
      full_name: 'Lê Thanh Tùng',
      email: 'phongvu@techno.vn',
      phone: '0918765432',
      role: 'staff',
      status: 'active',
      shopName: 'Phong Vũ Technology Store',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: '2026-03-01',
      created_at: '2026-03-01T10:15:00Z',
    }
  ];

  const [sellers, setSellers] = useState<User[]>(initialSellers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const { showToast } = useToast();

  const handleUpdateStatus = (id: string | number, newStatus: UserStatus) => {
    setSellers(prev =>
      prev.map(s => (s.id === id ? { ...s, status: newStatus } : s))
    );
    if (newStatus === 'active') {
      showToast('Đã phê duyệt và kích hoạt gian hàng thành công!', 'success');
    } else if (newStatus === 'banned') {
      showToast('Đã khóa gian hàng!', 'error');
    } else {
      showToast('Đã chuyển gian hàng về trạng thái tạm ngưng.', 'info');
    }
  };

  const filtered = sellers.filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (s.full_name || s.name).toLowerCase().includes(q);
      const matchShop = (s.shopName || '').toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchPhone = (s.phone || '').includes(q);
      if (!matchName && !matchShop && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  const totalCount = sellers.length;
  const activeCount = sellers.filter(s => s.status === 'active').length;
  const pendingCount = sellers.filter(s => s.status === 'inactive').length;
  const bannedCount = sellers.filter(s => s.status === 'banned').length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-500" />
            <span>Kiểm Duyệt & Quản Lý Gian Hàng (Sellers)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dữ liệu đối tác bán hàng & tài khoản nhân sự quản trị kho LHK Tech
          </p>
        </div>
      </div>

      {/* KPI Figures - Pure Typography, ZERO-BOX */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="text-xs text-slate-500 font-medium">Tổng Gian Hàng</div>
          <div className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">{totalCount}</div>
        </div>

        <div>
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đang Hoạt Động
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-1.5 tracking-tight">{activeCount}</div>
        </div>

        <div>
          <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Chờ Phê Duyệt
          </div>
          <div className="text-3xl font-black text-amber-600 mt-1.5 tracking-tight">{pendingCount}</div>
        </div>

        <div>
          <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Đang Bị Khóa
          </div>
          <div className="text-3xl font-black text-rose-600 mt-1.5 tracking-tight">{bannedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar (Toolbar) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên shop, chủ gian hàng, email, SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white"
          >
            <option value="ALL">Tất cả ({totalCount})</option>
            <option value="active">Đang hoạt động (active)</option>
            <option value="inactive">Chờ phê duyệt (inactive)</option>
            <option value="banned">Bị khóa (banned)</option>
          </select>
        </div>
      </div>

      {/* Sellers Table - Pure Table, NO BOX */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 pr-4">Mã #ID</th>
              <th className="py-2.5 px-4">Tên Gian Hàng</th>
              <th className="py-2.5 px-4">Chủ Sở Hữu</th>
              <th className="py-2.5 px-4">Email & SĐT</th>
              <th className="py-2.5 px-4">Vai Trò</th>
              <th className="py-2.5 px-4">Trạng Thái</th>
              <th className="py-2.5 px-4">Ngày Đăng Ký</th>
              <th className="py-2.5 pl-4 text-right">Thao Tác Duyệt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map(s => {
              const status = s.status || 'active';
              return (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-slate-400">#{s.id}</td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-500" />
                      <span>{s.shopName || 'Gian Hàng Chưa Đặt Tên'}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={s.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-slate-800 font-medium">{s.full_name || s.name}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-700 font-mono text-[11px]">{s.email}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.phone || 'Chưa cập nhật'}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                      {s.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> Đang hoạt động
                      </span>
                    )}
                    {status === 'inactive' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                        <AlertTriangle className="w-3 h-3" /> Chờ phê duyệt
                      </span>
                    )}
                    {status === 'banned' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                        <XCircle className="w-3 h-3" /> Bị khóa
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {s.createdAt || '2026-01-01'}
                  </td>

                  <td className="py-3.5 pl-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {status === 'inactive' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(s.id, 'active')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Duyệt Shop</span>
                        </button>
                      )}
                      {status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(s.id, 'banned')}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Khóa</span>
                        </button>
                      )}
                      {status === 'banned' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(s.id, 'active')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mở khóa</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
