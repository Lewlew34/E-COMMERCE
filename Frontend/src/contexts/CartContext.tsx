import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from '../types/ecommerce.types';
import { customerCartApi } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (variantId: number, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: number, quantity: number) => Promise<void>;
  removeFromCart: (variantId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalCount: number;
  subtotal: number;
  selectedVariantIds: number[];
  toggleSelectItem: (variantId: number) => void;
  selectAllItems: (select: boolean) => void;
  selectedSubtotal: number;
  selectedItems: CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getCartStorageKey(userId: string | number): string {
  return `cart_${userId}`;
}

function readCachedCart(userId: string | number): CartItem[] {
  try {
    const stored = localStorage.getItem(getCartStorageKey(userId));
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as CartItem[] : [];
  } catch (error) {
    console.error('Lỗi đọc bản lưu giỏ hàng:', error);
    return [];
  }
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id;
  const isCustomer = String(user?.role || '').toLowerCase() === 'customer';

  const applyCart = (items: CartItem[], currentUserId = userId) => {
    setCart(items);
    setSelectedVariantIds((current) =>
      current.filter((id) => items.some((item) => item.variantId === id))
    );
    if (currentUserId !== undefined) {
      try {
        localStorage.setItem(getCartStorageKey(currentUserId), JSON.stringify(items));
      } catch (error) {
        console.error('Lỗi lưu bản dự phòng giỏ hàng:', error);
      }
    }
  };

  const refreshCart = async () => {
    if (userId === undefined || !isCustomer) {
      setCart([]);
      setSelectedVariantIds([]);
      return;
    }

    try {
      const items = await customerCartApi.getItems();
      applyCart(items, userId);
      setSelectedVariantIds(items.map((item) => item.variantId));
    } catch (error) {
      const cachedCart = readCachedCart(userId);
      setCart(cachedCart);
      setSelectedVariantIds(cachedCart.map((item) => item.variantId));
      showToast(error instanceof Error ? error.message : 'Không thể tải giỏ hàng từ máy chủ.', 'error');
    }
  };

  useEffect(() => {
    let active = true;
    if (userId === undefined || !isCustomer) {
      setCart([]);
      setSelectedVariantIds([]);
      return () => {
        active = false;
      };
    }

    customerCartApi.getItems().then((items) => {
      if (!active) return;
      applyCart(items, userId);
      setSelectedVariantIds(items.map((item) => item.variantId));
    }).catch((error: unknown) => {
      if (!active) return;
      const cachedCart = readCachedCart(userId);
      setCart(cachedCart);
      setSelectedVariantIds(cachedCart.map((item) => item.variantId));
      showToast(error instanceof Error ? error.message : 'Không thể tải giỏ hàng từ máy chủ.', 'error');
    });

    return () => {
      active = false;
    };
  }, [userId, isCustomer, showToast]);

  const addToCart = async (variantId: number, quantity = 1) => {
    if (!isCustomer) {
      showToast('Vui lòng đăng nhập bằng tài khoản khách hàng để sử dụng giỏ hàng.', 'error');
      return;
    }
    try {
      const updatedCart = await customerCartApi.addItem(variantId, quantity);
      applyCart(updatedCart);
      setSelectedVariantIds((current) =>
        current.includes(variantId) ? current : [...current, variantId]
      );
      const item = updatedCart.find((cartItem) => cartItem.variantId === variantId);
      if (item) showToast(`Đã thêm "${item.product.name}" vào giỏ hàng!`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ hàng.', 'error');
    }
  };

  const updateQuantity = async (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(variantId);
      return;
    }
    try {
      applyCart(await customerCartApi.updateQuantity(variantId, quantity));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể cập nhật số lượng sản phẩm.', 'error');
    }
  };

  const removeFromCart = async (variantId: number) => {
    try {
      applyCart(await customerCartApi.removeItem(variantId));
      showToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa sản phẩm khỏi giỏ hàng.', 'error');
    }
  };

  const clearCart = async () => {
    try {
      applyCart(await customerCartApi.clear());
      setSelectedVariantIds([]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa giỏ hàng.', 'error');
    }
  };

  const toggleSelectItem = (variantId: number) => {
    setSelectedVariantIds((current) =>
      current.includes(variantId)
        ? current.filter((id) => id !== variantId)
        : [...current, variantId]
    );
  };

  const selectAllItems = (select: boolean) => {
    setSelectedVariantIds(select ? cart.map((item) => item.variantId) : []);
  };

  const selectedItems = useMemo(
    () => cart.filter((item) => selectedVariantIds.includes(item.variantId)),
    [cart, selectedVariantIds]
  );
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        totalCount,
        subtotal,
        selectedVariantIds,
        toggleSelectItem,
        selectAllItems,
        selectedSubtotal,
        selectedItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
