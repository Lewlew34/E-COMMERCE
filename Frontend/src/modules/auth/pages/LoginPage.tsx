import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Store, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { UserRole } from '../../../types/auth.types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginAs } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Giả lập login theo email hoặc mặc định Customer
    if (email.includes('admin')) {
      loginAs('ADMIN');
      navigate('/admin/dashboard');
    } else if (email.includes('seller')) {
      loginAs('SELLER');
      navigate('/seller/dashboard');
    } else {
      loginAs('CUSTOMER');
      navigate('/');
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    loginAs(role);
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'SELLER') navigate('/seller/dashboard');
    else navigate('/');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-7 text-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white">Đăng Nhập Tài Khoản</h2>
        <p className="text-xs text-slate-400 mt-1">
          Truy cập hệ sinh thái thương mại điện tử công nghệ TechMart
        </p>
      </div>

      {/* Form đăng nhập thông thường */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email hoặc Số điện thoại
          </label>
          <div className="relative">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@techstore.vn"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Mật khẩu
            </label>
            <a href="#" className="text-xs text-blue-400 hover:underline">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>Đăng nhập</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      {/* Demo 1-Click Login Section (Cực kỳ tiện dụng khi phát triển) */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
          ⚡ Đăng nhập nhanh kiểm thử (1-Click Demo)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('CUSTOMER')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 transition-all text-center group cursor-pointer"
          >
            <UserIcon className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Khách hàng</span>
            <span className="text-[10px] text-slate-400">Mua sắm</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('SELLER')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/50 transition-all text-center group cursor-pointer"
          >
            <Store className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Người bán</span>
            <span className="text-[10px] text-slate-400">Quản lý Shop</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('ADMIN')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500/50 transition-all text-center group cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Admin</span>
            <span className="text-[10px] text-slate-400">Quản trị sàn</span>
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 text-center text-xs text-slate-400 space-y-2">
        <div>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-400 font-bold hover:underline">
            Đăng ký khách hàng
          </Link>
        </div>
        <div>
          Bạn muốn bán hàng công nghệ?{' '}
          <Link to="/seller/register" className="text-emerald-400 font-bold hover:underline">
            Đăng ký gian hàng Seller →
          </Link>
        </div>
      </div>
    </div>
  );
};
