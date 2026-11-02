import React, { useState } from 'react';
import { 
  AlertTriangle, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ArrowUpRight,
  Eye,
  Star
} from 'lucide-react';
import { MOCK_ORDERS } from '../../../../services/mockData/demoOrders';
import { formatCurrencyVN } from '../../../../utils/format';

export const SellerDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const handleUpdateStatus = (orderId: string, nextStatus: 'CONFIRMED' | 'SHIPPING') => {
    setOrders(prev =>
      prev.map(ord => ord.id === orderId ? { ...ord, status: nextStatus } : ord)
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Tổng Quan Tình Hình Gian Hàng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi đơn đặt hàng, quản lý kho linh kiện công nghệ và hiệu quả bán hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm sản phẩm công nghệ</span>
          </button>
        </div>
      </div>

      {/* 1. Việc Cần Làm (To-Do Action List - Trọng tâm của người bán) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          ⚡ Việc Cần Xử Lý Ngay (To-Do List)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Chờ Xác Nhận</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black mt-1 text-amber-600">
              {orders.filter(o => o.status === 'PENDING').length}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Đơn hàng mới từ khách</div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Chờ Giao ĐVVC</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black mt-1 text-blue-600">
              {orders.filter(o => o.status === 'CONFIRMED').length}
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">Cần đóng gói gửi hàng</div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-900">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Sắp Hết Tồn Kho</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black mt-1 text-rose-600">
              2
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5">Cần nhập thêm linh kiện</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Đang Vận Chuyển</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black mt-1 text-emerald-600">
              {orders.filter(o => o.status === 'SHIPPING').length}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Shipper đang giao</div>
          </div>
        </div>
      </div>

      {/* 2. Chỉ Số Hiệu Quả Kinh Doanh Shop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Doanh Thu Hôm Nay</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            71.480.000 ₫
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" /> +24% so với hôm qua
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Lượt Xem Gian Hàng</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            1,850 lượt
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-bold">
            <Eye className="w-3.5 h-3.5" /> +320 khách mới
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Tỷ Lệ Chuyển Đổi</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            3.85%
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            Mức rất tốt cho đồ công nghệ
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Đánh Giá Gian Hàng</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xl font-black text-slate-900">4.9</span>
            <div className="flex text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <span className="text-xs text-slate-400">(480 lượt vote)</span>
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-bold">
            Shop uy tín hàng đầu
          </div>
        </div>
      </div>

      {/* 3. Đơn Hàng Cần Xử Lý Của Shop */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Đơn Hàng Gần Đây Của Gian Hàng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Xác nhận và chuẩn bị hàng gửi cho đơn vị vận chuyển</p>
          </div>
          <span className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer">
            Xem tất cả đơn hàng ({orders.length}) →
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Mã Đơn</th>
                <th className="py-2.5 px-3">Khách Hàng & Địa Chỉ</th>
                <th className="py-2.5 px-3">Sản Phẩm Đặt Mua</th>
                <th className="py-2.5 px-3">Tổng Tiền</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-blue-600">{ord.code}</span>
                    <div className="text-[10px] text-slate-400">{ord.createdAt}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-500 max-w-xs truncate">{ord.shippingAddress}</div>
                  </td>
                  <td className="py-3 px-3">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <img src={item.thumbnail} alt="" className="w-7 h-7 rounded object-cover border border-slate-200" />
                        <span className="font-medium text-slate-800 line-clamp-1">{item.productName} (x{item.quantity})</span>
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {formatCurrencyVN(ord.totalAmount)}
                  </td>
                  <td className="py-3 px-3">
                    {ord.status === 'PENDING' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Chờ xác nhận
                      </span>
                    )}
                    {ord.status === 'CONFIRMED' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                        Đã xác nhận
                      </span>
                    )}
                    {ord.status === 'SHIPPING' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Đang giao hàng
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {ord.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'CONFIRMED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Xác nhận đơn
                      </button>
                    )}
                    {ord.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'SHIPPING')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Bàn giao ĐVVC
                      </button>
                    )}
                    {ord.status === 'SHIPPING' && (
                      <span className="text-xs text-slate-400 font-medium">Đang trên đường giao</span>
                    )}
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
