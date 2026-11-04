import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  ShoppingBag, 
  Minus, 
  Plus, 
  ArrowLeft,
  Truck
} from 'lucide-react';
import { useCart } from '../../../../contexts/CartContext';
import { formatCurrencyVN } from '../../../../utils/format';

export const CartPage: React.FC = () => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    selectedVariantIds, 
    toggleSelectItem, 
    selectAllItems, 
    selectedSubtotal, 
    selectedItems 
  } = useCart();
  const navigate = useNavigate();

  const isAllSelected = cart.length > 0 && selectedVariantIds.length === cart.length;
  const shippingFee = selectedSubtotal >= 500000 || selectedSubtotal === 0 ? 0 : 30000;
  const finalTotal = selectedSubtotal + shippingFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Bạn chưa chọn thiết bị công nghệ nào. Khám phá ngay các dòng Laptop, Smartphone và linh kiện đỉnh cao tại TechMart!
        </p>
        <Link
          to="/catalog"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
        >
          <span>Khám phá sản phẩm ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Giỏ Hàng Công Nghệ</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các thiết bị và phụ kiện công nghệ sẵn sàng thanh toán
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa toàn bộ giỏ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Select all bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center justify-between text-xs font-bold text-slate-700 shadow-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => selectAllItems(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span>Chọn tất cả ({cart.length} món)</span>
            </label>
            <span className="text-slate-400 font-normal">
              Đã chọn: <span className="text-blue-600 font-bold">{selectedItems.length} món</span>
            </span>
          </div>

          {/* Cart Item Cards */}
          <div className="space-y-3">
            {cart.map((item) => {
              const isSelected = selectedVariantIds.includes(item.variantId);
              const attrText = Object.entries(item.variant.attributes)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' • ');

              return (
                <div
                  key={item.variantId}
                  className={`bg-white rounded-2xl border p-4 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected ? 'border-slate-300' : 'border-slate-200/80 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.variantId)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                    />

                    <Link
                      to={`/product/${item.product.id}`}
                      className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0"
                    >
                      <img
                        src={item.variant.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${item.product.id}`}
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 block"
                      >
                        {item.product.name}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {attrText}
                      </div>
                      <div className="text-xs font-extrabold text-blue-600 mt-1">
                        {formatCurrencyVN(item.variant.price)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal & Remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.variant.stockQuantity}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <div className="text-xs font-black text-slate-900">
                        {formatCurrencyVN(item.variant.price * item.quantity)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({item.quantity} x {formatCurrencyVN(item.variant.price)})
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa khỏi giỏ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/catalog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tiếp tục chọn thêm thiết bị khác</span>
          </Link>
        </div>

        {/* Right: Checkout Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Số lượng đã chọn:</span>
                <span className="font-semibold text-slate-900">{selectedItems.length} thiết bị</span>
              </div>
              <div className="flex justify-between">
                <span>Tạm tính tiền hàng:</span>
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
              {shippingFee > 0 && (
                <div className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded-xl">
                  Mua thêm {formatCurrencyVN(500000 - selectedSubtotal)} để được MIỄN PHÍ vận chuyển!
                </div>
              )}
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-sm text-slate-900">
                <span>Tổng cộng thanh toán:</span>
                <span className="text-base font-black text-blue-600">{formatCurrencyVN(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              disabled={selectedItems.length === 0}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Tiến hành đặt hàng ({selectedItems.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Giao dịch an toàn & cam kết bảo mật 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
