import React from 'react';
import { Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrencyVN } from '../../../../utils/format';

export const CartPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Giỏ Hàng Công Nghệ</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
            <span>Sản phẩm</span>
            <span>Số lượng & Giá</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100"
                alt="ROG Strix"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Laptop Gaming ASUS ROG Strix G16</h4>
                <div className="text-[11px] text-slate-400">Core i9 / RTX 4070 / 32GB RAM</div>
                <div className="text-xs font-bold text-blue-600 mt-1">{formatCurrencyVN(36990000)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">x1</span>
              <button className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Tóm Tắt Đơn Hàng</h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span className="font-semibold text-slate-900">{formatCurrencyVN(36990000)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span className="text-emerald-600 font-semibold">Miễn phí 2H</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>Tổng thanh toán:</span>
              <span className="text-blue-600 font-black">{formatCurrencyVN(36990000)}</span>
            </div>
          </div>
          <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <span>Tiến hành thanh toán</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Thanh toán an toàn & bảo hành chính hãng
          </div>
        </div>
      </div>
    </div>
  );
};
