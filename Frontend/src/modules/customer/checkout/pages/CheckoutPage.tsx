import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface CheckoutItem {
    variantId?: number;
    name: string;
    price: number;
    quantity: number;
}

interface ShippingInfo {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    ward: string;
    address: string;
}

interface CreatedOrderContext {
    id: number | string;
    orderCode: string;
    finalAmount: number;
    orderData: any;
}

declare global {
    interface Window {
        paypal?: any;
    }
}

const API_BASE = 'http://localhost/TechMart/Backend/api';
const PAYPAL_CLIENT_ID = (import.meta as any)?.env?.VITE_PAYPAL_CLIENT_ID || '';

const LOCATION_DATA: Record<string, string[]> = {
    'TP. Hồ Chí Minh': [
        'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7',
        'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh',
        'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân',
        'TP. Thủ Đức', 'Bình Chánh', 'Hóc Môn', 'Củ Chi', 'Nhà Bè', 'Cần Giờ'
    ],
    'Hà Nội': [
        'Ba Đình', 'Hoàn Kiếm', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy',
        'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Hà Đông', 'Tây Hồ',
        'Nam Từ Liêm', 'Bắc Từ Liêm', 'Đông Anh', 'Gia Lâm', 'Thanh Trì'
    ],
    'Đà Nẵng': [
        'Hải Châu', 'Thanh Khê', 'Liên Chiểu', 'Cẩm Lệ', 'Ngũ Hành Sơn',
        'Sơn Trà', 'Hòa Vang'
    ],
    'Cần Thơ': [
        'Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt',
        'Phong Điền', 'Thới Lai'
    ],
    'Hải Phòng': [
        'Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An',
        'Đồ Sơn', 'Dương Kinh', 'Thủy Nguyên'
    ],
    'Bình Dương': [
        'Thủ Dầu Một', 'Dĩ An', 'Thuận An', 'Tân Uyên', 'Bến Cát', 'Bàu Bàng'
    ],
    'Đồng Nai': [
        'Biên Hòa', 'Long Khánh', 'Long Thành', 'Nhơn Trạch', 'Trảng Bom', 'Vĩnh Cửu'
    ]
};

const CITY_LIST = Object.keys(LOCATION_DATA);

function getAuthToken(): string {
    const keys = ['token', 'authToken', 'accessToken', 'jwt', 'auth_token'];
    for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val && val.trim() !== '') {
            return val.replace(/^Bearer\s+/i, '').trim();
        }
    }
    const userKeys = ['currentUser', 'user', 'auth_user', 'loggedUser'];
    for (const uKey of userKeys) {
        const raw = localStorage.getItem(uKey);
        if (!raw) continue;
        try {
            const parsed = JSON.parse(raw);
            const embedded = parsed?.token || parsed?.accessToken || parsed?.authToken;
            if (typeof embedded === 'string' && embedded.trim() !== '') {
                return embedded.replace(/^Bearer\s+/i, '').trim();
            }
        } catch {
            // Bỏ qua nếu không phải JSON
        }
    }
    return '';
}

function resolveVariantId(item: any, fallbackCart: any[], index: number): number | undefined {
    const candidates = [
        item?.variantId,
        item?.variant_id,
        item?.variant?.id,
        item?.productVariantId,
        fallbackCart[index]?.variantId,
        fallbackCart[index]?.variant_id,
        fallbackCart[index]?.variant?.id,
        item?.id
    ];
    for (const c of candidates) {
        const num = Number(c);
        if (Number.isInteger(num) && num > 0) {
            return num;
        }
    }
    return undefined;
}

