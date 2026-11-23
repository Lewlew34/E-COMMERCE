import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ShoppingCart, RefreshCw } from 'lucide-react';

export const OrderFailedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const responseCode = searchParams.get('vnp_ResponseCode') || '24';
  const txnRef = searchParams.get('vnp_TxnRef');

  useEffect(() => {
    if (responseCode && responseCode !== '00') {
      localStorage.setItem('vnpay_failed_flag', responseCode);
      localStorage.setItem('vnpay_failed_at', String(Date.now()));
      if (txnRef) {
        localStorage.setItem('pending_vnpay_order_code', txnRef);
      }
    }
  }, [responseCode, txnRef]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
        <XCircle className="w-16 h-16" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Thanh Toán Thất Bại / Đã Hủy!</h1>
        <p className="text-xs text-slate-500">
          Giao dịch VNPay của bạn đã bị hủy hoặc không thành công (Mã lỗi: {responseCode}). Giỏ hàng vẫn được giữ nguyên để bạn có thể thử lại.
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Link
          to="/checkout"
          className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử lại thanh toán</span>
        </Link>
        <Link
          to="/cart"
          className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Về giỏ hàng</span>
        </Link>
      </div>
    </div>
  );
};