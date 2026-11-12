import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  PackageCheck,
  Tags, 
  BarChart3, 
  Settings, 
  LogOut, 
  ExternalLink,
  Bell,
  Cpu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Tổng quan sàn (Dashboard)', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Người dùng', path: '/admin/users', icon: Users },
    { name: 'Duyệt Gian hàng (Sellers)', path: '/admin/sellers', icon: Store },
    { name: 'Duyệt sản phẩm', path: '/admin/products', icon: PackageCheck },
    { name: 'Danh mục & Thông số (Specs)', path: '/admin/categories', icon: Tags },
    { name: 'Báo cáo Doanh thu sàn', path: '/admin/reports', icon: BarChart3 },
    { name: 'Cài đặt hệ thống', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* 1. Left Admin Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm tracking-wide text-white flex items-center gap-1.5">
                TECH<span className="text-blue-400">MART</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                  ADMIN
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Platform Portal</div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Quản Trị
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Switch back to Customer Site */}
        <div className="p-3 border-t border-slate-800">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Xem sàn thương mại (Khách)</span>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'}
              alt={user?.name}
              className="w-8 h-8 rounded-full border border-amber-500/40 object-cover"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-amber-400 font-medium">Super Admin</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>TechMart Admin</span>
            <span>/</span>
            <span className="text-white font-medium capitalize">
              {location.pathname.replace('/admin/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Server Status: Ổn định
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-6 overflow-y-auto" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
