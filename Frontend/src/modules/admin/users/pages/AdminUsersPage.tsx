import React, { useState } from 'react';
import { Users, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { DEMO_USERS } from '../../../../services/mockData/demoUsers';
import type { User, UserRole, UserStatus } from '../../../../types/auth.types';
import { useToast } from '../../../../contexts/ToastContext';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(Object.values(DEMO_USERS));
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | string>('ALL');
  const { showToast } = useToast();

  const handleToggleStatus = (id: string | number) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const nextStatus: UserStatus = u.status === 'banned' ? 'active' : 'banned';
          showToast(`Đã ${nextStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản ${u.name}!`, nextStatus === 'banned' ? 'error' : 'success');
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleChangeRole = (id: string | number, newRole: UserRole) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          showToast(`Đã chuyển vai trò của ${u.name} thành ${newRole}!`, 'info');
          return { ...u, role: newRole };
        }
        return u;
      })
    );
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'ALL' && String(u.role).toLowerCase() !== roleFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.full_name || u.name).toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = (u.phone || '').includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Quản Lý Người Dùng & Phân Quyền (Bảng [users])</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu tài khoản theo schema MSSQL TechEcommerceDB: role (admin, staff, customer) & status (active, inactive, banned)
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email, SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (admin)</option>
            <option value="staff">Nhân sự / Người bán (staff)</option>
            <option value="customer">Khách hàng (customer)</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Mã #ID</th>
                <th className="py-3 px-4">Họ Và Tên (full_name)</th>
                <th className="py-3 px-4">Email (users.email)</th>
                <th className="py-3 px-4">Số Điện Thoại (phone)</th>
                <th className="py-3 px-4">Vai Trò (role)</th>
                <th className="py-3 px-4">Trạng Thái (status)</th>
                <th className="py-3 px-4">Ngày Tạo (created_at)</th>
                <th className="py-3 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map(u => {
                const roleLower = String(u.role).toLowerCase();
                const status = u.status || 'active';
                return (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{u.id}</td>
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <span className="font-bold text-white">{u.full_name || u.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{u.email}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={roleLower === 'seller' ? 'staff' : roleLower}
                        onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border focus:outline-none cursor-pointer ${
                          roleLower === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : roleLower === 'staff' || roleLower === 'seller'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        <option value="admin" className="bg-slate-900 text-amber-400">admin</option>
                        <option value="staff" className="bg-slate-900 text-emerald-400">staff</option>
                        <option value="customer" className="bg-slate-900 text-blue-400">customer</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> active
                        </span>
                      )}
                      {status === 'inactive' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          inactive
                        </span>
                      )}
                      {status === 'banned' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400">
                          <XCircle className="w-3 h-3" /> banned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {u.createdAt || '2026-01-01'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          status === 'banned'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300'
                        }`}
                      >
                        {status === 'banned' ? 'Mở khóa' : 'Khóa nick'}
                      </button>
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
