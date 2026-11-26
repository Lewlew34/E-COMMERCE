import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';

const DEFAULT_AVATAR = '/avatar-default.svg';

const formatDate = (date?: string) => {
  if (!date) return 'Chưa có thông tin';
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? 'Chưa có thông tin'
    : parsedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const CustomerAccountPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const details = [
    { label: 'Họ và tên', value: user.name || user.full_name || 'Chưa có thông tin', icon: UserRound },
    { label: 'Email', value: user.email || 'Chưa có thông tin', icon: Mail },
    { label: 'Số điện thoại', value: user.phone || 'Chưa có thông tin', icon: Phone },
    { label: 'Loại tài khoản', value: user.role, icon: ShieldCheck },
    { label: 'Ngày tạo tài khoản', value: formatDate(user.createdAt || user.created_at), icon: CalendarDays },
    ...(user.shopAddress ? [{ label: 'Địa chỉ cửa hàng', value: user.shopAddress, icon: MapPin }] : []),
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        Quay lại trang chủ
      </Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white sm:px-8">
          <div className="flex items-center gap-5">
            <img
              src={user.avatar || DEFAULT_AVATAR}
              alt={`Ảnh đại diện ${user.name}`}
              className="h-20 w-20 rounded-full border-4 border-white/80 bg-white object-cover shadow"
            />
            <div>
              <p className="text-sm font-medium text-blue-100">Thông tin tài khoản</p>
              <h1 className="mt-1 text-2xl font-black">{user.name || user.full_name || 'Tài khoản'}</h1>
              <p className="mt-1 text-sm text-blue-100">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          {details.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 break-words text-sm font-bold text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
