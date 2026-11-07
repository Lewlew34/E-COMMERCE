import React, { useState } from 'react';
import { Store, Search, Filter, CheckCircle2, XCircle, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';
import { DEMO_USERS } from '../../../../services/mockData/demoUsers';
import type { User, UserStatus } from '../../../../types/auth.types';
import { useToast } from '../../../../contexts/ToastContext';

export const AdminSellersPage: React.FC = () => {
  // Sellers / Staff list mapped to TechEcommerceDB [users] table
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
      showToast('Đã phê duyệt / kích hoạt gian hàng thành công!', 'success');
    } else if (newStatus === 'banned') {
      showToast('Đã khóa gian hàng!', 'error');
    } else {
      showToast('Đã chuyển gian hàng về trạng thái tạm ngừng.', 'info');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <span>Kiểm Duyệt & Quản Lý Gian Hàng (Sellers)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu đối tác bán hàng & tài khoản nhân sự quản trị kho (Ánh xạ bảng [users] role: staff / seller)
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold">Tổng Gian Hàng</div>
          <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đang Hoạt Động
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Chờ Phê Duyệt
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-rose-400 font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Đang Bị Khóa
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1">{bannedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên shop, chủ gian hàng, email, SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">Tất cả ({totalCount})</option>
            <option value="active">Đang hoạt động (active)</option>
            <option value="inactive">Chờ phê duyệt (inactive)</option>
            <option value="banned">Bị khóa (banned)</option>
          </select>
        </div>
      </div>

      {/* Sellers Table mapped to TechEcommerceDB [users] */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Mã #ID</th>
                <th className="py-3 px-4">Tên Gian Hàng (Shop)</th>
                <th className="py-3 px-4">Chủ Sở Hữu (full_name)</th>
                <th className="py-3 px-4">Email & SĐT (users.email/phone)</th>
                <th className="py-3 px-4">Vai Trò (role)</th>
                <th className="py-3 px-4">Trạng Thái (status)</th>
                <th className="py-3 px-4">Ngày Đăng Ký (created_at)</th>
                <th className="py-3 px-4 text-right">Thao Tác Duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map(s => {
                const status = s.status || 'active';
                return (
                  <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* 1. ID */}
                    <td className="py-3 px-4 font-mono text-slate-400">#{s.id}</td>

                    {/* 2. Shop Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                        <span>{s.shopName || 'Gian Hàng Chưa Đặt Tên'}</span>
                      </div>
                    </td>

                    {/* 3. Owner Full Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={s.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border border-slate-700"
                        />
                        <span className="text-white font-semibold">{s.full_name || s.name}</span>
                      </div>
                    </td>

                    {/* 4. Email & Phone */}
                    <td className="py-3 px-4">
                      <div className="text-slate-300 font-mono text-[11px]">{s.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.phone || 'Chưa cập nhật'}</div>
                    </td>

                    {/* 5. Role */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {s.role}
                      </span>
                    </td>

                    {/* 6. Status */}
                    <td className="py-3 px-4">
                      {status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Đang hoạt động
                        </span>
                      )}
                      {status === 'inactive' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Chờ phê duyệt
                        </span>
                      )}
                      {status === 'banned' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> Bị khóa (banned)
                        </span>
                      )}
                    </td>

                    {/* 7. Created At */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {s.createdAt || '2026-01-01'}
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {status === 'inactive' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'active')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Duyệt Shop</span>
                          </button>
                        )}
                        {status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'banned')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>Khóa</span>
                          </button>
                        )}
                        {status === 'banned' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'active')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
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
    </div>
  );
};
