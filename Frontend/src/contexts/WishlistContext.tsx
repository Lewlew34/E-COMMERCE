import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { wishlistService } from '../services/storageService';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlistIds: number[];
  toggleWishlist: (productId: number, productName?: string) => void;
  isInWishlist: (productId: number) => boolean;
  totalWishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    setWishlistIds(wishlistService.getProductIds());
  }, []);

  const toggleWishlist = (productId: number, productName?: string) => {
    const isAdded = wishlistService.toggle(productId);
    setWishlistIds(wishlistService.getProductIds());

    if (isAdded) {
      showToast(productName ? `Đã lưu "${productName}" vào mục yêu thích!` : 'Đã thêm vào mục yêu thích!', 'success');
    } else {
      showToast('Đã bỏ khỏi mục yêu thích', 'info');
    }
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlistIds.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        totalWishlistCount: wishlistIds.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