export function CheckoutPage() {
    const navigate = useNavigate();
    const paypalContainerRef = useRef<HTMLDivElement | null>(null);

    const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay' | 'paypal'>('cod');
    const [loading, setLoading] = useState(false);
    const [verifyingPaypal, setVerifyingPaypal] = useState(false);
    const [pendingPaypalOrder, setPendingPaypalOrder] = useState<CreatedOrderContext | null>(null);

    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
        fullName: '',
        phone: '',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Bến Nghé',
        address: ''
    });

    useEffect(() => {
        try {
            const currentUserStr = localStorage.getItem('currentUser') ||
                                   localStorage.getItem('user') ||
                                   localStorage.getItem('auth_user') ||
                                   localStorage.getItem('loggedUser');

            if (currentUserStr) {
                let userData: any = currentUserStr;
                try {
                    userData = JSON.parse(currentUserStr);
                } catch {
                    userData = { fullName: currentUserStr, name: currentUserStr };
                }

                const rawCity = userData.city || userData.province || 'TP. Hồ Chí Minh';
                const resolvedCity = LOCATION_DATA[rawCity] ? rawCity : 'TP. Hồ Chí Minh';
                const availableDistricts = LOCATION_DATA[resolvedCity];
                const rawDistrict = userData.district || 'Quận 1';
                const resolvedDistrict = availableDistricts.includes(rawDistrict)
                    ? rawDistrict
                    : availableDistricts[0];

                const rawPhone = String(userData.phone || userData.phoneNumber || userData.tel || '');
                const digitsOnlyPhone = rawPhone.replace(/\D/g, '').slice(0, 11);

                setShippingInfo(prev => ({
                    ...prev,
                    fullName: userData.fullName || userData.name || userData.username || '',
                    phone: digitsOnlyPhone,
                    city: resolvedCity,
                    district: resolvedDistrict,
                    ward: userData.ward || 'Bến Nghé',
                    address: userData.address || userData.shippingAddress || userData.street || ''
                }));
            }

            const storedItemsStr = localStorage.getItem('checkoutItems');
            const rawItems = storedItemsStr ? JSON.parse(storedItemsStr) : [];
            const fallbackCartStr = localStorage.getItem('cart') ||
                                    localStorage.getItem('cartItems') ||
                                    localStorage.getItem('cart_items') || '[]';
            let fallbackCart: any[] = [];
            try {
                const parsedCart = JSON.parse(fallbackCartStr);
                fallbackCart = Array.isArray(parsedCart) ? parsedCart : (parsedCart?.items || []);
            } catch {
                fallbackCart = [];
            }

            const formattedItems: CheckoutItem[] = Array.isArray(rawItems)
                ? rawItems.map((item: any, idx: number) => ({
                    variantId: resolveVariantId(item, fallbackCart, idx),
                    name: item.name || item.product?.name || 'Sản phẩm công nghệ',
                    price: Number(item.price !== undefined ? item.price : (item.variant?.price || 0)),
                    quantity: Number(item.quantity || 1)
                }))
                : [];

            setCheckoutItems(formattedItems);
        } catch (error) {
            console.error('Lỗi đọc dữ liệu:', error);
            setCheckoutItems([]);
        }
    }, []);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
        setShippingInfo(prev => ({ ...prev, phone: onlyDigits }));
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCity = e.target.value;
        const districts = LOCATION_DATA[selectedCity] || [];
        setShippingInfo(prev => ({
            ...prev,
            city: selectedCity,
            district: districts[0] || ''
        }));
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setShippingInfo(prev => ({
            ...prev,
            district: e.target.value
        }));
    };

    const totalAmount = checkoutItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
    );

    const clearCartStorage = () => {
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('cart');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cart_items');
    };

    const saveLocalOrderSnapshot = (orderRecord: any) => {
        try {
            const currentUserStr = localStorage.getItem('currentUser') ||
                                   localStorage.getItem('user') ||
                                   localStorage.getItem('auth_user') || 'default_user';

            const userKey = `orders_${currentUserStr}`;
            const existingOrders = JSON.parse(localStorage.getItem(userKey) || '[]');
            existingOrders.unshift(orderRecord);
            localStorage.setItem(userKey, JSON.stringify(existingOrders));

            const globalOrdersKey = 'customer_orders';
            const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
            globalOrders.unshift(orderRecord);
            localStorage.setItem(globalOrdersKey, JSON.stringify(globalOrders));

            const sellerOrdersKey = 'seller_orders';
            const sellerOrders = JSON.parse(localStorage.getItem(sellerOrdersKey) || '[]');
            sellerOrders.unshift(orderRecord);
            localStorage.setItem(sellerOrdersKey, JSON.stringify(sellerOrders));
        } catch (err) {
            console.error('Lỗi lưu đồng bộ đơn hàng:', err);
        }
    };

    const verifyPaypalOnBackend = async (paypalOrderId: string, orderCtx: CreatedOrderContext) => {
        setVerifyingPaypal(true);
        try {
            const res = await fetch(`${API_BASE}/verify_paypal.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderID: paypalOrderId,
                    internalOrderId: orderCtx.id,
                    orderCode: orderCtx.orderCode
                })
            });

            const data = await res.json();
            if (!res.ok || !data?.success) {
                throw new Error(data?.message || data?.error || 'Xác thực giao dịch PayPal ở backend thất bại.');
            }

            const paidSnapshot = {
                ...orderCtx.orderData,
                paymentStatus: 'paid',
                transactionId: data.captureId || paypalOrderId
            };
            saveLocalOrderSnapshot(paidSnapshot);
            localStorage.setItem('pendingPayPalOrder', JSON.stringify(paidSnapshot));

            clearCartStorage();
            setPendingPaypalOrder(null);
            navigate(
                `/order-success?payment=paypal&status=success&orderCode=${encodeURIComponent(orderCtx.orderCode)}&txnId=${encodeURIComponent(data.captureId || paypalOrderId)}`
            );
        } catch (err: any) {
            console.error('Lỗi xác thực PayPal:', err);
            alert(err?.message || 'Không thể xác thực giao dịch PayPal với máy chủ.');
        } finally {
            setVerifyingPaypal(false);
        }
    };

    // Render nút PayPal JS SDK khi có VITE_PAYPAL_CLIENT_ID và đã tạo đơn chờ thanh toán
    useEffect(() => {
        if (!pendingPaypalOrder || !PAYPAL_CLIENT_ID || !paypalContainerRef.current) return;

        const container = paypalContainerRef.current;
        container.innerHTML = '';

        const renderButtons = () => {
            if (!window.paypal || !paypalContainerRef.current) return;
            window.paypal.Buttons({
                createOrder: (_data: any, actions: any) => {
                    const usdAmount = Math.max(1, Number((pendingPaypalOrder.finalAmount / 25000).toFixed(2)));
                    return actions.order.create({
                        purchase_units: [{
                            reference_id: pendingPaypalOrder.orderCode,
                            custom_id: String(pendingPaypalOrder.id),
                            amount: {
                                currency_code: 'USD',
                                value: usdAmount.toFixed(2)
                            }
                        }]
                    });
                },
                onApprove: async (data: any, actions: any) => {
                    await actions.order.capture();
                    await verifyPaypalOnBackend(String(data.orderID), pendingPaypalOrder);
                },
                onError: (err: any) => {
                    console.error('PayPal SDK error:', err);
                    alert('Có lỗi xảy ra trong luồng thanh toán PayPal Sandbox.');
                }
            }).render(paypalContainerRef.current);
        };

        if (window.paypal) {
            renderButtons();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD`;
        script.async = true;
        script.onload = renderButtons;
        document.body.appendChild(script);
    }, [pendingPaypalOrder]);

    const validateFormBeforeSubmit = (): boolean => {
        if (checkoutItems.length === 0) {
            alert('Giỏ hàng thanh toán đang trống!');
            navigate('/cart');
            return false;
        }

        if (totalAmount <= 0) {
            alert('Tổng tiền đơn hàng không hợp lệ!');
            return false;
        }

        if (!shippingInfo.fullName.trim() || !shippingInfo.phone.trim() || !shippingInfo.address.trim()) {
            alert('Vui lòng nhập đầy đủ thông tin nhận hàng!');
            return false;
        }

        if (!/^0\d{9,10}$/.test(shippingInfo.phone)) {
            alert('Số điện thoại phải gồm 10-11 chữ số và bắt đầu bằng số 0!');
            return false;
        }

        const missingVariant = checkoutItems.some(i => !i.variantId || i.variantId < 1);
        if (missingVariant) {
            alert('Thiếu thông tin biến thể sản phẩm (variantId) để lưu đơn xuống CSDL. Hãy chọn sản phẩm trực tiếp từ danh mục/giỏ hàng.');
            return false;
        }

        return true;
    };

    const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (loading || verifyingPaypal) return;
        if (!validateFormBeforeSubmit()) return;

        setLoading(true);

        try {
            const token = getAuthToken();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const backendPaymentMethod =
                paymentMethod === 'vnpay'
                    ? 'BANK_TRANSFER'
                    : paymentMethod === 'paypal'
                        ? 'PAYPAL'
                        : 'COD';

            const createRes = await fetch(`${API_BASE}/customer/orders.php?action=create`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    items: checkoutItems.map(item => ({
                        variantId: item.variantId,
                        quantity: item.quantity
                    })),
                    shippingAddress: {
                        recipientName: shippingInfo.fullName.trim(),
                        phone: shippingInfo.phone.trim(),
                        addressLine: shippingInfo.address.trim(),
                        ward: shippingInfo.ward.trim(),
                        district: shippingInfo.district.trim(),
                        city: shippingInfo.city.trim()
                    },
                    paymentMethod: backendPaymentMethod
                })
            });

            const createJson = await createRes.json();
            if (!createRes.ok || createJson?.status !== 'success' || !createJson?.data?.orderCode) {
                throw new Error(createJson?.message || `Không thể tạo đơn hàng (HTTP ${createRes.status})`);
            }

            const dbOrder = createJson.data;
            const orderCode: string = String(dbOrder.orderCode);
            const finalAmount: number = Number(dbOrder.finalAmount || totalAmount);

            const methodLabel =
                paymentMethod === 'cod'
                    ? 'Thanh toán khi nhận hàng (COD)'
                    : paymentMethod === 'vnpay'
                        ? 'VNPay QR Sandbox'
                        : 'PayPal Sandbox';

            const orderData = {
                id: dbOrder.id ?? orderCode,
                orderCode,
                items: checkoutItems,
                shippingInfo: {
                    ...shippingInfo,
                    fullAddress: `${shippingInfo.address}, ${shippingInfo.ward}, ${shippingInfo.district}, ${shippingInfo.city}`
                },
                amount: finalAmount,
                totalAmount: finalAmount,
                paymentMethod: methodLabel,
                method: methodLabel,
                status: 'Chờ xác nhận',
                createdAt: new Date().toISOString(),
                date: new Date().toISOString()
            };

            saveLocalOrderSnapshot(orderData);

            if (paymentMethod === 'vnpay') {
                localStorage.setItem('pendingVNPayOrder', JSON.stringify(orderData));
                const vnpRes = await fetch(`${API_BASE}/vnpay_create_payment.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderCode,
                        amount: finalAmount
                    })
                });

                if (!vnpRes.ok) {
                    throw new Error(`VNPay trả về HTTP ${vnpRes.status}`);
                }

                const vnpResult = await vnpRes.json();
                if (vnpResult.code === '00' && typeof vnpResult.data === 'string') {
                    clearCartStorage();
                    window.location.href = vnpResult.data;
                    return;
                }

                throw new Error(vnpResult.message || 'Không thể tạo giao dịch VNPay!');
            }

            if (paymentMethod === 'paypal') {
                localStorage.setItem('pendingPayPalOrder', JSON.stringify(orderData));
                setPendingPaypalOrder({
                    id: dbOrder.id ?? orderCode,
                    orderCode,
                    finalAmount,
                    orderData
                });
                setLoading(false);
                return;
            }

            clearCartStorage();
            navigate(`/order-success?vnp_ResponseCode=00&vnp_TxnRef=${encodeURIComponent(orderCode)}`);
        } catch (error: any) {
            console.error('Lỗi đặt hàng:', error);
            alert(error?.message || 'Có lỗi xảy ra khi tạo đơn hàng!');
            setLoading(false);
        }
    };

    const districtOptions = LOCATION_DATA[shippingInfo.city] || [];

    return (
        <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 15px', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ color: '#0d6efd', marginBottom: '25px', paddingBottom: '10px', borderBottom: '2px solid #0d6efd' }}>
                Thanh Toán Đơn Hàng
            </h2>

            <form onSubmit={handleOrderSubmit} style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <h4 style={{ marginBottom: '15px', fontSize: '18px', color: '#333' }}>📍 Địa Chỉ Nhận Hàng</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                Họ và tên
                                <input
                                    type="text"
                                    value={shippingInfo.fullName}
                                    onChange={e => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                                    required
                                    style={inputStyle}
                                />
                            </label>

                            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                Số điện thoại
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={11}
                                    placeholder="Ví dụ: 0901234567"
                                    value={shippingInfo.phone}
                                    onChange={handlePhoneChange}
                                    required
                                    style={inputStyle}
                                />
                            </label>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', flex: 1 }}>
                                    Tỉnh / Thành phố
                                    <select
                                        value={shippingInfo.city}
                                        onChange={handleCityChange}
                                        required
                                        style={selectStyle}
                                    >
                                        {CITY_LIST.map(cityName => (
                                            <option key={cityName} value={cityName}>
                                                {cityName}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', flex: 1 }}>
                                    Quận / Huyện
                                    <select
                                        value={shippingInfo.district}
                                        onChange={handleDistrictChange}
                                        required
                                        style={selectStyle}
                                    >
                                        {districtOptions.map(districtName => (
                                            <option key={districtName} value={districtName}>
                                                {districtName}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                Địa chỉ cụ thể
                                <input
                                    type="text"
                                    value={shippingInfo.address}
                                    onChange={e => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                    placeholder="Ví dụ: 123 Nguyễn Văn Cừ"
                                    required
                                    style={inputStyle}
                                />
                            </label>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <h4 style={{ marginBottom: '15px', fontSize: '18px', color: '#333' }}>💳 Phương Thức Thanh Toán</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={paymentStyle}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cod"
                                    checked={paymentMethod === 'cod'}
                                    onChange={() => {
                                        setPaymentMethod('cod');
                                        setPendingPaypalOrder(null);
                                    }}
                                />
                                <div><strong>Thanh toán khi nhận hàng (COD)</strong></div>
                            </label>
                            <label style={paymentStyle}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="vnpay"
                                    checked={paymentMethod === 'vnpay'}
                                    onChange={() => {
                                        setPaymentMethod('vnpay');
                                        setPendingPaypalOrder(null);
                                    }}
                                />
                                <div><strong>Thanh toán VNPay QR Sandbox</strong></div>
                            </label>
                            <label style={paymentStyle}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="paypal"
                                    checked={paymentMethod === 'paypal'}
                                    onChange={() => setPaymentMethod('paypal')}
                                />
                                <div><strong>Thanh toán Quốc tế PayPal Sandbox</strong></div>
                            </label>
                        </div>

                        {pendingPaypalOrder && (
                            <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid #0070ba',
                                backgroundColor: '#f0f7ff'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#003087', marginBottom: '6px' }}>
                                    Đơn #{pendingPaypalOrder.orderCode} đã tạo — Hoàn tất thanh toán PayPal Sandbox
                                </div>
                                <div style={{ fontSize: '13px', color: '#333', marginBottom: '12px' }}>
                                    Tổng tiền: <strong>{pendingPaypalOrder.finalAmount.toLocaleString('vi-VN')} đ</strong> (~${Math.max(1, Number((pendingPaypalOrder.finalAmount / 25000).toFixed(2))).toFixed(2)} USD). Giao dịch sẽ được xác thực trực tiếp ở backend qua <code>verify_paypal.php</code>.
                                </div>

                                {PAYPAL_CLIENT_ID ? (
                                    <div ref={paypalContainerRef} />
                                ) : (
                                    <button
                                        type="button"
                                        disabled={verifyingPaypal}
                                        onClick={() =>
                                            verifyPaypalOnBackend(
                                                `PAYPAL-SBX-${Date.now()}`,
                                                pendingPaypalOrder
                                            )
                                        }
                                        style={{
                                            padding: '10px 16px',
                                            backgroundColor: '#0070ba',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            cursor: verifyingPaypal ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {verifyingPaypal
                                            ? 'Đang xác thực với Backend...'
                                            : 'Xác nhận thanh toán PayPal Sandbox & Verify Backend'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ width: '380px', minWidth: '300px' }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: '20px' }}>
                        <h4 style={{ marginBottom: '15px', fontSize: '18px', color: '#333' }}>📦 Tóm Tắt Đơn Hàng</h4>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }}>
                            {checkoutItems.map((item, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>SL: {item.quantity}</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#dc3545', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                        {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ ...summaryStyle, marginBottom: '20px' }}>
                            <strong style={{ fontSize: '16px', color: '#333' }}>Tổng thanh toán:</strong>
                            <strong style={{ color: '#dc3545', fontSize: '20px' }}>
                                {totalAmount.toLocaleString('vi-VN')} đ
                            </strong>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || verifyingPaypal || checkoutItems.length === 0}
                            style={{
                                width: '100%', padding: '14px',
                                background: loading || verifyingPaypal || checkoutItems.length === 0 ? '#ccc' : '#0d6efd',
                                color: '#fff', border: 'none', borderRadius: '6px',
                                fontWeight: 'bold', fontSize: '15px',
                                cursor: loading || verifyingPaypal || checkoutItems.length === 0 ? 'not-allowed' : 'pointer',
                                textTransform: 'uppercase'
                            }}
                        >
                            {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG NGAY'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '10px',
    marginTop: '6px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontWeight: 'normal'
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: '#fff',
    cursor: 'pointer'
};

const paymentStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' };
const summaryStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' };