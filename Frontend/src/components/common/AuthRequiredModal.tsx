import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, UserPlus, X, ShieldAlert } from 'lucide-react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  featureName?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  title = 'Yêu Cầu Đăng Nhập',
  message,
  featureName,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const defaultMessage = featureName
    ? `Bạn cần đăng nhập hoặc tạo tài khoản mới để sử dụng tính năng "${featureName}".`
    : 'Vui lòng đăng nhập hoặc tạo tài khoản mới để truy cập giỏ hàng, lưu sản phẩm yêu thích và nhận nhiều ưu đãi độc quyền!';

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Nội dung Modal */}
        <div className="p-6 sm:p-8 text-center">
          {/* Icon nổi bật */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            {message || defaultMessage}
          </p>

          {/* Quick Notice */}
          <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs text-left">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Đăng ký chỉ mất 30 giây để bắt đầu mua sắm thiết bị công nghệ chính hãng!</span>
          </div>

          {/* Nhóm nút hành động */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleNavigate('/login')}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập ngay</span>
            </button>

            <button
              onClick={() => handleNavigate('/register')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-600" />
              <span>Tạo tài khoản mới</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Để sau, tôi muốn tiếp tục xem sản phẩm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
