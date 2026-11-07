import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Star, 
  LogOut, 
  ExternalLink,
  PlusCircle,
  Store,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const SellerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Tổng quan Shop', path: '/seller/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Sản phẩm & Kho', path: '/seller/products', icon: Package },
    { name: 'Xử lý Đơn hàng', path: '/seller/orders', icon: ShoppingBag, badge: '3 đơn' },
    { name: 'Doanh thu & Đánh giá', path: '/seller/analytics', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex">
      {/* 1. Left Seller Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                KÊNH NGƯỜI BÁN
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">Seller Center</div>
            </div>
          </div>
        </div>

        {/* Shop Profile Banner */}
        <div className="p-3 bg-slate-800/60 mx-3 mt-3 rounded-xl border border-slate-700/60">
          <div className="text-xs font-bold text-white truncate">
            {user?.shopName || 'GearZone Official Store'}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
              <Star className="w-3 h-3 fill-amber-400" /> 4.9/5.0
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Đã kích hoạt</span>
          </div>
        </div>

        {/* Quick Add Product Button */}
        <div className="px-3 pt-3">
          <button
            onClick={() => navigate('/seller/products')}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm sản phẩm mới</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Quản lý gian hàng
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
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full">
                    {item.badge}
                  </span>
                )}
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
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
              alt={user?.name}
              className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-emerald-400 font-medium">Chủ gian hàng</div>
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

      {/* 2. Main Seller Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Kênh Người Bán</span>
            <span>/</span>
            <span className="text-slate-800 font-bold capitalize">
              {location.pathname.replace('/seller/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>
            <div className="text-xs text-slate-500">
              Gian hàng: <strong className="text-emerald-700">{user?.shopName || 'GearZone Store'}</strong>
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
