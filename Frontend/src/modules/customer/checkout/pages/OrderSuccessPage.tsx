import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Package } from 'lucide-react';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderViewModel {
  orderCode?: string;
  txnRef: string;
  bankTranNo?: string;
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

const ORDER_STORAGE_KEYS = [
  'pendingVNPayOrder',
  'pendingPayPalOrder',
  'pendingCODOrder',
  'lastOrder',
] as const;

function normalizeCodeVariants(rawCode: string): string[] {
  const clean = String(rawCode || '').trim();
  if (!clean) return [];
  const variants = new Set<string>([clean]);
  const withoutSuffix = clean.replace(/_\d+$/, '').trim();
  if (withoutSuffix) variants.add(withoutSuffix);
  const withoutPrefix = clean.replace(/^ORD-/i, '').trim();
  if (withoutPrefix) variants.add(withoutPrefix);
  const cleanWithoutBoth = withoutSuffix.replace(/^ORD-/i, '').trim();
  if (cleanWithoutBoth) variants.add(cleanWithoutBoth);
  return Array.from(variants);
}

function isCodeMatch(candidate: string, targetVariants: string[]): boolean {
  const c = String(candidate || '').trim();
  if (!c || targetVariants.length === 0) return false;
  const cVariants = normalizeCodeVariants(c);
  for (const cv of cVariants) {
    if (targetVariants.includes(cv)) return true;
  }
  for (const tv of targetVariants) {
    if (c.startsWith(tv) || tv.startsWith(c)) return true;
  }
  return false;
}

function resolveMethodLabel(options: {
  paymentParam?: string | null;
  vnpTxnRef?: string | null;
  rawMethod?: string | null;
}): string {
  const raw = (options.rawMethod || '').toUpperCase().trim();
  if (raw === 'COD') return 'Thanh toán khi nhận hàng (COD)';
  if (raw === 'BANK_TRANSFER' || raw === 'VNPAY') return 'VNPay QR Sandbox';
  if (raw === 'CREDIT_CARD' || raw === 'PAYPAL' || raw === 'PAYPAL_SANDBOX') {
    return 'Thanh toán Quốc tế PayPal Sandbox';
  }

  const combined = [
    options.paymentParam || '',
    options.rawMethod || '',
    options.vnpTxnRef ? 'vnpay' : '',
  ]
    .join(' ')
    .toLowerCase();

  if (combined.includes('paypal')) return 'Thanh toán Quốc tế PayPal Sandbox';
  if (combined.includes('vnpay')) return 'VNPay QR Sandbox';
  if (combined.includes('cod')) return 'Thanh toán khi nhận hàng (COD)';
  return options.rawMethod || 'Thanh toán khi nhận hàng (COD)';
}

function getFallbackUserShipping(): {
  fullName: string;
  phone: string;
  address: string;
} {
  const keysToCheck = [
    'currentUser',
    'user',
    'auth_user',
    'loggedUser',
    'shippingInfo',
    'shipping_info',
    'checkoutShipping',
  ];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (
      k &&
      (k.toLowerCase().includes('user') ||
        k.toLowerCase().includes('shipping') ||
        k.toLowerCase().includes('profile'))
    ) {
      keysToCheck.push(k);
    }
  }

  for (const key of Array.from(new Set(keysToCheck))) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const u = parsed?.user || parsed?.data || parsed;
      if (!u || typeof u !== 'object') continue;

      const addr = [
        u.addressLine ||
          u.address ||
          u.shippingAddress ||
          u.fullAddress ||
          u.street ||
          '',
        u.ward || '',
        u.district || '',
        u.city || u.province || '',
      ]
        .filter(Boolean)
        .join(', ');

      const fullName = String(
        u.fullName ||
          u.recipientName ||
          u.receiver_name ||
          u.name ||
          u.username ||
          ''
      ).trim();
      const phone = String(
        u.phone || u.phoneNumber || u.receiver_phone || u.tel || ''
      ).trim();

      if (fullName || phone || addr) {
        return { fullName, phone, address: addr };
      }
    } catch {
      // Bỏ qua nếu không phải JSON
    }
  }

  return { fullName: '', phone: '', address: '' };
}

function extractOrdersFromAnyValue(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.orders)) return val.orders;
    if (Array.isArray(val.items) && !val.orderCode && !val.order_code) {
      return val.items;
    }
    return [val?.data || val?.order || val];
  }
  return [];
}

