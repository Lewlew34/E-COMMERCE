import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);
  const [redirectCount, setRedirectCount] = useState(3);

  const { showToast } = useToast();
  const navigate = useNavigate();

  // OTP Countdown timer for Step 2
  useEffect(() => {
    let timer: any;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      setIsResendActive(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Auto redirect countdown on Success (Step 3)
  useEffect(() => {
    let timer: any;
    if (step === 3 && redirectCount > 0) {
      timer = setInterval(() => setRedirectCount(prev => prev - 1), 1000);
    } else if (step === 3 && redirectCount === 0) {
      navigate('/login');
    }
    return () => clearInterval(timer);
  }, [step, redirectCount, navigate]);

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('Vui lòng nhập email hoặc số điện thoại đã đăng ký!', 'error');
      return;
    }
    showToast(`Mã xác thực OTP đã được gửi tới ${identifier}. Mã mẫu kiểm thử: 123456`, 'success');
    setStep(2);
    setCountdown(60);
    setIsResendActive(false);
  };

  const handleResendOtp = () => {
    if (!isResendActive) return;
    setCountdown(60);
    setIsResendActive(false);
    showToast('Đã gửi lại mã OTP mới (Mã kiểm thử: 123456)!', 'info');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      showToast('Vui lòng nhập mã OTP 6 số!', 'error');
      return;
    }
    if (otp !== '123456' && otp.length < 4) {
      showToast('Mã OTP không chính xác! Hãy thử nhập: 123456', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }

    showToast('Đặt lại mật khẩu thành công!', 'success');
    setStep(3);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-7 text-slate-100">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-white">Quên Mật Khẩu?</h2>
        <p className="text-xs text-slate-400 mt-1">
          {step === 1 && 'Nhập email hoặc số điện thoại để nhận mã xác minh OTP'}
          {step === 2 && `Nhập mã OTP đã gửi tới ${identifier} và mật khẩu mới`}
          {step === 3 && 'Mật khẩu đã được cập nhật thành công!'}
        </p>
      </div>

      {/* STEP 1: Enter Email / Phone */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email hoặc Số điện thoại đăng ký
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@techstore.vn hoặc 0987..."
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              Ví dụ: <code className="text-blue-400">admin@techmart.vn</code> hoặc <code className="text-blue-400">khachhang@techstore.vn</code>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Tiếp tục (Nhận mã OTP)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      )}

      {/* STEP 2: Enter OTP & New Password */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Mã xác nhận OTP (6 số)
              </label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!isResendActive}
                className={`text-[11px] flex items-center gap-1 ${
                  isResendActive ? 'text-blue-400 hover:underline cursor-pointer' : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${!isResendActive ? 'animate-spin' : ''}`} />
                {isResendActive ? 'Gửi lại mã' : `Gửi lại sau (${countdown}s)`}
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập 123456"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
            />
            <div className="text-[11px] text-emerald-400 mt-1 text-center">
              💡 Gợi ý mã OTP thử nghiệm: <strong>123456</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Xác nhận đổi mật khẩu</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Success Screen */}
      {step === 3 && (
        <div className="space-y-5 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Đổi Mật Khẩu Thành Công!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản ngay bây giờ.
            </p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
            Hệ thống sẽ tự động chuyển hướng về trang Đăng nhập trong <strong className="text-blue-400">{redirectCount}s</strong>...
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Footer Back Link */}
      <div className="mt-6 pt-5 border-t border-slate-800 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Đăng nhập</span>
        </Link>
      </div>
    </div>
  );
};
