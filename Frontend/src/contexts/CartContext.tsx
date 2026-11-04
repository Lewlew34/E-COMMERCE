import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem } from '../types/ecommerce.types';
import { cartService } from '../services/storageService';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (variantId: number, quantity?: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeFromCart: (variantId: number) => void;
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

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    const initialItems = cartService.getItems();
    setCart(initialItems);
    // Default select all items
    setSelectedVariantIds(initialItems.map(i => i.variantId));
  }, []);

  const addToCart = (variantId: number, quantity: number = 1) => {
    const updated = cartService.addItem(variantId, quantity);
    setCart(updated);
    
    // Automatically select the added item
    if (!selectedVariantIds.includes(variantId)) {
      setSelectedVariantIds(prev => [...prev, variantId]);
    }

    const addedItem = updated.find(i => i.variantId === variantId);
    if (addedItem) {
      showToast(`Đã thêm "${addedItem.product.name}" vào giỏ hàng!`, 'success');
    }
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    const updated = cartService.updateQuantity(variantId, quantity);
    setCart(updated);
  };

  const removeFromCart = (variantId: number) => {
    const itemToRemove = cart.find(i => i.variantId === variantId);
    const updated = cartService.removeItem(variantId);
    setCart(updated);
    setSelectedVariantIds(prev => prev.filter(id => id !== variantId));
    if (itemToRemove) {
      showToast(`Đã xóa sản phẩm khỏi giỏ hàng`, 'info');
    }
  };

  const clearCart = () => {
    cartService.clearCart();
    setCart([]);
    setSelectedVariantIds([]);
  };

  const toggleSelectItem = (variantId: number) => {
    setSelectedVariantIds(prev => 
      prev.includes(variantId) 
        ? prev.filter(id => id !== variantId)
        : [...prev, variantId]
    );
  };

  const selectAllItems = (select: boolean) => {
    if (select) {
      setSelectedVariantIds(cart.map(i => i.variantId));
    } else {
      setSelectedVariantIds([]);
    }
  };

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);

  const selectedItems = cart.filter(item => selectedVariantIds.includes(item.variantId));
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
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