function getAllLocalOrders(): any[] {
  const result: any[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();
      if (
        lower.includes('order') ||
        lower.includes('vnpay') ||
        lower.includes('checkout') ||
        lower.includes('cart')
      ) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        result.push(...extractOrdersFromAnyValue(parsed));
      }
    }
  } catch {
    // Bỏ qua nếu lỗi parse
  }
  return result;
}

function findOrderInList(
  list: any[],
  targetCode: string,
  targetTxn: string
): any | null {
  const variants = Array.from(
    new Set([
      ...normalizeCodeVariants(targetCode),
      ...normalizeCodeVariants(targetTxn),
    ])
  );

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const code = String(
      item.orderCode || item.order_code || item.code || item.id || ''
    ).trim();
    const txn = String(
      item.transactionId ||
        item.transaction_id ||
        item.txn_id ||
        item.vnp_TxnRef ||
        ''
    ).trim();

    if (isCodeMatch(code, variants) || isCodeMatch(txn, variants)) {
      return item;
    }
  }

  if (variants.length > 0 && list.length > 0) {
    const first = list[0];
    if (first && typeof first === 'object') {
      const hasItems =
        Array.isArray(first.items) ||
        Array.isArray(first.orderItems) ||
        Array.isArray(first.order_items) ||
        Array.isArray(first.details) ||
        Array.isArray(first.products);
      if (hasItems) return first;
    }
  }

  return null;
}

function mapRawOrderToViewModel(
  rawOrder: any,
  fallback: {
    orderCode?: string;
    txnRef?: string;
    bankTranNo?: string;
    vnpAmountVnd?: number;
    paymentParam?: string | null;
    vnpTxnRef?: string | null;
  }
): OrderViewModel {
  const ship =
    rawOrder?.shippingAddressSnapshot ||
    rawOrder?.shippingInfo ||
    rawOrder?.shipping_info ||
    rawOrder?.customer ||
    {};

  const addrParts = [
    ship.addressLine ||
      ship.address ||
      ship.street ||
      rawOrder?.shipping_address ||
      rawOrder?.shippingAddress ||
      rawOrder?.address ||
      '',
    ship.ward || rawOrder?.ward || '',
    ship.district || rawOrder?.district || '',
    ship.city || ship.province || rawOrder?.city || '',
  ].filter(Boolean);

  const fullAddr =
    rawOrder?.shipping_address ||
    rawOrder?.shippingAddress ||
    ship.fullAddress ||
    (addrParts.length > 0 ? addrParts.join(', ') : '') ||
    ship.address ||
    '';

  const rawItems = Array.isArray(rawOrder?.items)
    ? rawOrder.items
    : Array.isArray(rawOrder?.orderItems)
      ? rawOrder.orderItems
      : Array.isArray(rawOrder?.order_items)
        ? rawOrder.order_items
        : Array.isArray(rawOrder?.details)
          ? rawOrder.details
          : Array.isArray(rawOrder?.products)
            ? rawOrder.products
            : [];

  const items: OrderItem[] = rawItems.map((it: any) => ({
    name:
      it.productNameSnapshot ||
      it.product_name ||
      it.name ||
      it.productName ||
      it.title ||
      it.product?.name ||
      'Sản phẩm',
    price: Number(
      it.price ??
        it.unit_price ??
        it.unitPrice ??
        it.product?.price ??
        0
    ),
    quantity: Number(it.quantity ?? it.qty ?? 1),
  }));

  const resolvedCode = String(
    rawOrder?.orderCode || rawOrder?.order_code || fallback.orderCode || ''
  ).trim();

  const resolvedTxn = String(
    fallback.txnRef ||
      rawOrder?.transactionId ||
      rawOrder?.transaction_id ||
      rawOrder?.txn_id ||
      resolvedCode ||
      'COD'
  ).trim();

  const numericAmount = Number(
    rawOrder?.finalAmount ??
      rawOrder?.final_amount ??
      rawOrder?.totalAmount ??
      rawOrder?.total_amount ??
      rawOrder?.amount ??
      0
  );

  const resolvedAmount =
    numericAmount > 0
      ? numericAmount
      : fallback.vnpAmountVnd && fallback.vnpAmountVnd > 0
        ? fallback.vnpAmountVnd
        : items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const userFallback = getFallbackUserShipping();
  const resolvedName = String(
    ship.recipientName ||
      ship.fullName ||
      ship.name ||
      rawOrder?.recipientName ||
      rawOrder?.receiver_name ||
      rawOrder?.customerName ||
      rawOrder?.customer_name ||
      userFallback.fullName ||
      ''
  ).trim();
  const resolvedPhone = String(
    ship.phone ||
      ship.phoneNumber ||
      rawOrder?.phone ||
      rawOrder?.receiver_phone ||
      rawOrder?.customerPhone ||
      userFallback.phone ||
      ''
  ).trim();
  const resolvedAddress = String(fullAddr || userFallback.address || '').trim();

  return {
    orderCode: resolvedCode || undefined,
    txnRef: resolvedTxn,
    bankTranNo:
      fallback.bankTranNo ||
      rawOrder?.bankTranNo ||
      rawOrder?.vnp_BankTranNo ||
      undefined,
    items,
    shippingInfo: {
      fullName: resolvedName,
      phone: resolvedPhone,
      address: resolvedAddress,
      fullAddress: resolvedAddress,
    },
    amount: resolvedAmount,
    method: resolveMethodLabel({
      paymentParam: fallback.paymentParam,
      vnpTxnRef: fallback.vnpTxnRef,
      rawMethod:
        rawOrder?.paymentMethod || rawOrder?.payment_method || rawOrder?.method,
    }),
  };
}

