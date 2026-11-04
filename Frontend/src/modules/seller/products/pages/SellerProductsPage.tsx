import React, { useState } from 'react';
import { Package, PlusCircle, Trash2, Tag, Layers, Cpu } from 'lucide-react';
import { productService } from '../../../../services/storageService';
import type { Product } from '../../../../types/ecommerce.types';
import { formatCurrencyVN } from '../../../../utils/format';
import { useToast } from '../../../../contexts/ToastContext';

export const SellerProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(productService.getAll());
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  const brands = productService.getBrands();
  const categories = productService.getCategories();

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

  const handleDelete = (id: number) => {
    productService.deleteProduct(id);
    setProducts(productService.getAll());
    showToast('Đã xóa sản phẩm khỏi gian hàng', 'info');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      showToast('Vui lòng nhập tên sản phẩm và mã SKU!', 'error');
      return;
    }

    const newId = Date.now();
    const newProduct: Product = {
      id: newId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brandId: Number(brandId),
      categoryId: Number(categoryId),
      description,
      status: 'active',
      rating: 5.0,
      reviewCount: 0,
      soldCount: 0,
      specifications: {
        'Bảo hành': '24 tháng chính hãng',
        'Tình trạng': 'Mới 100% nguyên seal'
      },
      variants: [
        {
          id: Date.now() + 1,
          productId: newId,
          sku,
          price: Number(price),
          compareAtPrice: Number(comparePrice),
          stockQuantity: Number(stock),
          attributes: { 'Phiên bản': variantAttr },
          image: imageUrl
        }
      ]
    };

    productService.saveProduct(newProduct);
    setProducts(productService.getAll());
    setShowAddModal(false);
    showToast(`Đã thêm thiết bị "${name}" thành công!`, 'success');

    // Reset fields
    setName('');
    setSku('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" /> Quản Lý Sản Phẩm & Biến Thể Kho
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Danh sách thiết bị công nghệ và số lượng tồn kho theo từng biến thể (SKU)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Thêm sản phẩm mới
        </button>
      </div>

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
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 flex items-center gap-3">
                      <img
                        src={p.variants[0]?.image || ''}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: #{p.id}</div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-800 font-medium">
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span>{p.category?.name || 'Công nghệ'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">{p.brand?.name}</div>
                    </td>

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

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        totalStock < 10 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {totalStock} cái tổng
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-800 font-bold">{p.soldCount || 0}</td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 hover:text-red-600 rounded-lg hover:bg-red-50 text-slate-400 transition-colors cursor-pointer"
                          title="Xóa thiết bị"
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

      {/* Modal Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" /> Thêm Thiết Bị Công Nghệ Mới
            </h3>

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
                  <span>Cấu hình Biến Thể Đầu Tiên (Variant)</span>
                </div>

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
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Tạo sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
