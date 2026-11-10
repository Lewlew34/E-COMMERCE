import React, { useState } from 'react';
import { Settings, Database, Shield, CreditCard, Save, Server } from 'lucide-react';
import { useToast } from '../../../../contexts/ToastContext';

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useToast();

  const [platformName, setPlatformName] = useState('LHK Tech Platform');
  const [supportHotline, setSupportHotline] = useState('1900 8888');
  const [supportEmail, setSupportEmail] = useState('hotro@lhktech.vn');
  const [commissionRate, setCommissionRate] = useState(5);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Payment gateways
  const [allowCod, setAllowCod] = useState(true);
  const [allowBank, setAllowBank] = useState(true);
  const [allowCredit, setAllowCredit] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Đã lưu cấu hình hệ thống LHK Tech thành công!', 'success');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div className="pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" />
          <span>Cài Đặt Cấu Hình Hệ Thống Sàn</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Quản lý tham số vận hành, cổng thanh toán và trạng thái kết nối CSDL LHK Tech
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Database Connection Info - Flat Zero-Box */}
        <div className="pb-8 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Cơ Sở Dữ Liệu MySQL / MariaDB</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Đã kết nối schema (techecommercedb)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Database Name</div>
              <div className="text-slate-800 font-bold mt-1">techecommercedb</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">RDBMS Engine</div>
              <div className="text-slate-800 font-bold mt-1">MySQL / MariaDB (Port 3306)</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Configuration Source</div>
              <div className="text-slate-800 font-bold mt-1 truncate">.env (PDO Singleton)</div>
            </div>
          </div>
        </div>

        {/* 2. Platform General Settings - Flat Zero-Box */}
        <div className="pb-8 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Server className="w-4 h-4 text-amber-500" />
            <span>Thông Tin Thương Hiệu Sàn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Tên sàn thương mại</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Phần trăm hoa hồng sàn (%)</label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                min={0}
                max={50}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Hotline hỗ trợ kỹ thuật</label>
              <input
                type="text"
                value={supportHotline}
                onChange={(e) => setSupportHotline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Email liên hệ vận hành</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Payment Methods Config - Flat Zero-Box */}
        <div className="pb-8 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Phương Thức Thanh Toán Cho Phép ([payments])</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between py-2 border-b border-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">Chuyển khoản ngân hàng (BANK_TRANSFER)</div>
                <div className="text-[11px] text-slate-400">Khách chuyển khoản trực tiếp qua mã QR VietQR</div>
              </div>
              <input
                type="checkbox"
                checked={allowBank}
                onChange={(e) => setAllowBank(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-2 border-b border-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">Thẻ tín dụng / Ghi nợ quốc tế (CREDIT_CARD)</div>
                <div className="text-[11px] text-slate-400">Thanh toán bảo mật chuẩn PCI-DSS qua cổng Visa/Mastercard</div>
              </div>
              <input
                type="checkbox"
                checked={allowCredit}
                onChange={(e) => setAllowCredit(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-2 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">Thanh toán khi nhận hàng (COD)</div>
                <div className="text-[11px] text-slate-400">Khách kiểm tra thiết bị và trả tiền mặt cho shipper</div>
              </div>
              <input
                type="checkbox"
                checked={allowCod}
                onChange={(e) => setAllowCod(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 4. Maintenance Mode Toggle */}
        <div className="flex items-center justify-between pb-8 border-b border-slate-100">
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-600" />
              <span>Chế Độ Bảo Trì Sàn (Maintenance Mode)</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Khi bật, khách hàng và người bán sẽ thấy thông báo bảo trì, chỉ Admin mới truy cập được hệ thống.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              maintenanceMode
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {maintenanceMode ? 'ĐANG BẬT BẢO TRÌ' : 'Đang Tắt'}
          </button>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cấu Hình</span>
          </button>
        </div>
      </form>
    </div>
  );
};
