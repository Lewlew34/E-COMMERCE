import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { CartItem } from '../types/ecommerce.types';
import { cartService, productService } from '../services/storageService';
import { customerCartApi } from '../api/customer/customerCartApi';
import { authApi } from '../api/auth/authApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  addToCart: (variantId: number, quantity?: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeFromCart: (variantId: number) => void;
  removeSelectedItems: (variantIds?: number[]) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  selectedVariantIds: number[];
  toggleSelectItem: (variantId: number) => void;
  selectAllItems: (select: boolean) => void;
  selectedSubtotal: number;
  selectedItems: CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const GUEST_CART_KEY = 'techmart_guest_cart';
const SELECTED_KEY = 'techmart_selected_cart_variants';

function readGuestCart(): CartItem[] {
  try {
    const candidates = [GUEST_CART_KEY, 'techmart_cart_items', 'cart_default_user'];
    const raw = candidates
      .map(key => {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
      })
      .find(value => Array.isArray(value) && value.length > 0) || [];
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item: any) => {
      const variantId = Number(item?.variantId ?? item?.variant_id);
      const quantity = Number(item?.quantity);
      const match = Number.isInteger(variantId) && variantId > 0 ? productService.getVariantById(variantId) : null;
      if (!match || !Number.isInteger(quantity) || quantity < 1) return [];
      return [{ id: Number(item.id) || Date.now() + variantId, cartId: 0, variantId, quantity, ...match }];
    });
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]) {
  const raw = items.map(({ id, variantId, quantity }) => ({ id, variantId, quantity }));
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(raw));
  localStorage.setItem('techmart_cart_items', JSON.stringify(raw));
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const serverCartRef = useRef(false);
  const cartRef = useRef<CartItem[]>([]);
  const hasAppliedInitialCart = useRef(false);

  const applyCart = (items: CartItem[]) => {
    cartRef.current = items;
    setCart(items);
    setSelectedVariantIds(previous => {
      const next = previous.filter(id => items.some(item => item.variantId === id));
      if (!hasAppliedInitialCart.current) {
        hasAppliedInitialCart.current = true;
        return next.length ? next : items.map(item => item.variantId);
      }
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    hasAppliedInitialCart.current = false;
    setLoading(true);
    serverCartRef.current = false;
    const guestItems = readGuestCart();
    const savedSelection = (() => {
      try { return JSON.parse(sessionStorage.getItem(SELECTED_KEY) || '[]') as number[]; } catch { return []; }
    })();
    applyCart(guestItems);
    if (savedSelection.length) setSelectedVariantIds(savedSelection);

    const connect = async () => {
      try {
        const serverUser = await authApi.getMe();
        if (!active || !serverUser || serverUser.role !== 'customer') return;
        const latestGuestItems = readGuestCart();
        let serverItems: CartItem[];
        if (latestGuestItems.length) {
          serverItems = await customerCartApi.merge(latestGuestItems.map(({ variantId, quantity }) => ({ variantId, quantity })));
          localStorage.removeItem(GUEST_CART_KEY);
          localStorage.removeItem('techmart_cart_items');
        } else {
          serverItems = await customerCartApi.getItems();
        }
        if (!active) return;
        serverCartRef.current = true;
        applyCart(serverItems);
      } catch {
        // Local/demo sign-ins have no PHP session, so keep the guest cart in local storage.
      } finally {
        if (active) setLoading(false);
      }
    };
    void connect();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    sessionStorage.setItem(SELECTED_KEY, JSON.stringify(selectedVariantIds));
  }, [selectedVariantIds]);

  const persistOrReload = async (localUpdate: () => CartItem[], serverUpdate: () => Promise<CartItem[]>): Promise<boolean> => {
    if (serverCartRef.current) {
      try { applyCart(await serverUpdate()); return true; }
      catch (error) { showToast(error instanceof Error ? error.message : 'Không thể cập nhật giỏ hàng.', 'error'); return false; }
    }
    const updated = localUpdate();
    writeGuestCart(updated);
    applyCart(updated);
    return true;
  };

  const addToCart = (variantId: number, quantity = 1) => {
    const matched = productService.getVariantById(variantId);
    void persistOrReload(
      () => cartService.addItem(variantId, quantity),
      () => customerCartApi.addItem(variantId, quantity)
    ).then(success => {
      if (!success) return;
      const added = cartRef.current.find(item => item.variantId === variantId);
      if (added) showToast(`Đã thêm "${added.product.name}" vào giỏ hàng!`, 'success');
      else if (!matched) showToast('Sản phẩm không còn khả dụng.', 'error');
    });
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    void persistOrReload(
      () => cartService.updateQuantity(variantId, quantity),
      () => quantity < 1 ? customerCartApi.removeItem(variantId) : customerCartApi.updateItem(variantId, quantity)
    );
  };

  const removeFromCart = (variantId: number) => {
    void persistOrReload(
      () => cartService.removeItem(variantId),
      () => customerCartApi.removeItem(variantId)
    );
    setSelectedVariantIds(previous => previous.filter(id => id !== variantId));
  };

  const removeSelectedItems = (variantIds = selectedVariantIds) => {
    if (!variantIds.length) return;
    void persistOrReload(
      () => cartRef.current.filter(item => !variantIds.includes(item.variantId)),
      () => customerCartApi.removeItems(variantIds)
    );
    setSelectedVariantIds(previous => previous.filter(id => !variantIds.includes(id)));
  };

  const clearCart = () => {
    if (serverCartRef.current) {
      void customerCartApi.clear().then(applyCart).catch(error => showToast(error.message, 'error'));
    } else {
      cartService.clearCart();
      writeGuestCart([]);
      applyCart([]);
    }
    setSelectedVariantIds([]);
  };

  const toggleSelectItem = (variantId: number) => setSelectedVariantIds(previous =>
    previous.includes(variantId) ? previous.filter(id => id !== variantId) : [...previous, variantId]
  );
  const selectAllItems = (select: boolean) => setSelectedVariantIds(select ? cart.map(item => item.variantId) : []);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const selectedItems = cart.filter(item => selectedVariantIds.includes(item.variantId));
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

  return <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, removeSelectedItems, clearCart, totalCount, subtotal, selectedVariantIds, toggleSelectItem, selectAllItems, selectedSubtotal, selectedItems }}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
