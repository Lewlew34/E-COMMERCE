import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { sellerApiService } from '../../../services/storageService';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { loginWithUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Vui lòng nhập đầy đủ Email và Mật khẩu!', 'error');
      return;
    }

    setLoading(true);
    try {
      const databaseUser = await sellerApiService.login(email, password);
      loginWithUser(databaseUser);
      showToast(`Đăng nhập thành công! Chào mừng ${databaseUser.name}`, 'success');

      const roleLower = String(databaseUser.role).toLowerCase();
      if (roleLower === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (roleLower === 'staff' || roleLower === 'seller') navigate('/seller/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (error) {
      const normalizedEmail = email.trim().toLowerCase();
      const isDemoAccount = ['admin@techmart.vn', 'khachhang@techstore.vn'].includes(normalizedEmail);
      if (isDemoAccount && password === '123456') {
        const result = login(email, password);
        if (result.success && result.user) {
          showToast(`Đăng nhập demo thành công! Chào mừng ${result.user.name}`, 'success');
          navigate(String(result.user.role).toLowerCase() === 'admin' ? '/admin/dashboard' : '/', { replace: true });
          setLoading(false);
          return;
        }
      } else {
        showToast(error instanceof Error ? error.message : 'Đăng nhập thất bại.', 'error');
      }
    }
    setLoading(false);
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-7 text-slate-100">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-black text-white">Đăng Nhập Tài Khoản</h2>
        <p className="text-xs text-slate-400 mt-1">
          Truy cập hệ sinh thái thương mại điện tử công nghệ TechMart
        </p>
      </div>

      {/* Form đăng nhập chính quy */}
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
            <Link to="/forgot-password" className="text-xs text-blue-400 hover:underline">
              Quên mật khẩu?
            </Link>
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
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
        >
          <span>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      {/* Thông tin tài khoản mẫu hỗ trợ kiểm thử */}
      <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span>Gợi ý tài khoản kiểm thử:</span>
          <span className="text-[10px] text-slate-500">Bấm để điền nhanh</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => handleFillDemo('admin@techmart.vn')}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left transition-colors border border-slate-700/60 cursor-pointer"
          >
            <div>
              <span className="text-amber-400 font-bold">Admin:</span> admin@techmart.vn
            </div>
            <span className="text-[10px] text-slate-400">Pass: 123456</span>
          </button>

          <button
            type="button"
            onClick={() => { navigate('/seller/register'); }}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left transition-colors border border-slate-700/60 cursor-pointer"
          >
            <div>
              <span className="text-emerald-400 font-bold">Seller:</span> Tạo tài khoản Seller
            </div>
            <span className="text-[10px] text-slate-400">Đăng ký qua SQL</span>
          </button>

          <button
            type="button"
            onClick={() => handleFillDemo('khachhang@techstore.vn')}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left transition-colors border border-slate-700/60 cursor-pointer"
          >
            <div>
              <span className="text-blue-400 font-bold">Khách:</span> khachhang@techstore.vn
            </div>
            <span className="text-[10px] text-slate-400">Pass: 123456</span>
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
