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
  Check
} from 'lucide-react';
import { sellerApiService } from '../../../../services/storageService';
import type { Order, OrderStatus } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

export const SellerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showToast } = useToast();

  const refreshOrders = async () => {
    const updated = await sellerApiService.getOrders();
    setOrders(updated);
    if (selectedOrder) {
      setSelectedOrder(updated.find(order => order.id === selectedOrder.id) || null);
    }
  };

  useEffect(() => {
    sellerApiService.getOrders()
      .then(setOrders)
      .catch(error => showToast(error instanceof Error ? error.message : 'Không tải được đơn hàng.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      await sellerApiService.updateOrderStatus(orderId, nextStatus);
      await refreshOrders();
      showToast(`Đã chuyển đơn hàng sang trạng thái "${nextStatus.toUpperCase()}".`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không cập nhật được đơn hàng.', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'ALL') return true;
    return o.orderStatus === statusFilter;
  });

  const getBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ xác nhận</span>;
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</span>;
      case 'shipping':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1"><Truck className="w-3 h-3" /> Đang giao</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><Check className="w-3 h-3" /> Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> Đã hủy</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" /> Quản Lý Đơn Hàng Cửa Hàng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Tiếp nhận đơn mới, xác nhận đóng gói và cập nhật tiến trình giao hàng</p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
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

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Đơn & Ngày</th>
                <th className="py-3 px-4">Khách Hàng & Nơi Giao</th>
                <th className="py-3 px-4">Thiết Bị Đặt Mua</th>
                <th className="py-3 px-4">Tổng Tiền</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Đang tải đơn hàng từ database...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có đơn hàng của gian hàng ở trạng thái này.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
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

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {order.orderStatus === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Duyệt đơn
                          </button>
                        )}

                        {order.orderStatus === 'confirmed' && (
                          <button
                            onClick={() => {
                              const trackingNumber = window.prompt('Nhập mã vận đơn (để trống nếu chưa có):');
                              if (trackingNumber === null) return;
                              void sellerApiService.updateOrderStatus(order.id, 'shipping', trackingNumber.trim())
                                .then(refreshOrders)
                                .then(() => showToast('Đã bàn giao đơn cho đơn vị vận chuyển.', 'success'))
                                .catch(error => showToast(error instanceof Error ? error.message : 'Không cập nhật được đơn.', 'error'));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Giao cho bưu tá
                          </button>
                        )}

                        {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hủy đơn ${order.orderCode}? Tồn kho sản phẩm của shop sẽ được hoàn lại.`)) {
                                void handleUpdateStatus(order.id, 'cancelled');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] cursor-pointer"
                          >
                            Hủy đơn
                          </button>
                        )}

                        {order.orderStatus === 'shipping' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
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
      </div>

      {/* Modal Order Detail */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chi Tiết Đơn Hàng</h3>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedOrder.orderCode}</span>
              </div>
              <button
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
                  <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
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
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
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
