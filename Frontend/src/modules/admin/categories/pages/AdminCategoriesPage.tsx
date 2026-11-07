import React, { useState } from 'react';
import { Tags, PlusCircle, Trash2, Layers, Sparkles, FolderTree, Image as ImageIcon, X } from 'lucide-react';
import { productService } from '../../../../services/storageService';
import type { Category, Brand } from '../../../../types/ecommerce.types';
import { useToast } from '../../../../contexts/ToastContext';

export const AdminCategoriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<Category[]>(productService.getCategories());
  const [brands, setBrands] = useState<Brand[]>(productService.getBrands());
  const { showToast } = useToast();

  // Modal State for adding new Category
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catDesc, setCatDesc] = useState('');

  // Modal State for adding new Brand
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [brandLogo, setBrandLogo] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Vui lòng nhập tên danh mục!', 'error');
      return;
    }
    const slug = catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCategory: Category = {
      id: Date.now(),
      name: catName,
      slug,
      parentId: catParentId ? Number(catParentId) : null,
      description: catDesc || 'Thiết bị công nghệ cao cấp',
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    showToast(`Đã thêm danh mục "${catName}" vào CSDL TechEcommerceDB!`, 'success');
    setShowCatModal(false);
    setCatName('');
    setCatSlug('');
    setCatParentId('');
    setCatDesc('');
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      showToast('Vui lòng nhập tên thương hiệu!', 'error');
      return;
    }
    const slug = brandSlug.trim() || brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newBrand: Brand = {
      id: Date.now(),
      name: brandName,
      slug,
      logo: brandLogo || 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=120',
    };
    const updated = [...brands, newBrand];
    setBrands(updated);
    showToast(`Đã thêm thương hiệu "${brandName}" vào CSDL!`, 'success');
    setShowBrandModal(false);
    setBrandName('');
    setBrandSlug('');
    setBrandLogo('');
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Đã xóa danh mục!', 'info');
  };

  const handleDeleteBrand = (id: number) => {
    setBrands(prev => prev.filter(b => b.id !== id));
    showToast('Đã xóa thương hiệu!', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Tags className="w-5 h-5 text-blue-400" />
            <span>Quản Lý Danh Mục & Thương Hiệu Công Nghệ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu cấu trúc bảng [categories] và [brands] trong CSDL TechEcommerceDB
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'categories' ? (
            <button
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Danh Mục (categories)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowBrandModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Thương Hiệu (brands)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'border-blue-500 text-blue-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Bảng Danh Mục - [categories] ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'brands'
              ? 'border-amber-500 text-amber-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Bảng Thương Hiệu - [brands] ({brands.length})</span>
        </button>
      </div>

      {/* TAB 1: CATEGORIES TABLE */}
      {activeTab === 'categories' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã #ID</th>
                  <th className="py-3 px-4">Tên Danh Mục (name)</th>
                  <th className="py-3 px-4">Đường Dẫn (slug)</th>
                  <th className="py-3 px-4">Cấp Cha (parent_id)</th>
                  <th className="py-3 px-4">Mô Tả (description)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {categories.map(c => {
                  const parentCat = categories.find(p => p.id === c.parentId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">#{c.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-400" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">{c.slug}</td>
                      <td className="py-3 px-4">
                        {c.parentId ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {parentCat?.name || `#${c.parentId}`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-semibold italic">Gốc (NULL)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{c.description || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1.5 hover:text-red-400 rounded-lg hover:bg-red-500/10 text-slate-400 transition-colors cursor-pointer"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BRANDS TABLE */}
      {activeTab === 'brands' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã #ID</th>
                  <th className="py-3 px-4">Logo (brands.logo)</th>
                  <th className="py-3 px-4">Tên Hãng (name)</th>
                  <th className="py-3 px-4">Đường Dẫn (slug)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {brands.map(b => (
                  <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{b.id}</td>
                    <td className="py-3 px-4">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                        {b.logo ? (
                          <img src={b.logo} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{b.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">{b.slug}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteBrand(b.id)}
                        className="p-1.5 hover:text-red-400 rounded-lg hover:bg-red-500/10 text-slate-400 transition-colors cursor-pointer"
                        title="Xóa hãng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Thêm danh mục mới */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-400" />
                <span>Thêm Danh Mục Mới (INSERT INTO categories)</span>
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tên danh mục (name) *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ví dụ: Bàn Phím Cơ Custom"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Đường dẫn tĩnh (slug)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="ban-phim-co (để trống sẽ tự sinh)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Danh mục cha (parent_id)</label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="">Không có (Danh mục gốc - NULL)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Mô tả (description)</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                  placeholder="Mô tả ngành hàng công nghệ..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold cursor-pointer"
                >
                  Lưu Danh Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm thương hiệu mới */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Thêm Thương Hiệu Mới (INSERT INTO brands)</span>
              </h3>
              <button onClick={() => setShowBrandModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBrand} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tên hãng (name) *</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ví dụ: Logitech G"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Slug (slug)</label>
                <input
                  type="text"
                  value={brandSlug}
                  onChange={(e) => setBrandSlug(e.target.value)}
                  placeholder="logitech-g"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Logo URL (logo)</label>
                <input
                  type="text"
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Lưu Thương Hiệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
