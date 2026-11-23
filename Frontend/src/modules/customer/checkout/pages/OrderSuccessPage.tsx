import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Package } from 'lucide-react';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderViewModel {
  orderCode?: string;
  txnRef: string;
  items: OrderItem[];
  shippingInfo: {
    fullName: string;
    phone: string;
    address?: string;
    fullAddress?: string;
  };
  amount: number;
  method: string;
}

const API_BASE =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost/Backend/api';

function resolveMethodLabel(paymentParam: string | null, rawMethod?: string): string {
  const key = (paymentParam || rawMethod || '').toLowerCase();
  if (key.includes('paypal')) return 'Thanh toán Quốc tế PayPal Sandbox';
  if (key.includes('vnpay')) return 'VNPay QR Sandbox';
  if (key.includes('cod')) return 'Thanh toán khi nhận hàng (COD)';
  return rawMethod || 'Thanh toán trực tuyến';
}

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentParam = searchParams.get('payment');
  const statusParam = searchParams.get('status');
  const orderCodeParam = (searchParams.get('orderCode') || '').trim();
  const txnIdParam = (
    searchParams.get('txnId') ||
    searchParams.get('vnp_TxnRef') ||
    ''
  ).trim();

  const [orderData, setOrderData] = useState<OrderViewModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrateOrder() {
      setLoading(true);
      try {
        // 1. Kiểm tra mã phản hồi từ VNPay nếu có
        const responseCode = searchParams.get('vnp_ResponseCode');
        if (responseCode && responseCode !== '00') {
          navigate(`/order-failed?vnp_ResponseCode=${responseCode}`, {
            replace: true,
          });
          return;
        }

        // Nếu không có dấu hiệu thanh toán hợp lệ nào trên URL lẫn localStorage
        const savedOrderRaw =
          localStorage.getItem('pendingPayPalOrder') ||
          localStorage.getItem('pendingVNPayOrder') ||
          localStorage.getItem('lastOrder');

        const isPayPalSuccess =
          (paymentParam || '').toLowerCase() === 'paypal' &&
          statusParam === 'success';
        const isVNPaySuccess =
          Boolean(searchParams.get('vnp_TxnRef')) &&
          (!responseCode || responseCode === '00');

        let baseData: OrderViewModel | null = null;

        if (savedOrderRaw) {
          const parsed = JSON.parse(savedOrderRaw);
          const parsedCode = String(
            parsed?.orderCode || parsed?.order_code || ''
          ).trim();

          // Chỉ dùng cache localStorage nếu khớp orderCode trên URL hoặc không có orderCode trên URL
          const matchesUrlOrder =
            !orderCodeParam || !parsedCode || parsedCode === orderCodeParam;

          if (matchesUrlOrder && parsed) {
            const ship = parsed.shippingInfo || parsed.shipping_info || {};
            baseData = {
              orderCode: parsedCode || orderCodeParam || undefined,
              txnRef:
                txnIdParam ||
                parsed.txnId ||
                parsed.transaction_id ||
                searchParams.get('vnp_TxnRef') ||
                '123456',
              items: Array.isArray(parsed.items) ? parsed.items : [],
              shippingInfo: {
                fullName:
                  ship.fullName ||
                  parsed.receiver_name ||
                  parsed.customer_name ||
                  '',
                phone: ship.phone || parsed.receiver_phone || '',
                address: ship.address || parsed.shipping_address || '',
                fullAddress: ship.fullAddress || ship.address || parsed.shipping_address || '',
              },
              amount: Number(
                parsed.amount ?? parsed.final_amount ?? parsed.total_amount ?? 0
              ),
              method: resolveMethodLabel(paymentParam, parsed.method || parsed.payment_method),
            };
          }
        }

        // Nếu mở URL PayPal thành công mà localStorage cũ không khớp orderCode, tạo khung cơ bản từ URL
        if (!baseData && (isPayPalSuccess || isVNPaySuccess || orderCodeParam)) {
          baseData = {
            orderCode: orderCodeParam || undefined,
            txnRef: txnIdParam || '123456',
            items: [],
            shippingInfo: {
              fullName: '',
              phone: '',
              address: '',
              fullAddress: '',
            },
            amount: 0,
            method: resolveMethodLabel(paymentParam),
          };
        }

        if (!cancelled && baseData) {
          setOrderData(baseData);
        }

        // 2. Lấy chi tiết đơn hàng mới nhất từ backend theo orderCode để đảm bảo đúng người nhận & tổng tiền
        if (orderCodeParam) {
          const token = localStorage.getItem('token') || '';
          const res = await fetch(
            `${API_BASE}/orders.php?action=detail&orderCode=${encodeURIComponent(orderCodeParam)}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          if (res.ok) {
            const json = await res.json();
            const rawOrder =
              json?.data || json?.order || (json?.order_code ? json : null);

            if (rawOrder && !cancelled) {
              const apiItems: OrderItem[] = Array.isArray(rawOrder.items)
                ? rawOrder.items.map((it: any) => ({
                    name: it.product_name || it.name || 'Sản phẩm',
                    price: Number(it.price || it.unit_price || 0),
                    quantity: Number(it.quantity || 1),
                  }))
                : [];

              setOrderData((prev) => {
                const current = prev || {
                  orderCode: orderCodeParam,
                  txnRef: txnIdParam || '123456',
                  items: [],
                  shippingInfo: { fullName: '', phone: '' },
                  amount: 0,
                  method: resolveMethodLabel(paymentParam, rawOrder.payment_method),
                };

                return {
                  orderCode: String(rawOrder.order_code || orderCodeParam),
                  txnRef:
                    txnIdParam ||
                    rawOrder.transaction_id ||
                    rawOrder.txn_id ||
                    current.txnRef,
                  items: apiItems.length > 0 ? apiItems : current.items,
                  shippingInfo: {
                    fullName:
                      rawOrder.receiver_name ||
                      rawOrder.customer_name ||
                      current.shippingInfo.fullName,
                    phone:
                      rawOrder.receiver_phone ||
                      rawOrder.phone ||
                      current.shippingInfo.phone,
                    address:
                      rawOrder.shipping_address ||
                      rawOrder.address ||
                      current.shippingInfo.address,
                    fullAddress:
                      rawOrder.shipping_address ||
                      rawOrder.address ||
                      current.shippingInfo.fullAddress,
                  },
                  amount: Number(
                    rawOrder.final_amount ??
                      rawOrder.total_amount ??
                      current.amount ??
                      0
                  ),
                  method: resolveMethodLabel(
                    paymentParam,
                    rawOrder.payment_method || current.method
                  ),
                };
              });
            }
          }
        }
      } catch (e) {
        console.error('Lỗi đọc đơn hàng:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrateOrder();
    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, paymentParam, statusParam, orderCodeParam, txnIdParam]);

  if (loading && !orderData) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-sm text-slate-500">
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Không tìm thấy thông tin đơn hàng hoặc giao dịch đã hủy!
        </h2>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">
              Đặt Hàng Thành Công!
            </h1>
            <p className="text-xs text-slate-500">
              Cảm ơn bạn đã mua sắm tại TechMart. Mã giao dịch của đơn hàng là{' '}
              <span className="font-bold text-slate-800">#{orderData.txnRef}</span>
              {orderData.orderCode ? (
                <>
                  {' '}
                  (Đơn <span className="font-bold text-slate-800">{orderData.orderCode}</span>)
                </>
              ) : null}
            </p>
          </div>
        </div>

        {(orderData.shippingInfo.fullName ||
          orderData.shippingInfo.phone ||
          orderData.shippingInfo.fullAddress ||
          orderData.shippingInfo.address) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
            <div>
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Thông Tin Người Nhận</span>
              </h3>
              {orderData.shippingInfo.fullName && (
                <p className="text-slate-600">
                  <span className="font-medium">Họ tên:</span>{' '}
                  {orderData.shippingInfo.fullName}
                </p>
              )}
              {orderData.shippingInfo.phone && (
                <p className="text-slate-600">
                  <span className="font-medium">Điện thoại:</span>{' '}
                  {orderData.shippingInfo.phone}
                </p>
              )}
              {(orderData.shippingInfo.fullAddress || orderData.shippingInfo.address) && (
                <p className="text-slate-600">
                  <span className="font-medium">Địa chỉ:</span>{' '}
                  {orderData.shippingInfo.fullAddress || orderData.shippingInfo.address}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-2">Hình Thức Thanh Toán</h3>
              <p className="text-slate-600 font-medium text-blue-600">
                {orderData.method}
              </p>
              <p className="text-slate-500 mt-2">
                Trạng thái:{' '}
                <span className="text-emerald-600 font-bold">Thành công</span>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
            Sản Phẩm Đã Đặt
          </h3>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {orderData.items.map((item, index) => (
              <div
                key={index}
                className="py-4 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400">
                    IMG
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-slate-400">Số lượng: {item.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-slate-900">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-sm font-black">
            <span className="text-slate-900">Tổng thanh toán:</span>
            <span className="text-blue-600 text-base">
              {orderData.amount
                ? orderData.amount.toLocaleString('vi-VN') + ' đ'
                : '0 đ'}
            </span>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            to="/"
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center"
          >
            Về trang chủ
          </Link>
          <Link
            to="/catalog"
            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Tiếp tục mua sắm</span>
          </Link>
        </div>
      </div>
    </div>
  );
};