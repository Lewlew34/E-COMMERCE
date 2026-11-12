import React, { type ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, ExternalLink, type LucideIcon } from 'lucide-react';
import type { User } from '../types/auth.types';

export interface NavItemConfig {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

export interface DashboardPortalLayoutProps {
  portalRole: 'admin' | 'seller';
  portalBrandTitle?: string;
  portalBrandHighlight?: string;
  portalRoleBadge: string;
  portalRoleBadgeColor?: 'amber' | 'emerald' | 'blue';
  portalSubtitle: string;
  portalIcon?: LucideIcon;
  navItems: NavItemConfig[];
  userRoleLabel: string;
  user: User | null;
  onLogout: () => void;
  sidebarTopSlot?: ReactNode;
  headerBreadcrumbPrefix: string;
  headerRightSlot?: ReactNode;
  activeItemColorClass?: string;
}

export const DashboardPortalLayout: React.FC<DashboardPortalLayoutProps> = ({
  portalRole,
  portalRoleBadge,
  portalRoleBadgeColor = 'emerald',
  portalSubtitle,
  navItems,
  userRoleLabel,
  user,
  onLogout,
  sidebarTopSlot,
  headerBreadcrumbPrefix,
  headerRightSlot,
  activeItemColorClass = 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
}) => {
  const location = useLocation();

  const badgeColorStyles = {
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }[portalRoleBadgeColor];

  const currentSegment = location.pathname
    .replace(`/${portalRole}/`, '')
    .replace(`/${portalRole}`, '')
    .replace(/-/g, ' ') || 'Dashboard';

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white text-slate-800">
      {/* 1. Sidebar - Fixed full height, header & footer shrink-0, menu flex-1 scrollable */}
      <aside className="w-64 h-full flex flex-col shrink-0 bg-slate-900 text-slate-200 border-r border-slate-800 select-none">
        {/* Brand Header */}
        <div className="shrink-0 p-4 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <img
              src="/logo-lhk-tech-dark.png"
              alt="LHK Tech"
              className="h-9 w-auto object-contain"
            />
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase ${badgeColorStyles}`}>
              {portalRoleBadge}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2.5 flex items-center justify-between">
            <span>{portalSubtitle}</span>
            <span className="text-[10px] text-slate-500 font-mono">LHK v2.0</span>
          </div>
        </div>

        {/* Optional Sub-banner or Quick Action (e.g. Seller shop banner & add product button) */}
        {sidebarTopSlot && (
          <div className="shrink-0">
            {sidebarTopSlot}
          </div>
        )}

        {/* Scrollable Navigation Menu (Cuộn độc lập, không làm trôi footer) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {portalRole === 'admin' ? 'Menu Quản Trị' : 'Quản Lý Gian Hàng'}
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
                    ? activeItemColorClass
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 2. Cố định 100% Footer ở đáy Sidebar - KHÔNG CẦN LƯỚT XUỐNG */}
        <div className="shrink-0 mt-auto border-t border-slate-800 bg-slate-950/80 p-3 space-y-2.5">
          {/* Switch back to Customer Site */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700/80"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Xem sàn thương mại (Khách)</span>
          </Link>

          {/* User Profile Info */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <img
              src={user?.avatar || (portalRole === 'admin' 
                ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100')}
              alt={user?.name || 'User'}
              className={`w-8 h-8 rounded-full border object-cover shrink-0 ${
                portalRole === 'admin' ? 'border-amber-500/50' : 'border-emerald-500/50'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'Tài khoản'}</div>
              <div className={`text-[10px] font-medium truncate ${
                portalRole === 'admin' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {userRoleLabel}
              </div>
            </div>
          </div>

          {/* Nút ĐĂNG XUẤT to rõ ràng, cố định ở đáy, không bao giờ bị cuộn */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header - White, Clean & Fixed */}
        <header className="shrink-0 h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between shadow-2xs z-10">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{headerBreadcrumbPrefix}</span>
            <span>/</span>
            <span className="text-slate-900 font-bold capitalize">
              {currentSegment}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {headerRightSlot}
          </div>
        </header>

        {/* Content Body - Pure White Background & Independent Scrolling */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-white" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