function findMatchingStoredOrder(
  targetCode: string,
  targetTxnRef: string
): any | null {
  const variants = Array.from(
    new Set([
      ...normalizeCodeVariants(targetCode),
      ...normalizeCodeVariants(targetTxnRef),
    ])
  );

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('vnpay_order_')) continue;
    const keySuffix = key.replace(/^vnpay_order_/, '');
    if (!isCodeMatch(keySuffix, variants)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const orderObj = parsed?.data || parsed?.order || parsed;
      if (orderObj && typeof orderObj === 'object') {
        return orderObj;
      }
    } catch {
      // Bỏ qua JSON lỗi
    }
  }

  for (const key of ORDER_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const orderObj = parsed?.data || parsed?.order || parsed;
      if (!orderObj || typeof orderObj !== 'object') continue;

      const savedCode = String(
        orderObj.orderCode || orderObj.order_code || ''
      ).trim();
      const savedTxn = String(
        orderObj.txnId ||
          orderObj.transactionId ||
          orderObj.transaction_id ||
          orderObj.txn_id ||
          orderObj.vnp_TxnRef ||
          ''
      ).trim();

      if (isCodeMatch(savedCode, variants) || isCodeMatch(savedTxn, variants)) {
        return orderObj;
      }
    } catch {
      // Bỏ qua JSON lỗi
    }
  }

  return findOrderInList(getAllLocalOrders(), targetCode, targetTxnRef);
}

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateOrder =
    (location.state as any)?.order ||
    (location.state as any)?.orderData ||
    (location.state as any)?.data ||
    null;

  const paymentParam =
    searchParams.get('payment') ||
    searchParams.get('method') ||
    (location.state as any)?.paymentMethod ||
    null;
  const statusParam = searchParams.get('status');
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const vnpTxnRef = (searchParams.get('vnp_TxnRef') || '').trim();
  const vnpBankTranNo = (searchParams.get('vnp_BankTranNo') || '').trim();
  const rawVnpAmount = Number(searchParams.get('vnp_Amount') || 0);
  const vnpAmountVnd = rawVnpAmount > 0 ? Math.round(rawVnpAmount / 100) : 0;

  const orderCodeParam = (
    searchParams.get('orderCode') ||
    searchParams.get('order_code') ||
    stateOrder?.orderCode ||
    stateOrder?.order_code ||
    vnpTxnRef ||
    ''
  ).trim();

  const txnIdParam = (
    searchParams.get('txnId') ||
    searchParams.get('transaction_id') ||
    stateOrder?.transactionId ||
    stateOrder?.transaction_id ||
    vnpTxnRef ||
    ''
  ).trim();

  const [orderData, setOrderData] = useState<OrderViewModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (vnpResponseCode && vnpResponseCode !== '00') {
      navigate(
        `/order-failed?vnp_ResponseCode=${encodeURIComponent(vnpResponseCode)}`,
        { replace: true }
      );
      return;
    }

    const isPayPalSuccess =
      (paymentParam || '').toLowerCase() === 'paypal' &&
      statusParam === 'success';
    const isVNPaySuccess =
      Boolean(vnpTxnRef) && (!vnpResponseCode || vnpResponseCode === '00');
    const isCodOrder = (paymentParam || '').toLowerCase() === 'cod';

    const matchedSource =
      stateOrder || findMatchingStoredOrder(orderCodeParam, txnIdParam);
    const userFallback = getFallbackUserShipping();

    if (matchedSource) {
      const vm = mapRawOrderToViewModel(matchedSource, {
        orderCode: orderCodeParam,
        txnRef: txnIdParam,
        bankTranNo: vnpBankTranNo || undefined,
        vnpAmountVnd,
        paymentParam,
        vnpTxnRef,
      });
      setOrderData(vm);
      const persistKey = vm.orderCode || orderCodeParam || txnIdParam;
      if (persistKey) {
        try {
          localStorage.setItem(`vnpay_order_${persistKey}`, JSON.stringify(vm));
        } catch {
          // Bỏ qua nếu đầy bộ nhớ
        }
      }
    } else if (
      isPayPalSuccess ||
      isVNPaySuccess ||
      isCodOrder ||
      orderCodeParam ||
      txnIdParam
    ) {
      const vm: OrderViewModel = {
        orderCode: orderCodeParam || undefined,
        txnRef: txnIdParam || orderCodeParam || 'COD',
        bankTranNo: vnpBankTranNo || undefined,
        items: [],
        shippingInfo: {
          fullName: userFallback.fullName,
          phone: userFallback.phone,
          address: userFallback.address,
          fullAddress: userFallback.address,
        },
        amount: vnpAmountVnd,
        method: resolveMethodLabel({
          paymentParam,
          vnpTxnRef,
        }),
      };
      setOrderData(vm);
      const persistKey = vm.orderCode || orderCodeParam || txnIdParam;
      if (persistKey) {
        try {
          localStorage.setItem(`vnpay_order_${persistKey}`, JSON.stringify(vm));
        } catch {
          // Bỏ qua nếu đầy bộ nhớ
        }
      }
    } else {
      setOrderData(null);
    }

    setLoading(false);
  }, [
    navigate,
    stateOrder,
    paymentParam,
    statusParam,
    vnpResponseCode,
    vnpTxnRef,
    vnpBankTranNo,
    vnpAmountVnd,
    orderCodeParam,
    txnIdParam,
  ]);

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

  const displayedAddress =
    orderData.shippingInfo.fullAddress || orderData.shippingInfo.address || '';

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
              <span className="font-bold text-slate-800">
                #{orderData.txnRef}
              </span>
              {orderData.orderCode ? (
                <>
                  {' '}
                  (Đơn{' '}
                  <span className="font-bold text-slate-800">
                    {orderData.orderCode}
                  </span>
                  )
                </>
              ) : null}
              {orderData.bankTranNo ? (
                <>
                  {' '}
                  • Mã ngân hàng:{' '}
                  <span className="font-bold text-slate-800">
                    {orderData.bankTranNo}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
          <div>
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Thông Tin Người Nhận</span>
            </h3>
            <p className="text-slate-600">
              <span className="font-medium">Họ tên:</span>{' '}
              {orderData.shippingInfo.fullName || 'Chưa cập nhật'}
            </p>
            <p className="text-slate-600">
              <span className="font-medium">Điện thoại:</span>{' '}
              {orderData.shippingInfo.phone || 'Chưa cập nhật'}
            </p>
            <p className="text-slate-600">
              <span className="font-medium">Địa chỉ:</span>{' '}
              {displayedAddress || 'Chưa cập nhật'}
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 mb-2">
              Hình Thức Thanh Toán
            </h3>
            <p className="font-medium text-blue-600">{orderData.method}</p>
            <p className="text-slate-500 mt-2">
              Trạng thái:{' '}
              <span className="text-emerald-600 font-bold">Thành công</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
            Sản Phẩm Đã Đặt
          </h3>
          {orderData.items.length > 0 ? (
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
          ) : (
            <div className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Đơn hàng đã thanh toán thành công qua cổng VNPay. Xem chi tiết từng sản phẩm trong mục Lịch sử đơn hàng.
              </span>
              <Link
                to="/customer/orders"
                className="font-bold text-blue-600 hover:underline"
              >
                Xem đơn hàng →
              </Link>
            </div>
          )}

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

export default OrderSuccessPage;