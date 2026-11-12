import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  PackageCheck,
  Tags, 
  BarChart3, 
  Settings, 
  Bell,
  Cpu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardPortalLayout, type NavItemConfig } from './DashboardPortalLayout';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItemConfig[] = [
    { name: 'Tổng quan sàn (Dashboard)', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Người dùng', path: '/admin/users', icon: Users },
    { name: 'Duyệt Gian hàng (Sellers)', path: '/admin/sellers', icon: Store },
    { name: 'Duyệt sản phẩm', path: '/admin/products', icon: PackageCheck },
    { name: 'Danh mục & Thông số (Specs)', path: '/admin/categories', icon: Tags },
    { name: 'Báo cáo Doanh thu sàn', path: '/admin/reports', icon: BarChart3 },
    { name: 'Cài đặt hệ thống', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const headerRight = (
    <div className="flex items-center gap-3">
      <button 
        type="button" 
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        title="Thông báo hệ thống"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
      </button>
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Server Status: Ổn định
      </div>
    </div>
  );

  return (
    <DashboardPortalLayout
      portalRole="admin"
      portalBrandTitle="LHK"
      portalBrandHighlight="TECH"
      portalRoleBadge="ADMIN"
      portalRoleBadgeColor="amber"
      portalSubtitle="Admin Portal"
      portalIcon={Cpu}
      navItems={navItems}
      userRoleLabel="Super Admin"
      user={user}
      onLogout={handleLogout}
      headerBreadcrumbPrefix="LHK Tech Admin"
      headerRightSlot={headerRight}
      activeItemColorClass="bg-blue-600 text-white shadow-md shadow-blue-600/30"
    />
  );
};
