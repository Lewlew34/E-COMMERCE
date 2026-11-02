import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Cpu, ShieldCheck, Zap, Laptop } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <div className="mb-6 z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-white">TECH<span className="text-blue-500">MART</span></span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">Digital Hub</span>
          </div>
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
