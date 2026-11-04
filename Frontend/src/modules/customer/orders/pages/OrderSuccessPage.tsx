import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Home, Truck } from 'lucide-react';
import { orderService } from '../../../../services/storageService';
import { formatCurrencyVN } from '../../../../utils/format';

export const OrderSuccessPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const order = orderService.getByCode(code || '');

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      {/* Success Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner animate-in zoom-in-75">
        <CheckCircle className="w-10 h-10" />
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-slate-900">
        Đặt Hàng Thành Công!
      </h1>
      <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Cảm ơn bạn đã tin chọn TechMart. Đơn hàng của bạn đã được tiếp nhận và nhân viên kỹ thuật đang đóng gói chuẩn bị giao.
      </p>

      {/* Order Info Card */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-200/90 p-6 text-left space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="text-[11px] text-slate-400">Mã đơn hàng:</div>
            <div className="text-base font-black text-blue-600 font-mono">{code || 'ORD-20261104-DEMO'}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Trạng thái:</div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {order ? order.orderStatus.toUpperCase() : 'PENDING'}
            </span>
          </div>
        </div>

        {order && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 pt-1">
              <div>
                <span className="font-semibold text-slate-800">Người nhận: </span>
                {order.shippingAddressSnapshot.recipientName} ({order.shippingAddressSnapshot.phone})
              </div>
              <div>
                <span className="font-semibold text-slate-800">Địa chỉ giao: </span>
                {order.shippingAddressSnapshot.addressLine}, {order.shippingAddressSnapshot.district}, {order.shippingAddressSnapshot.city}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Thanh toán: </span>
                {order.paymentMethod === 'COD' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản VietQR'}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Tổng thanh toán: </span>
                <span className="text-blue-600 font-extrabold">{formatCurrencyVN(order.finalAmount)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-2">Sản phẩm trong đơn:</div>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-medium line-clamp-1">{item.productNameSnapshot} x {item.quantity}</span>
                    <span className="font-bold text-slate-900">{formatCurrencyVN(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="p-3 bg-blue-50/60 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Thời gian giao dự kiến: <strong>2 - 4 giờ</strong> đối với khu vực nội thành.</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/customer/orders"
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
        >
          <Package className="w-4 h-4" />
          <span>Xem Danh Sách Đơn Hàng</span>
        </Link>
        <Link
          to="/"
          className="px-6 py-3 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Về Trang Chủ</span>
        </Link>
      </div>
    </div>
  );
};
