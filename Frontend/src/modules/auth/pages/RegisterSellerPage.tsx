import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User as UserIcon, Mail, Lock, Phone, MapPin, Tag, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { sellerApiService } from '../../../services/storageService';

export const RegisterSellerPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shopName: '',
    email: '',
    phone: '',
    category: 'Linh Kiện PC & Gaming Gear',
    address: '',
    password: '',
  });
  const { loginWithUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      showToast('Mật khẩu cần tối thiểu 8 ký tự.', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await sellerApiService.register(formData);
      loginWithUser(user);
      showToast('Đăng ký gian hàng thành công.', 'success');
      navigate('/seller/dashboard');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể đăng ký gian hàng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-7 text-slate-100 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
          <Store className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-white">Đăng Ký Mở Gian Hàng Công Nghệ</h2>
        <p className="text-xs text-slate-400 mt-1">
          Trở thành đối tác kinh doanh trên nền tảng TechMart Seller Center
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Tên gian hàng / Thương hiệu (Shop Name) *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              placeholder="Ví dụ: GearZone Computer, TechZone Official..."
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-500"
            />
            <Store className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Người đại diện *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Trần Minh Hoàng"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-500"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Số điện thoại liên hệ *
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-500"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Email kinh doanh *
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seller@gearzone.vn"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-500"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Ngành hàng công nghệ chủ lực
          </label>
          <div className="relative">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              <option value="Laptop & Máy tính đồng bộ">Laptop & Máy tính đồng bộ</option>
              <option value="Linh Kiện PC & Gaming Gear">Linh Kiện PC & Gaming Gear</option>
              <option value="Điện thoại & Thiết bị di động">Điện thoại & Thiết bị di động</option>
              <option value="Màn hình & Thiết bị hiển thị">Màn hình & Thiết bị hiển thị</option>
              <option value="Âm thanh & Phụ kiện công nghệ cao">Âm thanh & Phụ kiện công nghệ cao</option>
            </select>
            <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Địa chỉ kho lấy hàng
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-500"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Mật khẩu quản trị gian hàng
          </label>
          <div className="relative">
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-500"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer mt-4 disabled:opacity-50"
        >
          <span>{loading ? 'Đang đăng ký...' : 'Đăng ký gian hàng'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-slate-400">
        Đã có tài khoản đối tác?{' '}
        <Link to="/login" className="text-emerald-400 font-bold hover:underline">
          Đăng nhập Kênh Người Bán
        </Link>
      </div>
    </div>
  );
};
