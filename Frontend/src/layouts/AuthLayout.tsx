import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Zap, Laptop } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <div className="mb-6 z-10 text-center">
        <Link to="/" className="inline-block group transition-transform hover:scale-105" title="Về trang chủ LHK Tech">
          <img
            src="/logo-lhk-tech-dark.png"
            alt="LHK Tech"
            className="h-14 w-auto object-contain mx-auto drop-shadow-[0_0_18px_rgba(59,130,246,0.3)]"
          />
        </Link>
      </div>

      {/* Outlet for Form (Card) */}
      <div className="w-full max-w-md z-10">
        <Outlet />
      </div>

      {/* Footer features */}
      <div className="mt-8 z-10 flex items-center justify-center gap-6 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Bảo mật thông tin</span>
        <span>•</span>
        <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /> Trải nghiệm mượt mà</span>
        <span>•</span>
        <span className="flex items-center gap-1.5"><Laptop className="w-4 h-4 text-blue-400" /> Hệ sinh thái công nghệ</span>
      </div>
    </div>
  );
};
