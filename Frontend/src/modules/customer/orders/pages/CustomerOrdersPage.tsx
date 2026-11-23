import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { customerOrderApi } from '../../../../api';
import type { Order, OrderStatus } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

const CANCELLED_CODES_STORAGE_KEY = 'cancelled_vnpay_order_codes';

type PaymentState = 'paid' | 'pending' | 'failed';

interface DisplayOrder extends Omit<Order, 'paymentStatus' | 'paymentMethod'> {
  paymentStatus?: PaymentState | string;
  paymentMethod?: string;
  transactionId?: string | null;
}

const normalizeOrderStatus = (rawOrder: any, fallbackStatus?: OrderStatus): OrderStatus => {
  const candidates = [
    rawOrder?.orderStatus,
    rawOrder?.order_status,
    rawOrder?.status,
    rawOrder?.deliveryStatus,
    rawOrder?.delivery_status,
    rawOrder?.fulfillmentStatus,
    rawOrder?.fulfillment_status,
    fallbackStatus
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase().trim());

  for (const val of candidates) {
    if (
      val.includes('cancel') ||
      val.includes('hủy') ||
      val.includes('fail') ||
      val.includes('reject') ||
      val.includes('từ chối')
    ) {
      return 'cancelled';
    }
    if (
      val.includes('deliver') ||
      val.includes('hoàn tất') ||
      val.includes('giao thành công') ||
      val.includes('completed')
    ) {
      return 'delivered';
    }
    if (
      val.includes('ship') ||
      val.includes('giao') ||
      val.includes('vận chuyển') ||
      val.includes('bưu tá') ||
      val.includes('out_for_delivery')
    ) {
      return 'shipping';
    }
    if (
      val.includes('confirm') ||
      val.includes('approved') ||
      val.includes('accept') ||
      val.includes('duyệt') ||
      val.includes('xác nhận')
    ) {
      if (!val.includes('chờ') && !val.includes('pending') && !val.includes('unconfirmed')) {
        return 'confirmed';
      }
    }
  }

  return fallbackStatus || 'pending';
};

const getCurrentUserKey = (): string => {
  const rawUser =
    localStorage.getItem('currentUser') ||
    localStorage.getItem('user') ||
    localStorage.getItem('auth_user') ||
    localStorage.getItem('loggedUser');

  if (!rawUser) return 'default_user';

  try {
    const parsed = JSON.parse(rawUser);
    if (parsed && typeof parsed === 'object') {
      return String(parsed.id || parsed.email || parsed.username || parsed.fullName || rawUser);
    }
  } catch {
    // Nếu là chuỗi thuần thì dùng trực tiếp
  }
  return rawUser;
};

const getStorageKeysForCurrentUser = (): string[] => {
  const userKey = getCurrentUserKey();
  const rawUser =
    localStorage.getItem('currentUser') ||
    localStorage.getItem('user') ||
    localStorage.getItem('auth_user') ||
    localStorage.getItem('loggedUser') ||
    'default_user';

  return Array.from(new Set([`orders_${userKey}`, `orders_${rawUser}`]));
};

const getSavedCancelledCodes = (): Set<string> => {
  try {
    const raw = JSON.parse(localStorage.getItem(CANCELLED_CODES_STORAGE_KEY) || '[]');
    if (Array.isArray(raw)) {
      return new Set(raw.map(String));
    }
  } catch {
    // Bỏ qua nếu lỗi đọc
  }
  return new Set<string>();
};

const saveCancelledCode = (code: string) => {
  if (!code) return;
  const set = getSavedCancelledCodes();
  set.add(String(code));
  localStorage.setItem(CANCELLED_CODES_STORAGE_KEY, JSON.stringify(Array.from(set)));
};

const removeCancelledCode = (code: string) => {
  if (!code) return;
  const set = getSavedCancelledCodes();
  if (set.delete(String(code))) {
    localStorage.setItem(CANCELLED_CODES_STORAGE_KEY, JSON.stringify(Array.from(set)));
  }
};

