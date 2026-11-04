import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  User as UserIcon, 
  ShieldCheck, 
  Truck, 
  Headphones, 
  RefreshCw,
  Cpu,
  Laptop,
  Smartphone,
  Layers,
  LogOut,
  ChevronDown,
  Heart,
  Package
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

export const CustomerLayout: React.FC = () => {
  const { user, role, logout, switchRole } = useAuth();
  const { totalCount } = useCart();
  const { totalWishlistCount } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* 1. Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Chính hãng phân phối
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Giao hỏa tốc 2H nội thành
            </span>
          </div>

          {/* Quick Role Tester Bar (Cực kỳ tiện dụng khi phát triển & demo) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Đang xem với vai trò:</span>
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors text-xs"
              >
                <span>{role === 'ADMIN' ? '👑 Quản Trị Viên (Admin)' : role === 'SELLER' ? '🏪 Người Bán (Seller)' : '👤 Khách Hàng (Customer)'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 text-slate-800 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Chuyển nhanh vai trò (Demo)
                  </div>
                  <button
                    onClick={() => { switchRole('CUSTOMER'); setShowRoleMenu(false); navigate('/'); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 flex items-center justify-between"
                  >
                    <span>Khách Hàng (Customer)</span>
                    {role === 'CUSTOMER' && <span className="text-blue-600 font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => { switchRole('SELLER'); setShowRoleMenu(false); navigate('/seller/dashboard'); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 flex items-center justify-between"
                  >
                    <span>Người Bán (Seller Center)</span>
                    {role === 'SELLER' && <span className="text-blue-600 font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => { switchRole('ADMIN'); setShowRoleMenu(false); navigate('/admin/dashboard'); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 flex items-center justify-between"
                  >
                    <span>Quản Trị Viên (Admin)</span>
                    {role === 'ADMIN' && <span className="text-blue-600 font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {role === 'ADMIN' && (
              <Link to="/admin/dashboard" className="text-amber-400 hover:underline font-semibold ml-2">
                Vào Admin Portal →
              </Link>
            )}
            {role === 'SELLER' && (
              <Link to="/seller/dashboard" className="text-emerald-400 hover:underline font-semibold ml-2">
                Vào Kênh Người Bán →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">TECH<span className="text-blue-600">MART</span></span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">Digital Hub</span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm laptop gaming, iPhone 16, card đồ họa RTX, bàn phím cơ..."
                className="w-full pl-10 pr-24 py-2.5 rounded-full border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow transition-colors"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Yêu thích */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              title="Danh sách yêu thích"
            >
              <div className="relative">
                <Heart className="w-5 h-5 text-slate-700" />
                {totalWishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {totalWishlistCount}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-medium text-slate-600">Yêu thích</span>
            </Link>

            {/* Giỏ hàng */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
              title="Giỏ hàng"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-slate-700" />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow">
                    {totalCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-xs font-medium text-slate-600">Giỏ hàng</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            {/* Tài khoản */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ring-2 ring-blue-500/20">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-800 line-clamp-1">{user.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium">{user.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    </div>
                    <Link
                      to="/customer/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                    >
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>Đơn hàng của tôi</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                    >
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>Sản phẩm yêu thích</span>
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-600 font-semibold text-xs transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>

        {/* Secondary Category Nav */}
        <div className="border-t border-slate-100 bg-slate-50/70 hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 text-xs font-semibold text-slate-600 py-2.5 overflow-x-auto">
            <Link to="/catalog" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700">
              <Layers className="w-4 h-4" /> Tất cả danh mục
            </Link>
            <Link to="/catalog?cat=laptop" className="flex items-center gap-1.5 hover:text-blue-600">
              <Laptop className="w-4 h-4" /> Laptop & MacBook
            </Link>
            <Link to="/catalog?cat=phone" className="flex items-center gap-1.5 hover:text-blue-600">
              <Smartphone className="w-4 h-4" /> Điện thoại & Tablet
            </Link>
            <Link to="/catalog?cat=pc-component" className="flex items-center gap-1.5 hover:text-blue-600">
              <Cpu className="w-4 h-4" /> Linh kiện PC & VGA
            </Link>
            <Link to="/seller/register" className="ml-auto text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1">
              🚀 Trở thành Người bán hàng
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Main Body Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 4. Tech Store Footer */}
      <footer className="bg-slate-900 text-slate-400 text-sm mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white">TECH<span className="text-blue-500">MART</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Sàn thương mại điện tử chuyên biệt các thiết bị công nghệ hàng đầu: Laptop gaming, PC đồ họa, Smartphone chính hãng và phụ kiện cao cấp.
            </p>
            <div className="text-xs text-slate-500">
              Hotline hỗ trợ: <strong className="text-blue-400">1900 8888</strong> (8h00 - 21h30)
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Về TechMart</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Giới thiệu nền tảng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tuyển dụng nhân tài</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hệ thống showroom liên kết</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Chính sách & Hỗ trợ</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Cam kết chính hãng 100%</li>
              <li className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Đổi trả trong 30 ngày</li>
              <li className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-amber-400" /> Miễn phí vận chuyển toàn quốc</li>
              <li className="flex items-center gap-1.5"><Headphones className="w-3.5 h-3.5 text-indigo-400" /> Hỗ trợ kỹ thuật chuyên sâu</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Dành cho đối tác</h4>
            <p className="text-xs text-slate-400 mb-3">
              Mở gian hàng kinh doanh thiết bị công nghệ trên TechMart để tiếp cận hàng triệu khách hàng tiềm năng.
            </p>
            <Link
              to="/seller/register"
              className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow"
            >
              Đăng ký mở gian hàng ngay
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          © 2026 TechMart E-Commerce Platform. Xây dựng bằng React + TypeScript + Tailwind CSS.
        </div>
      </footer>
    </div>
  );
};
