import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ShoppingBag, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL, notifyUnauthorizedResponse } from '../../../../api';

interface OrderItem {
  name?: string;
  productNameSnapshot?: string;
  price?: number;
  quantity: number;
  totalPrice?: number;
}

interface Order {
  id: number | string;
  orderCode?: string;
  createdAt?: string;
  amount?: number;
  finalAmount?: number;
  method?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  status?: string;
  transactionId?: string | null;
  items: OrderItem[];
  shippingInfo?: {
    fullName?: string;
    recipientName?: string;
    phone?: string;
    fullAddress?: string;
    address?: string;
    addressLine?: string;
    city?: string;
  };
  shippingAddressSnapshot?: {
    recipientName?: string;
    fullName?: string;
    phone?: string;
    addressLine?: string;
    ward?: string;
    district?: string;
    city?: string;
  };
}

const resolveUserId = (): number | null => {
  try {
    const raw =
      localStorage.getItem('currentUser') ||
      localStorage.getItem('user') ||
      localStorage.getItem('auth_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const id = Number(parsed?.id ?? parsed?.userId ?? parsed?.user_id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
};

const resolveToken = (): string | null => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('auth_token') ||
    null
  );
};

const renderOrderStatusBadge = (order: Order) => {
  const rawStatus = (order.orderStatus || order.status || 'pending').toLowerCase();
  if (rawStatus === 'cancelled' || rawStatus === 'đã hủy') {
    return (
      <span className="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full flex items-center gap-1 border border-red-200">
        <XCircle className="w-3.5 h-3.5" />
        <span>Đã hủy</span>
      </span>
    );
  }
  if (rawStatus === 'shipping' || rawStatus === 'đang vận chuyển') {
    return (
      <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-full flex items-center gap-1 border border-blue-200">
        <Clock className="w-3.5 h-3.5" />
        <span>Đang vận chuyển</span>
      </span>
    );
  }
  if (rawStatus === 'completed' || rawStatus === 'hoàn tất') {
    return (
      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full flex items-center gap-1 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Hoàn tất</span>
      </span>
    );
  }
  return (
    <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-full flex items-center gap-1 border border-amber-200">
      <Clock className="w-3.5 h-3.5" />
      <span>Chờ xác nhận</span>
    </span>
  );
};

const renderPaymentStatusBadge = (paymentStatus?: string) => {
  const normalized = (paymentStatus || 'pending').toLowerCase();
  if (normalized === 'paid') {
    return (
      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full flex items-center gap-1 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Đã thanh toán</span>
      </span>
    );
  }
  if (normalized === 'failed') {
    return (
      <span className="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full flex items-center gap-1 border border-red-200">
        <XCircle className="w-3.5 h-3.5" />
        <span>Thanh toán lỗi</span>
      </span>
    );
  }
  return (
    <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-full flex items-center gap-1 border border-slate-200">
      <Clock className="w-3.5 h-3.5" />
      <span>Chờ thanh toán</span>
    </span>
  );
};

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      setLoading(true);
      try {
        const userId = resolveUserId();
        const token = resolveToken();
        const query = userId ? `&userId=${userId}` : '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/customer/orders.php?action=list${query}`, {
          credentials: 'include',
          headers,
        });
        notifyUnauthorizedResponse(res);
        const json = await res.json();
        const apiList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

        if (active && apiList.length > 0) {
          const sorted = [...apiList].sort((a: Order, b: Order) => Number(b.id) - Number(a.id));
          setOrders(sorted);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Lỗi tải danh sách đơn hàng từ API:', err);
      }

      // Fallback đọc localStorage nếu API chưa có dữ liệu
      try {
        const currentUserStr =
          localStorage.getItem('currentUser') ||
          localStorage.getItem('user') ||
          localStorage.getItem('auth_user') ||
          'default_user';
        const savedOrders = localStorage.getItem(`orders_${currentUserStr}`);
        if (active && savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) {
            setOrders([...parsed].reverse());
          }
        }
      } catch (e) {
        console.error('Lỗi đọc lịch sử đơn hàng localStorage:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Đang tải lịch sử đơn hàng...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Bạn chưa có đơn hàng nào!</h2>
        <p className="text-xs text-slate-500">
          Hãy chọn mua các thiết bị công nghệ ưng ý để trải nghiệm hệ thống nhé.
        </p>
        <Link
          to="/catalog"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg"
        >
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h2 className="text-2xl font-black text-slate-900 border-b pb-4 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-blue-600" />
        <span>Lịch Sử Đơn Hàng Của Tôi</span>
      </h2>

      <div className="space-y-4">
        {orders.map((order, idx) => {
          const displayCode = order.orderCode || order.id;
          const totalMoney = Number(order.finalAmount ?? order.amount ?? 0);
          const payMethod = order.paymentMethod || order.method || 'COD';
          const addr = order.shippingAddressSnapshot || order.shippingInfo || {};
          const receiverName = addr.recipientName || addr.fullName || 'Khách hàng';
          const receiverPhone = addr.phone || '';

          return (
            <div
              key={order.id ?? idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap justify-between items-center border-b pb-3 text-xs gap-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm">Đơn hàng #{displayCode}</span>
                  <p className="text-slate-400 mt-0.5">
                    Ngày đặt:{' '}
                    {new Date(order.createdAt || Date.now()).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {renderPaymentStatusBadge(order.paymentStatus)}
                  {renderOrderStatusBadge(order)}
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item, itemIdx) => {
                  const itemName = item.productNameSnapshot || item.name || 'Sản phẩm';
                  const unitPrice = Number(item.price ?? 0);
                  const lineTotal = Number(item.totalPrice ?? unitPrice * item.quantity);

                  return (
                    <div
                      key={itemIdx}
                      className="py-3 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{itemName}</p>
                        <p className="text-slate-400">Số lượng: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-slate-900">
                        {lineTotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs gap-2">
                <div className="space-y-0.5">
                  <p className="text-slate-500">
                    Thanh toán: <span className="font-medium text-slate-800">{payMethod}</span>
                    {order.transactionId ? (
                      <span className="ml-2 text-emerald-700 font-semibold">
                        (Mã GD: {order.transactionId})
                      </span>
                    ) : null}
                  </p>
                  <p className="text-slate-500">
                    Người nhận:{' '}
                    <span className="font-medium text-slate-800">
                      {receiverName}
                      {receiverPhone ? ` (${receiverPhone})` : ''}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 mr-2">Tổng tiền:</span>
                  <span className="font-black text-blue-600 text-base">
                    {totalMoney.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
