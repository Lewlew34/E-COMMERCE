import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Calendar,
  Filter,
  Eye,
  Check,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { sellerApiService } from '../../../../services/storageService';
import type { Order, OrderStatus } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

interface SellerPaymentRow {
  orderCode: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  createdAt: string;
  paymentStatus: string;
  orderStatusLabel: string;
}

const mapStatusToOrderStatus = (raw: any): OrderStatus => {
  const s = String(raw || 'pending').toLowerCase();
  if (s.includes('cancel') || s.includes('hủy') || s.includes('thất bại')) return 'cancelled';
  if (s.includes('deliver') || s.includes('hoàn tất') || s.includes('thành công') || s.includes('giao xong')) {
    return 'delivered';
  }
  if (s.includes('ship') || s.includes('vận chuyển') || s.includes('đang giao')) return 'shipping';
  if (s.includes('confirm') || s.includes('duyệt') || s.includes('xác nhận')) {
    return s.includes('chờ') ? 'pending' : 'confirmed';
  }
  return 'pending';
};

const readLocalSellerOrders = (): any[] => {
  const keys = ['seller_orders', 'customer_orders', 'pendingVNPayOrder'];
  const merged: any[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? [parsed] : [];
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const code = String(item.orderCode || item.id || item.transactionId || '');
        const uniqueKey = code || JSON.stringify(item).slice(0, 60);
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          merged.push(item);
        }
      }
    } catch {
      // Bỏ qua key lỗi định dạng
    }
  }

  return merged;
};

const mapLocalToOrder = (o: any, idx: number): Order => {
  const mappedStatus = mapStatusToOrderStatus(o.orderStatus || o.status);
  const rawItems = Array.isArray(o.items) ? o.items : [];
  const totalAmt = Number(o.finalAmount ?? o.totalAmount ?? o.amount ?? 0);

  return {
    id: Number(o.id) || idx + 90000,
    orderCode: String(o.orderCode || o.id || `DH-${90000 + idx}`),
    orderStatus: mappedStatus,
    createdAt: o.createdAt || o.date || new Date().toISOString(),
    finalAmount: totalAmt,
    paymentMethod: String(o.paymentMethod || o.method || 'VNPay QR Sandbox'),
    sellerTrackingNumber: o.sellerTrackingNumber || o.trackingNumber || '',
    items: rawItems.map((item: any, i: number) => {
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.price ?? item.variant?.price ?? (totalAmt / Math.max(qty, 1)));
      return {
        id: item.id || i + 1,
        productNameSnapshot: item.productNameSnapshot || item.name || item.product?.name || 'Sản phẩm công nghệ',
        quantity: qty,
        price: unitPrice,
        totalPrice: Number(item.totalPrice ?? unitPrice * qty)
      };
    }),
    shippingAddressSnapshot: {
      recipientName: o.shippingAddressSnapshot?.recipientName || o.shippingInfo?.fullName || 'Khách hàng',
      phone: o.shippingAddressSnapshot?.phone || o.shippingAddressSnapshot?.recipientPhone || o.shippingInfo?.phone || '',
      addressLine:
        o.shippingAddressSnapshot?.addressLine ||
        o.shippingInfo?.address ||
        o.shippingInfo?.fullAddress ||
        'TP. Hồ Chí Minh',
      ward: o.shippingAddressSnapshot?.ward || o.shippingInfo?.ward || '',
      district: o.shippingAddressSnapshot?.district || o.shippingInfo?.district || '',
      city: o.shippingAddressSnapshot?.city || o.shippingInfo?.city || 'TP. Hồ Chí Minh'
    }
  } as Order;
};

