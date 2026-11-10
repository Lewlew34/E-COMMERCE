import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  PlusCircle, 
  Store 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sellerApiService } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';
import { DashboardPortalLayout, type NavItemConfig } from './DashboardPortalLayout';

export const SellerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await sellerApiService.logout();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể kết thúc phiên Seller.', 'error');
    }
    logout();
    navigate('/login');
  };

  const navItems: NavItemConfig[] = [
    { name: 'Tổng quan Shop', path: '/seller/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Sản phẩm & Kho', path: '/seller/products', icon: Package },
    { name: 'Xử lý Đơn hàng', path: '/seller/orders', icon: ShoppingBag },
    { name: 'Doanh thu & Phân tích', path: '/seller/analytics', icon: TrendingUp },
  ];

  const sidebarTopSlot = (
    <div className="p-3 space-y-2.5">
      {/* Shop Profile Banner */}
      <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
        <div className="text-xs font-bold text-white truncate">
          {user?.shopName || 'Gian hàng'}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Tài khoản Seller</span>
        </div>
      </div>

      {/* Quick Add Product Button */}
      <button
        type="button"
        onClick={() => navigate('/seller/products')}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
      >
        <PlusCircle className="w-4 h-4 shrink-0" />
        <span>Thêm sản phẩm mới</span>
      </button>
    </div>
  );

  const headerRight = (
    <div className="text-xs text-slate-500">
      Gian hàng: <strong className="text-emerald-700 font-bold">{user?.shopName || 'Chưa cập nhật'}</strong>
    </div>
  );

  return (
    <DashboardPortalLayout
      portalRole="seller"
      portalBrandTitle="LHK"
      portalBrandHighlight="TECH"
      portalRoleBadge="SELLER"
      portalRoleBadgeColor="emerald"
      portalSubtitle="Kênh Người Bán"
      portalIcon={Store}
      navItems={navItems}
      userRoleLabel="Chủ gian hàng"
      user={user}
      onLogout={handleLogout}
      sidebarTopSlot={sidebarTopSlot}
      headerBreadcrumbPrefix="LHK Tech Seller"
      headerRightSlot={headerRight}
      activeItemColorClass="bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
    />
  );
};
