import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationPickerModal, type LocationResult } from '../../../../components/map/LocationPickerModal';
import { useCart } from '../../../../contexts/CartContext';
import { useAuth } from '../../../../contexts/AuthContext';

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

const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
};

const cardTitleStyle: React.CSSProperties = {
    margin: '0 0 18px 0',
    fontSize: '17px',
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    padding: '0 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 400,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease, background-color 0.15s ease'
};

const selectStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    padding: '0 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    outline: 'none',
    cursor: 'pointer'
};

const getPaymentCardStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px 16px',
    border: active ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
    backgroundColor: active ? '#eff6ff' : '#ffffff',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
});

export function CheckoutPage() {
    const navigate = useNavigate();
    const paypalContainerRef = useRef<HTMLDivElement | null>(null);
    const { selectedItems, removeSelectedItems } = useCart();
    const { user } = useAuth();
    const checkoutItems: CheckoutItem[] = selectedItems.map(item => ({
        variantId: item.variantId,
        name: item.product.name,
        price: item.variant.price,
        quantity: item.quantity
    }));
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay' | 'paypal'>('cod');
    const [loading, setLoading] = useState(false);
    const [verifyingPaypal, setVerifyingPaypal] = useState(false);
    const [pendingPaypalOrder, setPendingPaypalOrder] = useState<CreatedOrderContext | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedMapLocation, setSelectedMapLocation] = useState<LocationResult | null>(null);

    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
        fullName: '',
        phone: '',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: '',
        address: ''
    });

    useEffect(() => {
        try {
            if (user) {
                const userData: any = user;
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
                    ward: userData.ward || '',
                    address: userData.address || userData.shippingAddress || userData.street || ''
                }));
            }

        } catch (error) {
            console.error('Lỗi đọc dữ liệu:', error);
        }
    }, [user]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
        setShippingInfo(prev => ({ ...prev, phone: onlyDigits }));
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCity = e.target.value;
        const districts = LOCATION_DATA[selectedCity] || [];
        setSelectedMapLocation(null);
        setShippingInfo(prev => ({
            ...prev,
            city: selectedCity,
            district: districts[0] || ''
        }));
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMapLocation(null);
        setShippingInfo(prev => ({
            ...prev,
            district: e.target.value
        }));
    };

    const handleMapLocationSelect = (loc: LocationResult) => {
        setSelectedMapLocation(loc);
        setShippingInfo(prev => ({
            ...prev,
            city: loc.city || prev.city,
            district: loc.district || prev.district,
            ward: loc.ward || prev.ward,
            address: loc.fullAddress.startsWith('Toạ độ:') ? '' : (loc.address || loc.fullAddress || prev.address)
        }));
    };

    const totalAmount = checkoutItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
    );

    const removePurchasedItems = () => removeSelectedItems(checkoutItems.flatMap(item => item.variantId ? [item.variantId] : []));

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

            if (orderRecord?.orderCode) {
                localStorage.setItem(
                    `vnpay_order_${String(orderRecord.orderCode).trim()}`,
                    JSON.stringify(orderRecord)
                );
            }
        } catch (err) {
            console.error('Lỗi lưu đồng bộ đơn hàng:', err);
        }
    };

    const verifyPaypalOnBackend = async (paypalOrderId: string, orderCtx: CreatedOrderContext) => {
        setVerifyingPaypal(true);
        try {
            const res = await fetch(`${API_BASE}/verify_paypal.php`, {
                method: 'POST',
                credentials: 'include',
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

            removePurchasedItems();
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
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            const backendPaymentMethod =
                paymentMethod === 'vnpay'
                    ? 'BANK_TRANSFER'
                    : paymentMethod === 'paypal'
                        ? 'PAYPAL'
                        : 'COD';

            const createRes = await fetch(`${API_BASE}/customer/orders.php?action=create`, {
                method: 'POST',
                credentials: 'include',
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
                        city: shippingInfo.city.trim(),
                        ...(selectedMapLocation ? { lat: selectedMapLocation.lat, lng: selectedMapLocation.lng } : {})
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

            const fullAddress = [
                shippingInfo.address.trim(),
                shippingInfo.ward.trim(),
                shippingInfo.district.trim(),
                shippingInfo.city.trim()
            ].filter(Boolean).join(', ');

            const orderData = {
                id: dbOrder.id ?? orderCode,
                orderCode,
                items: checkoutItems,
                shippingInfo: {
                    ...shippingInfo,
                    fullAddress
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
                    credentials: 'include',
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

            removePurchasedItems();
            navigate(`/order-success?vnp_ResponseCode=00&vnp_TxnRef=${encodeURIComponent(orderCode)}`);
        } catch (error: any) {
            console.error('Lỗi đặt hàng:', error);
            alert(error?.message || 'Có lỗi xảy ra khi tạo đơn hàng!');
            setLoading(false);
        }
    };

    const cityOptions = [...new Set([...CITY_LIST, shippingInfo.city].filter(Boolean))];
    const districtOptions = [...new Set([...(LOCATION_DATA[shippingInfo.city] || []), shippingInfo.district].filter(Boolean))];
    const isSubmitDisabled = loading || verifyingPaypal || checkoutItems.length === 0;

    const getDynamicInputStyle = (fieldKey: string): React.CSSProperties => ({
        ...inputStyle,
        borderColor: focusedField === fieldKey ? '#2563eb' : '#cbd5e1',
        backgroundColor: focusedField === fieldKey ? '#ffffff' : '#f8fafc',
        boxShadow: focusedField === fieldKey ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none'
    });

    const getDynamicSelectStyle = (fieldKey: string): React.CSSProperties => ({
        ...selectStyle,
        borderColor: focusedField === fieldKey ? '#2563eb' : '#cbd5e1',
        backgroundColor: focusedField === fieldKey ? '#ffffff' : '#f8fafc',
        boxShadow: focusedField === fieldKey ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none'
    });

    return (
        <div style={{
            minHeight: '75vh',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: '32px 16px 56px',
            fontFamily: 'Inter, system-ui, -apple-system, Arial, sans-serif'
        }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: '#475569',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginBottom: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            ← Quay lại
                        </button>
                        <h2 style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: 800,
                            color: '#0f172a',
                            letterSpacing: '-0.02em'
                        }}>
                            Thanh Toán Đơn Hàng
                        </h2>
                    </div>

                    <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#2563eb',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '6px 12px',
                        borderRadius: '999px'
                    }}>
                        Bước 2/2 • Xác nhận & Thanh toán
                    </div>
                </div>

                <form onSubmit={handleOrderSubmit} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1.6', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h4 style={{ ...cardTitleStyle, marginBottom: 0 }}>
                                    <span>📍</span>
                                    <span>Địa Chỉ Nhận Hàng</span>
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setShowMapModal(true)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '7px 14px',
                                        borderRadius: '10px',
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        color: '#1d4ed8',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span>🗺️ Chọn trên bản đồ</span>
                                </button>
                            </div>

                            {selectedMapLocation && (
                                <div style={{
                                    marginBottom: '16px',
                                    padding: '10px 14px',
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    color: '#166534',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '8px'
                                }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <span style={{ fontWeight: 700 }}>✓ Đã định vị bản đồ: </span>
                                        <span>{selectedMapLocation.fullAddress}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowMapModal(true)}
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            color: '#2563eb',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontSize: '11px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        Đổi vị trí
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                                    <label style={labelStyle}>
                                        <span>Họ và tên <span style={{ color: '#ef4444' }}>*</span></span>
                                        <input
                                            type="text"
                                            value={shippingInfo.fullName}
                                            onFocus={() => setFocusedField('fullName')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={e => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                                            placeholder="Nhập họ tên người nhận"
                                            required
                                            style={getDynamicInputStyle('fullName')}
                                        />
                                    </label>

                                    <label style={labelStyle}>
                                        <span>Số điện thoại <span style={{ color: '#ef4444' }}>*</span></span>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={11}
                                            placeholder="Ví dụ: 0901234567"
                                            value={shippingInfo.phone}
                                            onFocus={() => setFocusedField('phone')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={handlePhoneChange}
                                            required
                                            style={getDynamicInputStyle('phone')}
                                        />
                                    </label>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                                    <label style={labelStyle}>
                                        <span>Tỉnh / Thành phố <span style={{ color: '#ef4444' }}>*</span></span>
                                        <select
                                            value={shippingInfo.city}
                                            onFocus={() => setFocusedField('city')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={handleCityChange}
                                            required
                                            style={getDynamicSelectStyle('city')}
                                        >
                                            {cityOptions.map(cityName => (
                                                <option key={cityName} value={cityName}>
                                                    {cityName}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label style={labelStyle}>
                                        <span>Quận / Huyện <span style={{ color: '#ef4444' }}>*</span></span>
                                        <select
                                            value={shippingInfo.district}
                                            onFocus={() => setFocusedField('district')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={handleDistrictChange}
                                            required
                                            style={getDynamicSelectStyle('district')}
                                        >
                                            {districtOptions.map(districtName => (
                                                <option key={districtName} value={districtName}>
                                                    {districtName}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <label style={labelStyle}>
                                    <span>Địa chỉ cụ thể <span style={{ color: '#ef4444' }}>*</span></span>
                                    <input
                                        type="text"
                                        value={shippingInfo.address}
                                        onFocus={() => setFocusedField('address')}
                                        onBlur={() => setFocusedField(null)}
                                        onChange={e => {
                                            setSelectedMapLocation(null);
                                            setShippingInfo({ ...shippingInfo, address: e.target.value });
                                        }}
                                        placeholder="Số nhà, tên đường, tòa nhà..."
                                        required
                                        style={getDynamicInputStyle('address')}
                                    />
                                </label>
                            </div>
                        </div>

                        <div style={cardStyle}>
                            <h4 style={cardTitleStyle}>
                                <span>💳</span>
                                <span>Phương Thức Thanh Toán</span>
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={getPaymentCardStyle(paymentMethod === 'cod')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => {
                                                setPaymentMethod('cod');
                                                setPendingPaypalOrder(null);
                                            }}
                                            style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                                                Thanh toán khi nhận hàng (COD)
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                Kiểm tra thiết bị trước khi thanh toán tiền mặt cho shipper
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#059669',
                                        backgroundColor: '#ecfdf5',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}>
                                        Phổ biến
                                    </span>
                                </label>

                                <label style={getPaymentCardStyle(paymentMethod === 'vnpay')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="vnpay"
                                            checked={paymentMethod === 'vnpay'}
                                            onChange={() => {
                                                setPaymentMethod('vnpay');
                                                setPendingPaypalOrder(null);
                                            }}
                                            style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                                                Thanh toán VNPay QR Sandbox
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                Quét mã QR hoặc thẻ ngân hàng nội địa qua cổng VNPay
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#2563eb',
                                        backgroundColor: '#dbeafe',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}>
                                        QR / ATM
                                    </span>
                                </label>

                                <label style={getPaymentCardStyle(paymentMethod === 'paypal')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="paypal"
                                            checked={paymentMethod === 'paypal'}
                                            onChange={() => setPaymentMethod('paypal')}
                                            style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                                                Thanh toán Quốc tế PayPal Sandbox
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                Thanh toán nhanh bằng tài khoản PayPal hoặc thẻ quốc tế
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#0369a1',
                                        backgroundColor: '#e0f2fe',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}>
                                        USD
                                    </span>
                                </label>
                            </div>

                            {pendingPaypalOrder && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid #93c5fd',
                                    backgroundColor: '#f0f7ff'
                                }}>
                                    <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', fontSize: '14px' }}>
                                        Đơn #{pendingPaypalOrder.orderCode} đã tạo — Hoàn tất thanh toán PayPal Sandbox
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px', lineHeight: 1.5 }}>
                                        Tổng tiền: <strong style={{ color: '#0f172a' }}>{pendingPaypalOrder.finalAmount.toLocaleString('vi-VN')} đ</strong> (~${Math.max(1, Number((pendingPaypalOrder.finalAmount / 25000).toFixed(2))).toFixed(2)} USD). Giao dịch sẽ được xác thực trực tiếp ở backend qua <code>verify_paypal.php</code>.
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
                                                borderRadius: '8px',
                                                fontWeight: 700,
                                                fontSize: '13px',
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

                    <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px', width: '100%' }}>
                        <div style={{ ...cardStyle, position: 'sticky', top: '20px' }}>
                            <h4 style={cardTitleStyle}>
                                <span>📦</span>
                                <span>Tóm Tắt Đơn Hàng</span>
                            </h4>

                            <div style={{
                                maxHeight: '260px',
                                overflowY: 'auto',
                                marginBottom: '16px',
                                paddingRight: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {checkoutItems.map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            paddingBottom: '12px',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', lineHeight: 1.35 }}>
                                                {item.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                                                SL: {item.quantity}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                            {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                paddingTop: '12px',
                                borderTop: '1px solid #e2e8f0',
                                marginBottom: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                                    <span>Tạm tính ({checkoutItems.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
                                    <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '6px' }}>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>Tổng thanh toán:</strong>
                                    <strong style={{ color: '#e11d48', fontSize: '21px', fontWeight: 800 }}>
                                        {totalAmount.toLocaleString('vi-VN')} đ
                                    </strong>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitDisabled}
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    background: isSubmitDisabled
                                        ? '#cbd5e1'
                                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    letterSpacing: '0.04em',
                                    cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                                    textTransform: 'uppercase',
                                    boxShadow: isSubmitDisabled ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.25)'
                                }}
                            >
                                {loading ? 'Đang xử lý...' : 'ĐẶT HÀNG NGAY'}
                            </button>

                            <div style={{
                                marginTop: '12px',
                                textAlign: 'center',
                                fontSize: '12px',
                                color: '#64748b'
                            }}>
                                🔒 Thông tin đơn hàng được bảo mật & đồng bộ trực tiếp
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <LocationPickerModal
                isOpen={showMapModal}
                onClose={() => setShowMapModal(false)}
                onSelectLocation={handleMapLocationSelect}
                initialAddress={shippingInfo.address ? `${shippingInfo.address}, ${shippingInfo.district}, ${shippingInfo.city}` : undefined}
                initialLat={selectedMapLocation?.lat}
                initialLng={selectedMapLocation?.lng}
                title="Chọn vị trí nhận hàng chính xác"
            />
        </div>
    );
}
