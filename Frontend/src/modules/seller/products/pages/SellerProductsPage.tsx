import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  PlusCircle, 
  Trash2, 
  Tag, 
  Layers, 
  Cpu, 
  Zap, 
  Flame, 
  Clock, 
  Calendar, 
  Sliders, 
  Percent, 
  Sparkles, 
  X,
  Eye,
  Pencil
} from 'lucide-react';
import { phpApiService, productService, sellerApiService } from '../../../../services/storageService';
import type { Brand, Category, Product } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

// Helper formats date for datetime-local input
const toDateTimeLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
};

const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const SellerProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const { showToast } = useToast();

  const [brands, setBrands] = useState<Brand[]>(productService.getBrands());
  const [categories, setCategories] = useState<Category[]>(productService.getCategories());

  // Flash Sale Modal states
  const [flashSaleModalOpen, setFlashSaleModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [fsEnabled, setFsEnabled] = useState(true);
  const [fsOriginalPrice, setFsOriginalPrice] = useState<number>(0);
  const [fsDiscountPercent, setFsDiscountPercent] = useState<number>(20);
  const [fsStartTime, setFsStartTime] = useState<string>('');
  const [fsEndTime, setFsEndTime] = useState<string>('');

  // New product form states
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState<number>(brands[0]?.id || 1);
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number>(10000000);
  const [comparePrice, setComparePrice] = useState<number>(12000000);
  const [stock, setStock] = useState<number>(10);
  const [variantAttr, setVariantAttr] = useState('Tiêu chuẩn');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800');

  const resetProductForm = (currentBrands = brands, currentCategories = categories) => {
    setEditingProductId(null);
    setEditingVariantId(null);
    setName('');
    setDescription('');
    setSku('');
    setPrice(10000000);
    setComparePrice(12000000);
    setStock(10);
    setVariantAttr('Tiêu chuẩn');
    setImageUrl('https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800');
    if (currentBrands.length > 0) setBrandId(currentBrands[0].id);
    if (currentCategories.length > 0) setCategoryId(currentCategories[0].id);
  };

  const refreshProducts = async () => {
    const data = await sellerApiService.getProducts();
    setProducts(data.filter(product => product.status !== 'archived'));
  };

  useEffect(() => {
    Promise.all([sellerApiService.getProducts(), phpApiService.getCatalogLookups()])
      .then(([data, lookups]) => {
        setProducts(data.filter(product => product.status !== 'archived'));
        setBrands(lookups.brands);
        setCategories(lookups.categories);
        if (lookups.brands.length > 0 && !lookups.brands.some(b => b.id === brandId)) {
          setBrandId(lookups.brands[0].id);
        }
        if (lookups.categories.length > 0 && !lookups.categories.some(c => c.id === categoryId)) {
          setCategoryId(lookups.categories[0].id);
        }
      })
      .catch(error => showToast(error instanceof Error ? error.message : 'Không tải được dữ liệu Seller.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Currently selected product for Flash Sale modal
  const targetProduct = products.find(p => p.id === selectedProductId) || products[0];

  const handleDelete = async (id: number) => {
    if (!window.confirm('Ẩn sản phẩm khỏi gian hàng? Đơn hàng cũ vẫn được giữ lại.')) return;
    try {
      await sellerApiService.deleteProduct(id);
      await refreshProducts();
      showToast('Đã ẩn sản phẩm khỏi gian hàng.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể ẩn sản phẩm.', 'error');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      showToast('Vui lòng nhập tên sản phẩm và mã SKU!', 'error');
      return;
    }
    if (price <= 0) {
      showToast('Giá bán phải lớn hơn 0!', 'error');
      return;
    }
    if (stock < 0) {
      showToast('Số lượng tồn kho không được âm!', 'error');
      return;
    }
    if (comparePrice && Number(comparePrice) > 0 && Number(comparePrice) < Number(price)) {
      showToast('Giá gốc (khuyến mãi) phải lớn hơn hoặc bằng giá bán!', 'error');
      return;
    }

    try {
      const payload = {
        ...(editingVariantId ? { variantId: editingVariantId } : {}),
        name: name.trim(),
        brandId: Number(brandId),
        categoryId: Number(categoryId),
        description,
        sku: sku.trim(),
        price: Number(price),
        comparePrice: Number(comparePrice) > 0 ? Number(comparePrice) : null,
        stock: Number(stock),
        variantAttr,
        image: imageUrl
      };
      if (editingProductId) {
        await sellerApiService.updateProduct(editingProductId, payload);
        showToast(`Đã cập nhật sản phẩm "${name}".`, 'success');
      } else {
        await sellerApiService.createProduct(payload);
        showToast(`Đã thêm sản phẩm "${name}" vào database.`, 'success');
      }
      await refreshProducts();
      setShowAddModal(false);
      resetProductForm();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu sản phẩm.', 'error');
    }
  };

  const openProductEditor = (product: Product) => {
    const variant = product.variants[0];
    setEditingProductId(product.id);
    setEditingVariantId(variant?.id ?? null);
    setName(product.name);
    setBrandId(product.brandId);
    setCategoryId(product.categoryId);
    setDescription(product.description || '');
    setSku(variant?.sku || '');
    setPrice(variant?.price || 0);
    setComparePrice(variant?.compareAtPrice ?? 0);
    setStock(variant?.stockQuantity || 0);
    setVariantAttr(Object.values(variant?.attributes || {}).join(', ') || 'Tiêu chuẩn');
    setImageUrl(variant?.image || '');
    setShowAddModal(true);
  };

  const selectEditingVariant = (variantId: number) => {
    const product = products.find(item => item.id === editingProductId);
    const variant = product?.variants.find(item => item.id === variantId);
    if (!variant) return;
    setEditingVariantId(variant.id);
    setSku(variant.sku);
    setPrice(variant.price);
    setComparePrice(variant.compareAtPrice || 0);
    setStock(variant.stockQuantity);
    setVariantAttr(Object.values(variant.attributes || {}).join(', ') || 'Tiêu chuẩn');
    setImageUrl(variant.image || '');
  };

  const handleAddVariant = async () => {
    if (!editingProductId || !sku.trim()) {
      showToast('Vui lòng nhập mã SKU cho biến thể mới.', 'error');
      return;
    }
    try {
      const saved = await sellerApiService.addVariant(editingProductId, {
        name: name.trim(),
        brandId: Number(brandId),
        categoryId: Number(categoryId),
        description,
        sku: sku.trim(),
        price: Number(price),
        comparePrice: Number(comparePrice) || null,
        stock: Number(stock),
        variantAttr,
        image: imageUrl
      });
      setProducts(current => current.map(item => item.id === saved.id ? saved : item));
      const addedVariant = saved.variants.find(variant => variant.sku === sku.trim());
      if (addedVariant) setEditingVariantId(addedVariant.id);
      showToast('Đã thêm biến thể vào database.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể thêm biến thể.', 'error');
    }
  };

  // Open Flash Sale Modal for a specific product
  const openFlashSaleModal = (p: Product) => {
    setSelectedProductId(p.id);
    setFsEnabled(p.isFlashSale ?? false);
    
    // Set base price
    const currentPrice = p.variants[0]?.price || 10000000;
    const currentCompare = p.variants[0]?.compareAtPrice;
    const initialOriginal = p.flashSaleOriginalPrice || currentCompare || currentPrice;
    setFsOriginalPrice(initialOriginal);

    // Set discount %
    const initialDiscount = p.flashSaleDiscountPercent ?? (
      currentCompare && currentCompare > currentPrice
        ? Math.round(((currentCompare - currentPrice) / currentCompare) * 100)
        : 20
    );
    setFsDiscountPercent(initialDiscount > 0 ? initialDiscount : 20);

    // Set times
    const now = new Date();
    const defaultStart = p.flashSaleStartTime || toDateTimeLocal(now);
    const defaultEnd = p.flashSaleEndTime || toDateTimeLocal(new Date(now.getTime() + 48 * 3600 * 1000));
    setFsStartTime(defaultStart);
    setFsEndTime(defaultEnd);

    setFlashSaleModalOpen(true);
  };

  // Change product inside modal
  const handleSelectProductInModal = (prodId: number) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setSelectedProductId(prodId);
    setFsEnabled(prod.isFlashSale ?? false);

    const currentPrice = prod.variants[0]?.price || 10000000;
    const currentCompare = prod.variants[0]?.compareAtPrice;
    const initialOriginal = prod.flashSaleOriginalPrice || currentCompare || currentPrice;
    setFsOriginalPrice(initialOriginal);

    const initialDiscount = prod.flashSaleDiscountPercent ?? (
      currentCompare && currentCompare > currentPrice
        ? Math.round(((currentCompare - currentPrice) / currentCompare) * 100)
        : 20
    );
    setFsDiscountPercent(initialDiscount > 0 ? initialDiscount : 20);

    const now = new Date();
    setFsStartTime(prod.flashSaleStartTime || toDateTimeLocal(now));
    setFsEndTime(prod.flashSaleEndTime || toDateTimeLocal(new Date(now.getTime() + 48 * 3600 * 1000)));
  };

  // Calculate discounted Flash Sale price
  const computedFlashSalePrice = Math.round(fsOriginalPrice * (1 - fsDiscountPercent / 100));
  const computedSavings = fsOriginalPrice - computedFlashSalePrice;

  // Save Flash Sale settings
  const handleSaveFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    if (fsEnabled) {
      if (fsOriginalPrice <= 0) {
        showToast('Vui lòng nhập giá gốc lớn hơn 0!', 'error');
        return;
      }
      if (fsDiscountPercent < 1 || fsDiscountPercent > 99) {
        showToast('Phần trăm giảm giá phải từ 1% đến 99%!', 'error');
        return;
      }
      if (fsStartTime && fsEndTime && new Date(fsEndTime) <= new Date(fsStartTime)) {
        showToast('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!', 'error');
        return;
      }
    }

    try {
      await sellerApiService.setFlashSale({
        productId: selectedProductId,
        enabled: fsEnabled,
        title: `Flash Sale - ${targetProduct?.name || 'Sản phẩm'}`,
        price: computedFlashSalePrice,
        stockLimit: targetProduct?.variants[0]?.stockQuantity || 1,
        startTime: fsStartTime,
        endTime: fsEndTime
      });
      await refreshProducts();
      setFlashSaleModalOpen(false);
      showToast(fsEnabled
        ? `Đã lưu Flash Sale cho "${targetProduct?.name}".`
        : 'Đã tắt Flash Sale cho sản phẩm.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu Flash Sale.', 'error');
    }
  };

  // Quick turn off Flash Sale
  const handleDisableFlashSale = async () => {
    if (!selectedProductId) return;
    try {
      await sellerApiService.setFlashSale({ productId: selectedProductId, enabled: false });
      await refreshProducts();
      setFlashSaleModalOpen(false);
      showToast('Đã gỡ sản phẩm khỏi chương trình Flash Sale.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể tắt Flash Sale.', 'error');
    }
  };

  // Quick preset duration adder
  const handleSetDurationHours = (hours: number) => {
    const start = fsStartTime ? new Date(fsStartTime) : new Date();
    const end = new Date(start.getTime() + hours * 3600 * 1000);
    setFsEndTime(toDateTimeLocal(end));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" /> Quản Lý Sản Phẩm & Chương Trình Flash Sale
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tồn kho SKU, cài đặt giá gốc, phần trăm giảm giá và khung giờ Flash Sale trực tiếp cho từng thiết bị
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (products.length > 0) openFlashSaleModal(products[0]);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-white" /> Thiết lập Flash Sale
          </button>

          <button
            onClick={() => {
              resetProductForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* 2. Main Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Thiết Bị Công Nghệ</th>
                <th className="py-2.5 px-3">Ngành Hàng & Hãng</th>
                <th className="py-2.5 px-3">Các Biến Thể & SKU</th>
                <th className="py-2.5 px-3">Kho Tồn</th>
                <th className="py-2.5 px-3">Đã Bán</th>
                <th className="py-2.5 px-3 min-w-[210px] bg-rose-50/50 text-rose-800 font-bold">
                  ⚡ Flash Sale (Khuyến Mãi)
                </th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Đang tải sản phẩm từ database...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Chưa có sản phẩm thuộc gian hàng. Hãy thêm sản phẩm mới.</td></tr>
              ) : products.map(p => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

                // Flash sale logic for current row
                const isFlashSale = Boolean(p.isFlashSale);
                const discount = p.flashSaleDiscountPercent ?? (
                  p.variants[0]?.compareAtPrice && p.variants[0].compareAtPrice > p.variants[0].price
                    ? Math.round(((p.variants[0].compareAtPrice - p.variants[0].price) / p.variants[0].compareAtPrice) * 100)
                    : 0
                );
                const origPrice = p.flashSaleOriginalPrice ?? (p.variants[0]?.compareAtPrice || p.variants[0]?.price || 0);
                const fPrice = p.flashSalePrice ?? (
                  discount > 0 ? Math.round(origPrice * (1 - discount / 100)) : p.variants[0]?.price || 0
                );

                // Compute status based on time
                let statusBadge: 'active' | 'upcoming' | 'ended' | 'off' = 'off';
                if (isFlashSale) {
                  const now = Date.now();
                  const startMs = p.flashSaleStartTime ? new Date(p.flashSaleStartTime).getTime() : 0;
                  const endMs = p.flashSaleEndTime ? new Date(p.flashSaleEndTime).getTime() : Infinity;

                  if (p.flashSaleStartTime && now < startMs) {
                    statusBadge = 'upcoming';
                  } else if (p.flashSaleEndTime && now > endMs) {
                    statusBadge = 'ended';
                  } else {
                    statusBadge = 'active';
                  }
                }

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* 1. Device Info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.variants[0]?.image || ''}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                          {p.status !== 'published' && (
                            <div className={`mt-1 text-[10px] font-semibold ${p.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'}`}>
                              {p.status === 'rejected' ? 'Bị từ chối — chỉnh sửa để gửi duyệt lại' : 'Đang chờ Admin duyệt'}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono">ID: #{p.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Category & Brand */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-800 font-medium">
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span>{p.category?.name || 'Công nghệ'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">{p.brand?.name}</div>
                    </td>

                    {/* 3. Variants */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        {p.variants.map(v => (
                          <div key={v.id} className="flex items-center gap-2 text-[11px]">
                            <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {v.sku}
                            </span>
                            <span className="font-bold text-blue-600">{formatCurrencyVN(v.price)}</span>
                            <span className="text-slate-400">({v.stockQuantity} cái)</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* 4. Stock */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        totalStock < 10 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {totalStock} cái tổng
                      </span>
                    </td>

                    {/* 5. Sold */}
                    <td className="py-3 px-3 text-slate-800 font-bold">{p.soldCount || 0}</td>

                    {/* 6. Flash Sale Column */}
                    <td className="py-3 px-3 bg-rose-50/20">
                      {isFlashSale ? (
                        <div className="space-y-1.5">
                          {/* Status Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {statusBadge === 'active' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                                <Flame className="w-3 h-3 fill-white" /> Đang Sale (-{discount}%)
                              </span>
                            )}
                            {statusBadge === 'upcoming' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" /> Sắp diễn ra (-{discount}%)
                              </span>
                            )}
                            {statusBadge === 'ended' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                                <Clock className="w-3 h-3" /> Đã kết thúc
                              </span>
                            )}
                          </div>

                          {/* Prices */}
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-black text-rose-600">
                              {formatCurrencyVN(fPrice)}
                            </span>
                            {origPrice > 0 && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatCurrencyVN(origPrice)}
                              </span>
                            )}
                          </div>

                          {/* Date Range */}
                          {(p.flashSaleStartTime || p.flashSaleEndTime) && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {formatDisplayDate(p.flashSaleStartTime) || 'Bắt đầu'} → {formatDisplayDate(p.flashSaleEndTime) || 'Vô thời hạn'}
                              </span>
                            </div>
                          )}

                          {/* Configure Action */}
                          <div>
                            <button
                              onClick={() => openFlashSaleModal(p)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" /> Sửa Flash Sale
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <button
                            onClick={() => openFlashSaleModal(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-rose-300 hover:border-rose-500 bg-white hover:bg-rose-50/50 text-rose-600 font-semibold text-[11px] transition-all cursor-pointer shadow-xs"
                          >
                            <Zap className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            <span>+ Cài Flash Sale</span>
                          </button>
                          <div className="text-[10px] text-slate-400 mt-1">Chưa áp dụng giảm giá</div>
                        </div>
                      )}
                    </td>

                    {/* 7. Product actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openProductEditor(p)}
                          className="p-1.5 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 text-slate-400 transition-colors cursor-pointer"
                          title="Chỉnh sửa sản phẩm và tồn kho"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/product/${p.id}`}
                          className="p-1.5 hover:text-blue-600 rounded-lg hover:bg-blue-50 text-slate-400 transition-colors inline-flex items-center"
                          title="Xem trên sàn thương mại"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 hover:text-red-600 rounded-lg hover:bg-red-50 text-slate-400 transition-colors cursor-pointer"
                          title="Ẩn sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Modal: FLASH SALE CONFIGURATION */}
      {flashSaleModalOpen && targetProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-600 fill-rose-600" /> Cài Đặt Flash Sale Cho Sản Phẩm
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn sản phẩm, nhập giá gốc, phần trăm giảm giá và thời gian hiệu lực
                </p>
              </div>
              <button
                onClick={() => setFlashSaleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFlashSale} className="space-y-4 text-xs">
              {/* Product Selector Dropdown */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  1. Chọn thiết bị áp dụng Flash Sale:
                </label>
                <select
                  value={selectedProductId || targetProduct.id}
                  onChange={(e) => handleSelectProductInModal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold text-slate-800 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.variants[0]?.sku || 'SKU'} - {formatCurrencyVN(p.variants[0]?.price || 0)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Product Quick Summary Card */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={targetProduct.variants[0]?.image || ''}
                  alt={targetProduct.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {targetProduct.brand?.name} • {targetProduct.category?.name}
                  </div>
                  <div className="font-bold text-slate-900 truncate text-xs">{targetProduct.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Giá bán hiện tại: <span className="font-bold text-blue-600">{formatCurrencyVN(targetProduct.variants[0]?.price || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Toggle Enable/Disable Flash Sale */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Kích hoạt Flash Sale cho sản phẩm này</div>
                    <div className="text-[11px] text-slate-500">Hiển thị nhãn giảm giá đỏ và đồng hồ đếm ngược trên sàn</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fsEnabled}
                    onChange={(e) => setFsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Form inputs only active if enabled */}
              {fsEnabled && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Original Price & Discount Percentage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        2. Giá gốc sản phẩm (VNĐ):
                      </label>
                      <input
                        type="number"
                        min={1000}
                        step={10000}
                        required
                        value={fsOriginalPrice}
                        onChange={(e) => setFsOriginalPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-slate-800"
                      />
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        {formatCurrencyVN(fsOriginalPrice || 0)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        3. Giảm bao nhiêu phần trăm (%):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          required
                          value={fsDiscountPercent}
                          onChange={(e) => setFsDiscountPercent(Number(e.target.value))}
                          className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-rose-600"
                        />
                        <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      </div>
                      
                      {/* Quick percentage buttons */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
                        {[10, 15, 20, 30, 50].map((pct) => (
                          <button
                            type="button"
                            key={pct}
                            onClick={() => setFsDiscountPercent(pct)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              fsDiscountPercent === pct
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Flash Sale Price Preview Box */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-900 to-red-950 text-white shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-rose-200 font-medium">Giá Flash Sale sau khi giảm:</div>
                      <div className="text-xl font-black text-rose-300 tracking-tight">
                        {formatCurrencyVN(computedFlashSalePrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-block px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-xs">
                        -{fsDiscountPercent}% OFF
                      </div>
                      <div className="text-[10px] text-rose-200 mt-0.5">
                        Tiết kiệm: <strong className="text-white">{formatCurrencyVN(computedSavings)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Start & End Dates */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-rose-600" />
                      <span>4. Thời gian bắt đầu và kết thúc Flash Sale</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          Thời gian bắt đầu:
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={fsStartTime}
                          onChange={(e) => setFsStartTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          Thời gian kết thúc:
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={fsEndTime}
                          onChange={(e) => setFsEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick duration presets */}
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 flex-wrap">
                      <span>Thời lượng nhanh từ giờ bắt đầu:</span>
                      {[
                        { label: '+6 Giờ', h: 6 },
                        { label: '+12 Giờ', h: 12 },
                        { label: '+24 Giờ (1 ngày)', h: 24 },
                        { label: '+3 Ngày', h: 72 },
                        { label: '+7 Ngày', h: 168 },
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset.label}
                          onClick={() => handleSetDurationHours(preset.h)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-rose-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Preview Snapshot */}
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Đồng bộ tự động:</strong> Khi bạn bấm lưu, giá bán <strong className="text-rose-700">{formatCurrencyVN(computedFlashSalePrice)}</strong> kèm tag giảm giá <strong className="text-rose-700">-{fsDiscountPercent}%</strong> sẽ được áp dụng ngay lập tức tại mục Flash Sale Trang Chủ và Chi Tiết Sản Phẩm cho khách hàng.
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {targetProduct.isFlashSale ? (
                  <button
                    type="button"
                    onClick={handleDisableFlashSale}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Gỡ khỏi Flash Sale
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFlashSaleModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer shadow-md transition-colors"
                  >
                    Lưu cấu hình Flash Sale
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: CREATE / EDIT PRODUCT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                {editingProductId ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Thiết Bị Công Nghệ Mới'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetProductForm();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên sản phẩm thiết bị</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bàn Phím Cơ Không Dây ROG Azoth 75%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thương hiệu</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Danh mục</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={2}
                  placeholder="Điểm nổi bật của thiết bị..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>{editingProductId ? 'Cấu hình biến thể (SKU)' : 'Biến thể đầu tiên (SKU)'}</span>
                </div>

                {editingProductId && (
                  <label className="block text-slate-600 font-medium">
                    Chọn biến thể cần sửa
                    <select
                      value={editingVariantId ?? ''}
                      onChange={event => selectEditingVariant(Number(event.target.value))}
                      className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      {products.find(product => product.id === editingProductId)?.variants.map(variant => (
                        <option key={variant.id} value={variant.id}>{variant.sku}</option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Mã SKU</label>
                    <input
                      type="text"
                      required
                      placeholder="ROG-AZOTH-NX-RED"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Thuộc tính (Màu/Cấu hình)</label>
                    <input
                      type="text"
                      value={variantAttr}
                      onChange={(e) => setVariantAttr(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Giá bán (VNĐ)</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Giá gốc (VNĐ)</label>
                    <input
                      type="number"
                      value={comparePrice}
                      onChange={(e) => setComparePrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Tồn kho ban đầu</label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Đường dẫn ảnh (URL)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => void handleAddVariant()}
                    className="mr-auto px-3 py-2 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl font-semibold cursor-pointer"
                  >
                    Thêm SKU mới
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetProductForm();
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  {editingProductId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
