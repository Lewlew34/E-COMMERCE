import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CheckCircle2, 
  ShoppingCart, 
  Zap, 
  Heart, 
  Share2, 
  Cpu, 
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react';
import { productService } from '../../../../services/storageService';
import type { Product, ProductVariant } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useCart } from '../../../../contexts/CartContext';
import { useWishlist } from '../../../../contexts/WishlistContext';
import { useToast } from '../../../../contexts/ToastContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const productId = Number(id);
    const foundProduct = productService.getById(productId) || productService.getAll()[0];
    
    if (foundProduct) {
      setProduct(foundProduct);
      if (foundProduct.variants && foundProduct.variants.length > 0) {
        setSelectedVariant(foundProduct.variants[0]);
        setActiveImage(foundProduct.variants[0].image);
      }
    }
  }, [id]);

  if (!product || !selectedVariant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy sản phẩm</h2>
        <Link to="/catalog" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);
  const discountPercent = product.flashSaleDiscountPercent || (
    selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price
      ? Math.round(((selectedVariant.compareAtPrice - selectedVariant.price) / selectedVariant.compareAtPrice) * 100)
      : 0
  );

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setActiveImage(variant.image);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    addToCart(selectedVariant.id, quantity);
  };

  const handleBuyNow = () => {
    addToCart(selectedVariant.id, quantity);
    navigate('/checkout');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Đã sao chép liên kết sản phẩm!', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/catalog" className="hover:text-blue-600 transition-colors">Thiết bị công nghệ</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to={`/catalog?cat=${product.category?.slug}`} className="hover:text-blue-600 transition-colors">
          {product.category?.name || 'Danh mục'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* 2. Main Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-xs">
        
        {/* Left: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center group">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
            {discountPercent > 0 && (
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md">
                GIẢM {discountPercent}%
              </div>
            )}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button 
                onClick={() => toggleWishlist(product.id, product.name)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isFavorite 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/90 text-slate-600 hover:text-red-500 hover:bg-white'
                }`}
                title={isFavorite ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white/90 text-slate-600 hover:text-blue-600 hover:bg-white flex items-center justify-center transition-all shadow-md"
                title="Chia sẻ sản phẩm"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thumbnail list from variants */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantChange(variant)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  selectedVariant.id === variant.id 
                    ? 'border-blue-600 ring-2 ring-blue-500/30' 
                    : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={variant.image} alt={variant.sku} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Value Assurance Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-[11px] text-slate-600">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chính hãng 100% VAT đầy đủ</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Giao hỏa tốc 2H nội thành</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
              <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>1 Đổi 1 trong 30 ngày lỗi SX</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bảo hành chính hãng 24 tháng</span>
            </div>
          </div>
        </div>

        {/* Right: Product Actions & Specs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & SKU */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" />
                <span>{product.brand?.name || 'Chính Hãng'}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Mã SKU: <span className="text-slate-600 font-bold">{selectedVariant.sku}</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Ratings & Social Proof */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-500" />
                <span>{product.rating || 5.0}</span>
                <span className="text-slate-400 font-normal">({product.reviewCount || 99}+ đánh giá)</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="text-slate-500">
                Đã bán: <span className="font-bold text-slate-800">{product.soldCount || 200}+ chiếc</span>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Giá bán niêm yết TechMart</div>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <span className="text-2xl md:text-3xl font-black text-blue-400">
                    {formatCurrencyVN(selectedVariant.price)}
                  </span>
                  {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatCurrencyVN(selectedVariant.compareAtPrice)}
                    </span>
                  )}
                </div>
              </div>

              {product.isFlashSale && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 bg-red-600/90 px-3 py-1.5 rounded-xl border border-red-500 text-xs font-bold text-white shadow-inner animate-pulse">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>FLASH SALE GIỜ VÀNG {discountPercent > 0 ? `(-${discountPercent}%)` : ''}</span>
                  </div>
                  {product.flashSaleEndTime && (
                    <div className="text-[10px] text-rose-300 font-mono">
                      Hạn: {new Date(product.flashSaleEndTime).toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Variant Selector (Mapped to product_variants) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Chọn Phiên Bản & Cấu Hình:</span>
                <span className="text-blue-600 font-semibold">{product.variants.length} tùy chọn sẵn hàng</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant.id === v.id;
                  const attrSummary = Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' • ');

                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariantChange(v)}
                      className={`p-3 rounded-xl text-left border-2 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">{attrSummary}</div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-extrabold text-blue-600">{formatCurrencyVN(v.price)}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          v.stockQuantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {v.stockQuantity > 0 ? `Còn ${v.stockQuantity}` : 'Tạm hết'}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector & Stock Info */}
            <div className="flex items-center gap-6 pt-3">
              <span className="text-xs font-bold text-slate-700">Số lượng mua:</span>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center text-xs font-bold text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stockQuantity, quantity + 1))}
                  disabled={quantity >= selectedVariant.stockQuantity}
                  className="p-2 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-slate-400">
                (Kho còn: <span className="font-semibold text-slate-700">{selectedVariant.stockQuantity} cái</span>)
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleAddToCart}
              disabled={selectedVariant.stockQuantity <= 0}
              className="py-3.5 px-6 rounded-2xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Thêm vào giỏ hàng</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={selectedVariant.stockQuantity <= 0}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Mua ngay - Giao hỏa tốc 2H</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Tech Specifications & Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Detailed Description (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span>Đặc Điểm Nổi Bật & Đánh Giá Chi Tiết</span>
          </h3>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>
          <div className="rounded-2xl overflow-hidden mt-4 border border-slate-100">
            <img src={activeImage} alt="Feature demonstration" className="w-full h-80 object-cover" />
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 mt-4">
            <div className="font-bold text-slate-800">Quyền lợi khách hàng khi mua tại TechMart:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cam kết linh kiện & thiết bị nguyên seal hộp từ nhà phân phối.</li>
              <li>Hỗ trợ cài đặt phần mềm & vệ sinh máy tính trọn đời tại các trạm dịch vụ.</li>
              <li>Giao hàng kiểm tra sản phẩm trước khi thanh toán tiền mặt (COD).</li>
            </ul>
          </div>
        </div>

        {/* Right: Technical Specifications Table (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 space-y-4 shadow-xs h-fit">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Thông Số Kỹ Thuật Chi Tiết</span>
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="py-2.5 flex items-start justify-between gap-4">
                <span className="font-semibold text-slate-500 w-1/3 shrink-0">{key}</span>
                <span className="text-slate-900 font-medium text-right w-2/3">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
