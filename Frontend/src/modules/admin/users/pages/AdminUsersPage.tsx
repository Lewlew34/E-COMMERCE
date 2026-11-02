import React from 'react';
import { Users } from 'lucide-react';
import { DEMO_USERS } from '../../../../services/mockData/demoUsers';

export const AdminUsersPage: React.FC = () => {
  const users = Object.values(DEMO_USERS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Quản Lý Người Dùng & Phân Quyền
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Kiểm soát tài khoản khách hàng, người bán và ban quản trị</p>
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Tài Khoản</th>
                <th className="py-2.5 px-3">Email & SĐT</th>
                <th className="py-2.5 px-3">Vai Trò (Role)</th>
                <th className="py-2.5 px-3">Ngày Gia Nhập</th>
                <th className="py-2.5 px-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3 flex items-center gap-2.5">
                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                    <span className="font-bold text-white">{u.name}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div>{u.email}</div>
                    <div className="text-[10px] text-slate-400">{u.phone}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' :
                      u.role === 'SELLER' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{u.createdAt}</td>
                  <td className="py-3 px-3 text-right">
                    <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium">
                      Phân quyền
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
