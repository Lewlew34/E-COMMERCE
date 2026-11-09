import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Check,
  Zap
} from 'lucide-react';
import { useCart } from '../../../../contexts/CartContext';
import { addressService, orderService } from '../../../../services/storageService';
import type { UserAddress, PaymentMethod } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedItems, selectedSubtotal, removeFromCart } = useCart();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  
  // Hỗ trợ chọn phương thức VNPAY
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'VNPAY'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal new address state
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('TP. Hồ Chí Minh');
  const [newDistrict, setNewDistrict] = useState('Quận 1');
  const [newWard, setNewWard] = useState('Phường Bến Nghé');
  const [newAddressLine, setNewAddressLine] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const userAddresses = addressService.getAll();
    setAddresses(userAddresses);
    const defaultAddr = userAddresses.find(a => a.isDefault) || userAddresses[0];
    if (defaultAddr) {
      setSelectedAddressId(defaultAddr.id);
    }
  }, []);

  if (selectedItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Không có thiết bị nào được chọn để thanh toán</h2>
        <p className="text-xs text-slate-500 mt-1">Vui lòng quay lại giỏ hàng và chọn ít nhất 1 sản phẩm.</p>
        <Link
          to="/cart"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại giỏ hàng</span>
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];
  const shippingFee = selectedSubtotal >= 500000 ? 0 : 30000;
  const finalTotal = selectedSubtotal + shippingFee;

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName.trim() || !newPhone.trim() || !newAddressLine.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin địa chỉ!', 'error');
      return;
    }

    const created = addressService.add({
      userId: 1,
      recipientName: newRecipientName,
      phone: newPhone,
      city: newCity,
      district: newDistrict,
      ward: newWard,
      addressLine: newAddressLine,
      isDefault: addresses.length === 0
    });

    setAddresses(addressService.getAll());
    setSelectedAddressId(created.id);
    setShowAddAddressModal(false);
    showToast('Đã thêm địa chỉ giao hàng mới!', 'success');
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      showToast('Vui lòng chọn địa chỉ giao hàng!', 'error');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderCode = `ORD-${dateStr}-${randomSuffix}`;

    const actualPaymentMethod: PaymentMethod = paymentMethod === 'VNPAY' ? 'BANK_TRANSFER' : paymentMethod;

    const newOrder = orderService.createOrder({
      userId: 1,
      orderCode,
      totalAmount: selectedSubtotal,
      shippingFee,
      finalAmount: finalTotal,
      paymentStatus: (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'VNPAY') ? 'paid' : 'pending',
      orderStatus: 'pending',
      paymentMethod: actualPaymentMethod,
      shippingAddressSnapshot: selectedAddress,
      items: selectedItems.map((item, index) => ({
        id: Date.now() + index,
        orderId: 0,
        variantId: item.variantId,
        productNameSnapshot: item.product.name,
        variantAttributesSnapshot: item.variant.attributes,
        price: item.variant.price,
        quantity: item.quantity,
        totalPrice: item.variant.price * item.quantity,
        image: item.variant.image
      }))
    });

    // Remove purchased items from cart
    selectedItems.forEach(item => {
      removeFromCart(item.variantId);
    });

    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/order-success/${newOrder.orderCode}`);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Link to="/cart" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Thanh Toán Đơn Hàng</h1>
          <p className="text-xs text-slate-500">Xác nhận thông tin giao nhận và phương thức thanh toán</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Addresses & Payment Methods (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Shipping Address */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Địa Chỉ Nhận Hàng</span>
              </h3>
              <button
                onClick={() => setShowAddAddressModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm địa chỉ mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-xs text-slate-900">{addr.recipientName}</div>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mb-1">{addr.phone}</div>
                    <div className="text-xs text-slate-600 leading-snug">
                      {addr.addressLine}, {addr.ward}, {addr.district}, {addr.city}
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Phương Thức Thanh Toán</span>
            </h3>

            <div className="space-y-3">
              {/* Option 1: COD */}
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kiểm tra ngoại quan thiết bị, tem bảo hành chính hãng trước khi thanh toán tiền mặt cho bưu tá.
                  </p>
                </div>
              </label>

              {/* Option 2: Bank Transfer VietQR */}
              <label
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'BANK_TRANSFER' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Chuyển khoản Ngân hàng (Quét mã VietQR 24/7)</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Khuyên dùng</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống xác thực giao dịch tức thì qua QR, miễn phí giao dịch mọi ngân hàng.
                  </p>

                  {paymentMethod === 'BANK_TRANSFER' && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center gap-4 text-xs animate-in fade-in">
                      <div className="w-24 h-24 bg-white p-1.5 rounded-lg shrink-0 flex items-center justify-center">
                        <QrCode className="w-20 h-20 text-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-slate-400 text-[11px]">Ngân hàng: <span className="text-white font-bold">MB Bank (Quân Đội)</span></div>
                        <div className="text-slate-400 text-[11px]">Số tài khoản: <span className="text-blue-400 font-mono font-bold">090123456789</span></div>
                        <div className="text-slate-400 text-[11px]">Chủ tài khoản: <span className="text-white font-bold">CONG TY CONG NGHE TECHMART VN</span></div>
                        <div className="text-slate-400 text-[11px]">Nội dung: <span className="text-amber-400 font-mono font-bold">TECHMART DEMO</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: VNPAY-QR (KHUNG QR BUNG RA KHI CHỌN) */}
              <label
                onClick={() => setPaymentMethod('VNPAY')}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'VNPAY' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'VNPAY'}
                  onChange={() => setPaymentMethod('VNPAY')}
                  className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Zap className="w-4 h-4 text-rose-600 fill-rose-600" />
                    <span>Cổng Thanh Toán VNPAY-QR / Thẻ Quốc Tế</span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">VNPAY</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Quét mã QR qua ứng dụng Mobile Banking bất kỳ hoặc thanh toán bằng thẻ Visa/Master/JCB.
                  </p>

                  {/* Khung giao diện quét mã QR VNPAY */}
                  {paymentMethod === 'VNPAY' && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row items-center gap-4 text-xs animate-in fade-in duration-200">
                      <div className="w-24 h-24 bg-white p-1.5 rounded-lg shrink-0 flex items-center justify-center shadow-md">
                        <img 
                          src={`https://api.vietqr.io/image/970436-123456789-n9Q581V.jpg?accountName=VNPAY%20GATEWAY&amount=${finalTotal}&addInfo=VNPAY_CHECKOUT`} 
                          alt="VNPAY QR Code" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-rose-400 font-bold flex items-center gap-1 text-xs">
                          <Zap className="w-3.5 h-3.5 fill-rose-400" /> Cổng VNPAY-QR Trực Tuyến
                        </div>
                        <div className="text-slate-300 text-[11px]">Đơn vị chấp nhận: <span className="text-white font-bold">TECHMART E-COMMERCE</span></div>
                        <div className="text-slate-300 text-[11px]">Số tiền thanh toán: <span className="text-blue-400 font-mono font-bold">{formatCurrencyVN(finalTotal)}</span></div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Mở app Ngân hàng (MB, Vietcombank, Agribank...) quét mã QR để hoàn tất.</div>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 4: Credit Card */}
              <label
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'CREDIT_CARD' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'CREDIT_CARD'}
                  onChange={() => setPaymentMethod('CREDIT_CARD')}
                  className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Thẻ Tín Dụng / Ghi Nợ Quốc Tế (Visa, MasterCard, JCB)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hỗ trợ trả góp 0% lãi suất lên tới 12 tháng qua thẻ tín dụng ngân hàng.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Review Ordered Items */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Danh Sách Thiết Bị Đặt Mua ({selectedItems.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {selectedItems.map((item) => (
                <div key={item.variantId} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.variant.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">{item.product.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {Object.values(item.variant.attributes).join(' • ')} x {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-blue-600">
                    {formatCurrencyVN(item.variant.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Price Breakdown & Confirmation CTA (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-xs sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Chi Tiết Thanh Toán
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span className="font-semibold text-slate-900">{formatCurrencyVN(selectedSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" /> Phí vận chuyển:
                </span>
                <span className={shippingFee === 0 ? 'text-emerald-600 font-bold' : 'font-semibold text-slate-900'}>
                  {shippingFee === 0 ? 'Miễn phí hỏa tốc' : formatCurrencyVN(shippingFee)}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-sm text-slate-900">
                <span>Số tiền thanh toán:</span>
                <span className="text-lg font-black text-blue-600">{formatCurrencyVN(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang tạo đơn hàng...' : 'Xác Nhận & Đặt Hàng Ngay'}</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bảo chứng TechMart</span>
              </div>
              <p>Mỗi đơn hàng đều được niêm phong hộp và có tem bảo hành điện tử chính hãng kích hoạt theo số Serial / IMEI.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add Address */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-4">Thêm Địa Chỉ Giao Hàng Mới</h3>
            <form onSubmit={handleAddNewAddress} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Họ và tên người nhận</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trần Văn Nam"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Số điện thoại liên hệ</label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    required
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phường / Xã</label>
                <input
                  type="text"
                  required
                  value={newWard}
                  onChange={(e) => setNewWard(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Địa chỉ cụ thể (Số nhà, tên đường, tòa nhà)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Căn hộ A12-04, Tòa Masteri"
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};