const markLocalOrderCancelledByCode = (targetCode: string, responseCode: string): string | null => {
  const keys = getStorageKeysForCurrentUser();
  let matchedCode: string | null = null;

  keys.forEach((storageKey) => {
    try {
      const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(list) || list.length === 0) return;

      const targetIndex = list.findIndex((o: any, idx: number) => {
        const code = String(o.orderCode || o.id || `LHK-${10000 + idx}`);
        return code === String(targetCode);
      });

      if (targetIndex === -1) return;

      const updated = list.map((o: any, idx: number) => {
        if (idx !== targetIndex) return o;
        matchedCode = String(o.orderCode || o.id || targetCode);
        return {
          ...o,
          status: 'Đã hủy',
          orderStatus: 'cancelled',
          paymentStatus: 'failed',
          vnpResponseCode: responseCode
        };
      });

      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Bỏ qua nếu lỗi parse localStorage
    }
  });

  return matchedCode;
};

const sortNewestFirst = (list: DisplayOrder[]): DisplayOrder[] => {
  return [...list].sort((a, b) => {
    const idDiff = Number(b.id || 0) - Number(a.id || 0);
    if (idDiff !== 0) return idDiff;
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
};

const mapLocalOrderToOrder = (o: any, idx: number, cancelledCodes: Set<string>): DisplayOrder => {
  const orderCode = String(o.orderCode || o.id || `LHK-${10000 + idx}`);
  const vnpCode = String(o.vnpResponseCode || o.vnp_ResponseCode || '');
  let mappedStatus: OrderStatus = normalizeOrderStatus(o, 'pending');

  if (cancelledCodes.has(orderCode) || (vnpCode && vnpCode !== '00')) {
    mappedStatus = 'cancelled';
  }

  const rawPayment = String(o.paymentStatus || o.payment_status || '').toLowerCase();
  const paymentStatus: PaymentState =
    rawPayment === 'paid' || rawPayment === 'đã thanh toán'
      ? 'paid'
      : rawPayment === 'failed' || mappedStatus === 'cancelled'
      ? 'failed'
      : 'pending';

  return {
    id: Number(o.id) || idx + 10000,
    orderCode,
    orderStatus: mappedStatus,
    paymentStatus,
    paymentMethod: o.paymentMethod || o.method || 'COD',
    transactionId: o.transactionId || o.vnp_TransactionNo || null,
    createdAt: o.createdAt || o.date || new Date().toISOString(),
    finalAmount: Number(o.finalAmount ?? o.totalAmount ?? o.amount ?? 0),
    items: (o.items || []).map((item: any, i: number) => ({
      id: item.id || i + 1,
      productNameSnapshot: item.productNameSnapshot || item.name || item.product?.name || 'Sản phẩm công nghệ',
      quantity: Number(item.quantity || 1),
      totalPrice: Number(item.totalPrice ?? (item.price || item.variant?.price || 0) * (item.quantity || 1)),
      image: item.image || item.variant?.image || '',
      variantAttributesSnapshot: item.variantAttributesSnapshot || item.variant?.attributes || {}
    })),
    shippingAddressSnapshot: {
      recipientName:
        o.shippingAddressSnapshot?.recipientName ||
        o.shippingInfo?.fullName ||
        'Khách hàng',
      recipientPhone:
        o.shippingAddressSnapshot?.recipientPhone ||
        o.shippingInfo?.phone ||
        '',
      addressLine:
        o.shippingAddressSnapshot?.addressLine ||
        o.shippingInfo?.fullAddress ||
        o.shippingInfo?.address ||
        'TP. Hồ Chí Minh',
      ward: o.shippingAddressSnapshot?.ward || o.shippingInfo?.ward || '',
      district: o.shippingAddressSnapshot?.district || o.shippingInfo?.district || '',
      city:
        o.shippingAddressSnapshot?.city ||
        o.shippingInfo?.city ||
        'TP. Hồ Chí Minh'
    } as any
  } as DisplayOrder;
};

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchOrders = async (extraCancelledCode?: string | null): Promise<DisplayOrder[]> => {
    setLoading(true);
    const cancelledCodes = getSavedCancelledCodes();
    if (extraCancelledCode) {
      cancelledCodes.add(String(extraCancelledCode));
    }

    try {
      const apiData = await customerOrderApi.getMyOrders();
      if (Array.isArray(apiData) && apiData.length > 0) {
        const normalizedApiOrders: DisplayOrder[] = apiData.map((apiOrder: any) => {
          const code = String(apiOrder.orderCode);
          const apiPayment = String(apiOrder.paymentStatus || apiOrder.payment_status || '').toLowerCase();
          const apiStatus = normalizeOrderStatus(apiOrder, 'pending');

          if (apiPayment === 'paid' || apiPayment === 'đã thanh toán') {
            removeCancelledCode(code);
            return {
              ...apiOrder,
              orderStatus: apiStatus,
              paymentStatus: 'paid'
            };
          }

          if (apiStatus === 'cancelled' || apiPayment === 'failed') {
            return {
              ...apiOrder,
              orderStatus: 'cancelled' as OrderStatus,
              paymentStatus: apiPayment || 'failed'
            };
          }

          if (extraCancelledCode && String(extraCancelledCode) === code) {
            return {
              ...apiOrder,
              orderStatus: 'cancelled' as OrderStatus,
              paymentStatus: 'failed'
            };
          }

          return {
            ...apiOrder,
            orderStatus: apiStatus,
            paymentStatus: apiOrder.paymentStatus || apiOrder.payment_status || 'pending'
          };
        });

        const sortedApi = sortNewestFirst(normalizedApiOrders);
        setOrders(sortedApi);
        setLoading(false);
        return sortedApi;
      }
    } catch {
      // Nếu API lỗi hoặc chạy offline thì dùng đơn lưu ở local của user hiện tại
    }

    let localOrders: DisplayOrder[] = [];
    try {
      const userKey = getCurrentUserKey();
      const rawUser =
        localStorage.getItem('currentUser') ||
        localStorage.getItem('user') ||
        localStorage.getItem('auth_user') ||
        localStorage.getItem('loggedUser') ||
        'default_user';

      const primaryList = JSON.parse(localStorage.getItem(`orders_${userKey}`) || '[]');
      const fallbackList =
        userKey !== rawUser
          ? JSON.parse(localStorage.getItem(`orders_${rawUser}`) || '[]')
          : [];

      const mergedRaw = [
        ...(Array.isArray(primaryList) ? primaryList : []),
        ...(Array.isArray(fallbackList) ? fallbackList : [])
      ];
      localOrders = mergedRaw.map((item, idx) => mapLocalOrderToOrder(item, idx, cancelledCodes));
    } catch (err) {
      console.error('Lỗi đọc đơn hàng local:', err);
    }

    const sortedLocal = sortNewestFirst(localOrders);
    setOrders(sortedLocal);
    setLoading(false);
    return sortedLocal;
  };

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const vnpCode = params.get('vnp_ResponseCode');
    const vnpTxnRef = params.get('vnp_TxnRef');

    localStorage.removeItem('vnpay_failed_flag');
    localStorage.removeItem('vnpay_failed_at');
    localStorage.removeItem('pending_vnpay_order_code');

    const runSync = async () => {
      let confirmedCancelledCode: string | null = null;

      if (vnpCode && vnpCode !== '00' && vnpTxnRef) {
        confirmedCancelledCode = markLocalOrderCancelledByCode(vnpTxnRef, vnpCode) || String(vnpTxnRef);
        saveCancelledCode(confirmedCancelledCode);
      } else if (vnpCode === '00' && vnpTxnRef) {
        removeCancelledCode(vnpTxnRef);
      }

      const currentList = await fetchOrders(confirmedCancelledCode);
      if (!active) return;

      if (confirmedCancelledCode && Array.isArray(currentList) && currentList.length > 0) {
        setOrders(prev =>
          prev.map(o =>
            String(o.orderCode) === String(confirmedCancelledCode) && String(o.paymentStatus).toLowerCase() !== 'paid'
              ? { ...o, orderStatus: 'cancelled' as OrderStatus, paymentStatus: 'failed' }
              : o
          )
        );
      }
    };

    runSync();
    return () => {
      active = false;
    };
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    try {
      await customerOrderApi.cancelOrder(orderId);
      showToast('Đã hủy đơn hàng thành công!', 'info');
      await fetchOrders();
    } catch (err) {
      const keys = getStorageKeysForCurrentUser();
      keys.forEach((storageKey) => {
        try {
          const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const updated = list.map((o: any, idx: number) =>
            (Number(o.id) || idx + 10000) === orderId
              ? { ...o, status: 'Đã hủy', orderStatus: 'cancelled' }
              : o
          );
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // Bỏ qua nếu lỗi ghi local
        }
      });
      await fetchOrders();
      showToast(err instanceof Error ? err.message : 'Đã cập nhật trạng thái hủy đơn.', 'info');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (selectedFilter === 'ALL') return true;
    return o.orderStatus === selectedFilter;
  });

  const getPaymentBadge = (paymentStatus?: string) => {
    const normalized = String(paymentStatus || 'pending').toLowerCase();
    if (normalized === 'paid' || normalized === 'đã thanh toán') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CreditCard className="w-3 h-3" /> Đã thanh toán
        </span>
      );
    }
    if (normalized === 'failed' || normalized === 'thanh toán lỗi') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3" /> Thanh toán lỗi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Clock className="w-3 h-3" /> Chờ thanh toán
      </span>
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Chờ xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
            <Truck className="w-3 h-3" /> Đang giao hỏa tốc
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Giao thành công
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" /> Đơn Hàng Của Tôi
            </h1>
            <p className="text-xs text-slate-500">Theo dõi tiến trình vận chuyển và lịch sử mua sắm thiết bị</p>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold text-slate-600">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ xử lý' },
          { key: 'shipping', label: 'Đang vận chuyển' },
          { key: 'delivered', label: 'Hoàn tất' },
          { key: 'cancelled', label: 'Đã hủy' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedFilter(tab.key)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === tab.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-400">
          Đang tải danh sách đơn hàng...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy đơn hàng nào</h3>
          <p className="text-xs text-slate-400">Bạn chưa có đơn hàng nào trong danh mục này.</p>
          <Link
            to="/catalog"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-xs">
              {/* Order Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-600">{order.orderCode}</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getPaymentBadge(order.paymentStatus)}
                  {getStatusBadge(order.orderStatus)}
                </div>
              </div>

              {/* Items in order */}
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productNameSnapshot}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{item.productNameSnapshot}</div>
                        <div className="text-[11px] text-slate-400">
                          {Object.values(item.variantAttributesSnapshot || {}).join(' • ')} x {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-800">{formatCurrencyVN(item.totalPrice)}</div>
                  </div>
                ))}
              </div>

              {/* Delivery Address & Price Summary */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="text-slate-500 text-[11px] max-w-md">
                  Giao đến: <strong className="text-slate-700">{order.shippingAddressSnapshot?.recipientName}</strong> - {order.shippingAddressSnapshot?.addressLine}, {order.shippingAddressSnapshot?.city}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div>
                    <span className="text-slate-400 text-[11px]">Tổng đơn: </span>
                    <span className="text-sm font-black text-blue-600">{formatCurrencyVN(order.finalAmount)}</span>
                  </div>

                  {order.orderStatus === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(Number(order.id))}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};