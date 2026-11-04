import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../../../../contexts/WishlistContext';
import { useCart } from '../../../../contexts/CartContext';
import { productService } from '../../../../services/storageService';
import { formatCurrencyVN } from '../../../../utils/format';

export const WishlistPage: React.FC = () => {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const allProducts = productService.getAll();
  const favoritedProducts = allProducts.filter(p => wishlistIds.includes(p.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-current" /> Danh Sách Yêu Thích
          </h1>
          <p className="text-xs text-slate-500">Các thiết bị công nghệ bạn đã lưu để theo dõi giá</p>
        </div>
      </div>

      {favoritedProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Chưa có sản phẩm yêu thích nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy bấm vào biểu tượng trái tim ở các trang sản phẩm công nghệ để lưu lại khi cần mua sau!
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <span>Khám phá sản phẩm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritedProducts.map(p => {
            const firstVariant = p.variants[0];
            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3 border border-slate-100">
                    <img
                      src={firstVariant?.image || ''}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => toggleWishlist(p.id)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow hover:bg-white transition-colors"
                      title="Bỏ yêu thích"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{p.brand?.name}</div>
                  <Link
                    to={`/product/${p.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 mt-1 block"
                  >
                    {p.name}
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-blue-600">
                    {formatCurrencyVN(firstVariant?.price || 0)}
                  </span>
                  <button
                    onClick={() => firstVariant && addToCart(firstVariant.id, 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Thêm giỏ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