export const SellerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<SellerPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showToast } = useToast();

  const buildMergedOrders = async (): Promise<{ allOrders: Order[]; payments: SellerPaymentRow[] }> => {
    const localRaw = readLocalSellerOrders();
    const localMapped = localRaw.map(mapLocalToOrder);

    let apiOrders: Order[] = [];
    try {
      const res = await sellerApiService.getOrders();
      if (Array.isArray(res)) {
        apiOrders = res;
      }
    } catch {
      // Dùng dữ liệu local nếu API trả về lỗi/trống
    }

    const apiByCode = new Map<string, Order>();
    for (const apiOrder of apiOrders) {
      apiByCode.set(String(apiOrder.orderCode), apiOrder);
    }

    const mergedLocalWithApi: Order[] = localMapped.map(localOrder => {
      const apiMatch = apiByCode.get(String(localOrder.orderCode));
      if (!apiMatch) return localOrder;
      return {
        ...localOrder,
        id: apiMatch.id ?? localOrder.id,
        orderStatus: mapStatusToOrderStatus(apiMatch.orderStatus || localOrder.orderStatus),
        finalAmount: Number(apiMatch.finalAmount ?? localOrder.finalAmount),
        paymentMethod: apiMatch.paymentMethod || localOrder.paymentMethod,
        sellerTrackingNumber: apiMatch.sellerTrackingNumber || localOrder.sellerTrackingNumber
      };
    });

    const seenCodes = new Set(mergedLocalWithApi.map(o => String(o.orderCode)));
    const allOrders = [
      ...mergedLocalWithApi,
      ...apiOrders.filter(o => !seenCodes.has(String(o.orderCode)))
    ];

    const payments: SellerPaymentRow[] = allOrders.map((o, idx) => {
      const matchedLocal = localRaw.find(
        raw => String(raw.orderCode || raw.id) === String(o.orderCode)
      );
      const isFailed = o.orderStatus === 'cancelled' || String(matchedLocal?.status || '').toLowerCase().includes('thất bại');
      const methodLabel = String(matchedLocal?.paymentMethod || matchedLocal?.method || o.paymentMethod || 'VNPay QR Sandbox');

      return {
        orderCode: String(o.orderCode),
        transactionId: String(
          matchedLocal?.transactionId ||
            matchedLocal?.vnp_TransactionNo ||
            matchedLocal?.vnp_BankTranNo ||
            `TXN-${o.orderCode || idx + 1}`
        ),
        paymentMethod: methodLabel,
        amount: Number(o.finalAmount || 0),
        createdAt: o.createdAt || new Date().toISOString(),
        paymentStatus:
          matchedLocal?.paymentStatus ||
          (isFailed
            ? 'Thanh toán thất bại / Hủy'
            : methodLabel.toLowerCase().includes('cod')
              ? 'Chờ thanh toán (COD)'
              : 'Đã thanh toán'),
        orderStatusLabel:
          o.orderStatus === 'pending'
            ? 'Chờ xác nhận'
            : o.orderStatus === 'confirmed'
              ? 'Đã duyệt'
              : o.orderStatus === 'shipping'
                ? 'Đang giao'
                : o.orderStatus === 'delivered'
                  ? 'Hoàn thành'
                  : 'Đã hủy'
      };
    });

    return { allOrders, payments };
  };

  const refreshOrders = async () => {
    const { allOrders, payments } = await buildMergedOrders();
    setOrders(allOrders);
    setPaymentHistory(payments);
    if (selectedOrder) {
      setSelectedOrder(allOrders.find(order => String(order.orderCode) === String(selectedOrder.orderCode)) || null);
    }
  };

  useEffect(() => {
    buildMergedOrders()
      .then(({ allOrders, payments }) => {
        setOrders(allOrders);
        setPaymentHistory(payments);
      })
      .catch(error => showToast(error instanceof Error ? error.message : 'Không tải được đơn hàng.', 'error'))
      .finally(() => setLoading(false));

    const handleStorageChange = () => {
      void refreshOrders();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const syncLocalOrderStatus = (orderCode: string, nextStatus: OrderStatus, trackingNumber?: string) => {
    const labelMap: Record<OrderStatus, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã duyệt đơn',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao thành công',
      cancelled: 'Đã hủy'
    };

    const keys = ['seller_orders', 'customer_orders'];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('orders_')) {
        keys.push(k);
      }
    }

    for (const key of Array.from(new Set(keys))) {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(list)) continue;
        const updated = list.map((item: any) => {
          if (String(item.orderCode || item.id) !== String(orderCode)) return item;
          return {
            ...item,
            orderStatus: nextStatus,
            status: labelMap[nextStatus],
            sellerTrackingNumber: trackingNumber !== undefined ? trackingNumber : item.sellerTrackingNumber
          };
        });
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {
        // Bỏ qua lỗi ghi local
      }
    }
  };

  const handleUpdateStatus = async (order: Order, nextStatus: OrderStatus, trackingNumber?: string) => {
    let apiUpdated = false;
    try {
      await sellerApiService.updateOrderStatus(order.id, nextStatus, trackingNumber);
      apiUpdated = true;
    } catch (err) {
      showToast(
        err instanceof Error
          ? `API chưa cập nhật DB (${err.message}), đã cập nhật tạm trên trình duyệt.`
          : 'API chưa cập nhật DB, đã cập nhật tạm trên trình duyệt.',
        'info'
      );
    }

    syncLocalOrderStatus(String(order.orderCode), nextStatus, trackingNumber);
    await refreshOrders();
    if (apiUpdated) {
      showToast(`Đã chuyển đơn ${order.orderCode} sang trạng thái "${nextStatus.toUpperCase()}".`, 'success');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'ALL') return true;
    return o.orderStatus === statusFilter;
  });

  const getBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ xác nhận</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</span>;
      case 'shipping':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-1"><Truck className="w-3 h-3" /> Đang giao</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" /> Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Đã hủy</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" /> Quản Lý Đơn Hàng Cửa Hàng
          </h1>
          <p className="text-xs text-slate-400 mt-1">Tiếp nhận đơn mới, xác nhận đóng gói, cập nhật tiến trình giao hàng và lịch sử thanh toán</p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshOrders()}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>

          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white"
          >
            <option value="ALL">Tất cả trạng thái ({orders.length})</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã duyệt đơn</option>
            <option value="shipping">Đang giao hàng</option>
            <option value="delivered">Đã giao thành công</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Orders Table - Pure Table, NO BOX */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 pr-4">Mã Đơn & Ngày</th>
              <th className="py-2.5 px-4">Khách Hàng & Nơi Giao</th>
              <th className="py-2.5 px-4">Thiết Bị Đặt Mua</th>
              <th className="py-2.5 px-4">Tổng Tiền</th>
              <th className="py-2.5 px-4">Trạng Thái</th>
              <th className="py-2.5 pl-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Đang tải đơn hàng...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Chưa có đơn hàng của gian hàng ở trạng thái này.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={`${order.id}-${order.orderCode}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="font-mono font-bold text-blue-600">{order.orderCode}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-bold text-slate-900">{order.shippingAddressSnapshot.recipientName}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {order.shippingAddressSnapshot.phone} • {order.shippingAddressSnapshot.city}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-medium">
                      {order.items.length} thiết bị
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">
                      {order.items[0]?.productNameSnapshot}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-black text-slate-900">
                    {formatCurrencyVN(order.finalAmount)}
                  </td>

                  <td className="py-3.5 px-4">
                    {getBadge(order.orderStatus)}
                  </td>

                  <td className="py-3.5 pl-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {order.orderStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateStatus(order, 'confirmed')}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] cursor-pointer"
                        >
                          Duyệt đơn
                        </button>
                      )}

                      {order.orderStatus === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => {
                            const trackingNumber = window.prompt('Nhập mã vận đơn (để trống nếu chưa có):');
                            if (trackingNumber === null) return;
                            void handleUpdateStatus(order, 'shipping', trackingNumber.trim());
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] cursor-pointer"
                        >
                          Giao cho bưu tá
                        </button>
                      )}

                      {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hủy đơn ${order.orderCode}? Tồn kho sản phẩm của shop sẽ được hoàn lại.`)) {
                              void handleUpdateStatus(order, 'cancelled');
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-medium text-[11px] cursor-pointer"
                        >
                          Hủy đơn
                        </button>
                      )}

                      {order.orderStatus === 'shipping' && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateStatus(order, 'delivered')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] cursor-pointer"
                        >
                          Đã giao xong
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bảng Lịch Sử Thanh Toán Cho Người Bán */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" /> Lịch Sử Thanh Toán Của Gian Hàng
            </h2>
            <p className="text-xs text-slate-400">
              Hiển thị phương thức thanh toán, số tiền, thời gian, mã giao dịch và trạng thái thanh toán của đơn
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{paymentHistory.length} giao dịch</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 pr-4">Mã Đơn</th>
                <th className="py-2.5 px-4">Mã Giao Dịch</th>
                <th className="py-2.5 px-4">Phương Thức</th>
                <th className="py-2.5 px-4">Số Tiền</th>
                <th className="py-2.5 px-4">Thời Gian</th>
                <th className="py-2.5 pl-4">Trạng Thái Thanh Toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Chưa có giao dịch thanh toán nào.
                  </td>
                </tr>
              ) : (
                paymentHistory.map((row, index) => (
                  <tr key={`${row.orderCode}-${row.transactionId}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4 font-mono font-bold text-blue-600">{row.orderCode}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{row.transactionId}</td>
                    <td className="py-3 px-4 text-slate-800">{row.paymentMethod}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{formatCurrencyVN(row.amount)}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(row.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 pl-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.paymentStatus.toLowerCase().includes('thất bại') ||
                          row.paymentStatus.toLowerCase().includes('hủy')
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {row.paymentStatus} • {row.orderStatusLabel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Order Detail */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chi Tiết Đơn Hàng</h3>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedOrder.orderCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div>
                <strong className="text-slate-800">Khách nhận: </strong>
                {selectedOrder.shippingAddressSnapshot.recipientName} ({selectedOrder.shippingAddressSnapshot.phone})
              </div>
              <div>
                <strong className="text-slate-800">Địa chỉ: </strong>
                {selectedOrder.shippingAddressSnapshot.addressLine}, {selectedOrder.shippingAddressSnapshot.ward}, {selectedOrder.shippingAddressSnapshot.district}, {selectedOrder.shippingAddressSnapshot.city}
              </div>
              <div>
                <strong className="text-slate-800">Hình thức thanh toán: </strong>
                {selectedOrder.paymentMethod}
              </div>
              {selectedOrder.sellerTrackingNumber && (
                <div>
                  <strong className="text-slate-800">Mã vận đơn: </strong>
                  {selectedOrder.sellerTrackingNumber}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="font-bold text-xs text-slate-800 mb-2">Danh sách sản phẩm:</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{item.productNameSnapshot}</div>
                      <div className="text-[10px] text-slate-400">Số lượng: {item.quantity} x {formatCurrencyVN(item.price)}</div>
                    </div>
                    <div className="font-bold text-blue-600">{formatCurrencyVN(item.totalPrice)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-700">Tổng cộng:</span>
              <span className="text-base font-black text-blue-600">{formatCurrencyVN(selectedOrder.finalAmount)}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};