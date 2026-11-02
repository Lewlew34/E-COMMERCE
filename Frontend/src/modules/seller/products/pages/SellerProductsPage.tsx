import React from 'react';
import { Package, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { MOCK_PRODUCTS } from '../../../../services/mockData/techProducts';
import { formatCurrencyVN } from '../../../../utils/format';

export const SellerProductsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" /> Quản Lý Sản Phẩm & Tồn Kho
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Danh sách thiết bị công nghệ đang bán tại gian hàng</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors">
          <PlusCircle className="w-4 h-4" /> Thêm sản phẩm mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Sản Phẩm</th>
                <th className="py-2.5 px-3">Ngành Hàng</th>
                <th className="py-2.5 px-3">Giá Bán</th>
                <th className="py-2.5 px-3">Tồn Kho</th>
                <th className="py-2.5 px-3">Đã Bán</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_PRODUCTS.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 flex items-center gap-3">
                    <img src={p.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                    <div>
                      <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.brand}</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 capitalize text-slate-600">{p.category}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{formatCurrencyVN(p.price)}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {p.stock} cái
                    </span>
                  </td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">{p.soldCount}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                      <button className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
