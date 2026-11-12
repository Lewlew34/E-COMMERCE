import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { DEMO_USERS } from '../../../../services/mockData/demoUsers';
import { adminUserApi } from '../../../../api';
import type { User, UserRole, UserStatus } from '../../../../types/auth.types';
import { useToast } from '../../../../contexts/ToastContext';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(Object.values(DEMO_USERS));
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | string>('ALL');
  const { showToast } = useToast();

  useEffect(() => {
    adminUserApi.getUsers()
      .then(dbUsers => {
        if (Array.isArray(dbUsers) && dbUsers.length > 0) {
          setUsers(dbUsers);
        }
      })
      .catch(() => {
        // Fallback về demo users nếu chưa đăng nhập admin trên PHP session
      });
  }, []);

  const handleToggleStatus = async (id: string | number) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    const nextStatus: UserStatus = target.status === 'banned' ? 'active' : 'banned';

    try {
      if (typeof id === 'number') {
        await adminUserApi.updateUserStatus(id, nextStatus);
      }
    } catch {
      // Offline fallback
    }

    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, status: nextStatus } : u))
    );
    showToast(`Đã ${nextStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản ${target.name}!`, nextStatus === 'banned' ? 'error' : 'success');
  };

  const handleChangeRole = async (id: string | number, newRole: UserRole) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    try {
      if (typeof id === 'number') {
        await adminUserApi.updateUserRole(id, newRole);
      }
    } catch {
      // Offline fallback
    }

    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, role: newRole } : u))
    );
    showToast(`Đã chuyển vai trò của ${target.name} thành ${newRole}!`, 'info');
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
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Quản Lý Người Dùng & Phân Quyền</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dữ liệu tài khoản theo schema CSDL: role (admin, staff, customer) & status (active, inactive, banned)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar (Toolbar) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email, SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (admin)</option>
            <option value="staff">Nhân sự / Người bán (staff)</option>
            <option value="customer">Khách hàng (customer)</option>
          </select>
        </div>
      </div>

      {/* Users Table - Pure Table, NO BOX */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 pr-4">Mã #ID</th>
              <th className="py-2.5 px-4">Họ Và Tên</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Số Điện Thoại</th>
              <th className="py-2.5 px-4">Vai Trò</th>
              <th className="py-2.5 px-4">Trạng Thái</th>
              <th className="py-2.5 px-4">Ngày Tạo</th>
              <th className="py-2.5 pl-4 text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map(u => {
              const roleLower = String(u.role).toLowerCase();
              const status = u.status || 'active';
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-slate-400">#{u.id}</td>
                  <td className="py-3.5 px-4 flex items-center gap-2.5">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <span className="font-bold text-slate-900">{u.full_name || u.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{u.email}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{u.phone || '—'}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={roleLower === 'seller' ? 'staff' : roleLower}
                      onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border focus:outline-none cursor-pointer ${
                        roleLower === 'admin'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : roleLower === 'staff' || roleLower === 'seller'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                      <option value="customer">customer</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    {status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> active
                      </span>
                    )}
                    {status === 'inactive' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                        inactive
                      </span>
                    )}
                    {status === 'banned' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                        <XCircle className="w-3 h-3" /> banned
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {u.createdAt || '2026-01-01'}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        status === 'banned'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600'
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
  );
};
