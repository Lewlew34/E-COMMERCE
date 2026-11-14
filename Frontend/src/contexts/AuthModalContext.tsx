import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { AuthRequiredModal } from '../components/common/AuthRequiredModal';

interface AuthModalContextType {
  openAuthModal: (featureName?: string, message?: string) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    featureName?: string;
    message?: string;
  }>({
    isOpen: false,
  });

  const openAuthModal = (featureName?: string, message?: string) => {
    setModalState({
      isOpen: true,
      featureName,
      message,
    });
  };

  const closeAuthModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthRequiredModal
        isOpen={modalState.isOpen}
        onClose={closeAuthModal}
        featureName={modalState.featureName}
        message={modalState.message}
      />
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = (): AuthModalContextType => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
