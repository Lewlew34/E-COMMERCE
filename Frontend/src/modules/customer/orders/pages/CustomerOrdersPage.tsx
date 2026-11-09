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
  AlertCircle
} from 'lucide-react';
import { orderService } from '../../../../services/storageService';
import { customerOrderApi } from '../../../../api';
import type { Order, OrderStatus } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(orderService.getAll());
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchOrders = async () => {
    try {
      const data = await customerOrderApi.getMyOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch {
      // Fallback về localStorage nếu chưa đăng nhập session PHP
      setOrders(orderService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    try {
      await customerOrderApi.cancelOrder(orderId);
      showToast('Đã hủy đơn hàng thành công!', 'info');
      await fetchOrders();
    } catch (err) {
      // Nếu API không hủy được hoặc chạy offline, cập nhật tạm localStorage
      orderService.updateStatus(orderId, 'cancelled');
      setOrders(orderService.getAll());
      showToast(err instanceof Error ? err.message : 'Đã cập nhật trạng thái hủy đơn.', 'info');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (selectedFilter === 'ALL') return true;
    return o.orderStatus === selectedFilter;
  });

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
                <div>{getStatusBadge(order.orderStatus)}</div>
              </div>

              {/* Items in order */}
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4 text-xs">
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
                  Giao đến: <strong className="text-slate-700">{order.shippingAddressSnapshot.recipientName}</strong> - {order.shippingAddressSnapshot.addressLine}, {order.shippingAddressSnapshot.city}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div>
                    <span className="text-slate-400 text-[11px]">Tổng đơn: </span>
                    <span className="text-sm font-black text-blue-600">{formatCurrencyVN(order.finalAmount)}</span>
                  </div>

                  {order.orderStatus === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
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
