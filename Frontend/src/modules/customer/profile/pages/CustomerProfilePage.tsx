import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';

export const CustomerProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabel = String(user.role).toLowerCase() === 'customer'
    ? 'Khách hàng'
    : String(user.role).toLowerCase() === 'admin'
      ? 'Quản trị viên'
      : 'Người bán';
  const createdAt = user.createdAt || user.created_at;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600">
        <ArrowLeft className="w-4 h-4" />
        Trở về trang chủ
      </Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/15">
              <UserIcon className="h-9 w-9" />
            </div>
            <div>
              <p className="text-sm text-blue-100">Thông tin tài khoản</p>
              <h1 className="mt-1 text-2xl font-black">{user.name || user.full_name}</h1>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 px-6">
          <div className="flex items-center gap-4 py-5">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-medium text-slate-500">Email</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 py-5">
            <Phone className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-medium text-slate-500">Số điện thoại</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{user.phone || 'Chưa cập nhật'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 py-5">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-medium text-slate-500">Loại tài khoản</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{roleLabel}</p>
            </div>
          </div>
          {createdAt && (
            <div className="py-5">
              <p className="text-xs font-medium text-slate-500">Ngày tham gia</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {new Date(createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
