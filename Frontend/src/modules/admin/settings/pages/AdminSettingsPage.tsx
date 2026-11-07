import React, { useState } from 'react';
import { Settings, Database, Shield, CreditCard, Save, Server } from 'lucide-react';
import { useToast } from '../../../../contexts/ToastContext';

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useToast();

  const [platformName, setPlatformName] = useState('TechMart Platform');
  const [supportHotline, setSupportHotline] = useState('1900 8888');
  const [supportEmail, setSupportEmail] = useState('hotro@techmart.vn');
  const [commissionRate, setCommissionRate] = useState(5);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Payment gateways
  const [allowCod, setAllowCod] = useState(true);
  const [allowBank, setAllowBank] = useState(true);
  const [allowCredit, setAllowCredit] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Đã lưu cấu hình hệ thống thành công!', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          <span>Cài Đặt Cấu Hình Hệ Thống Sàn</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Quản lý tham số vận hành, cổng thanh toán và trạng thái kết nối CSDL TechEcommerceDB
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Database Connection Info Card */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Cơ Sở Dữ Liệu SQL Server</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Đã kết nối schema (TechEcommerceDB)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Database Name</div>
              <div className="text-slate-200 font-bold mt-1">TechEcommerceDB</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">RDBMS Engine</div>
              <div className="text-slate-200 font-bold mt-1">Microsoft SQL Server</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Script Source File</div>
              <div className="text-slate-200 font-bold mt-1 truncate">ecommerce.sql</div>
            </div>
          </div>
        </div>

        {/* 2. Platform General Settings */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800/80 pb-3">
            <Server className="w-4 h-4 text-amber-400" />
            <span>Thông Tin Thương Hiệu Sàn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Tên sàn thương mại</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Phần trăm hoa hồng sàn (%)</label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                min={0}
                max={50}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Hotline hỗ trợ kỹ thuật</label>
              <input
                type="text"
                value={supportHotline}
                onChange={(e) => setSupportHotline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Email liên hệ vận hành</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Payment Methods Config ([payments].[payment_method]) */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800/80 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Phương Thức Thanh Toán Cho Phép ([payments])</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-900/80">
              <div>
                <div className="text-xs font-bold text-white">Chuyển khoản ngân hàng (BANK_TRANSFER)</div>
                <div className="text-[11px] text-slate-400">Khách chuyển khoản trực tiếp qua mã QR VietQR</div>
              </div>
              <input
                type="checkbox"
                checked={allowBank}
                onChange={(e) => setAllowBank(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-900/80">
              <div>
                <div className="text-xs font-bold text-white">Thẻ tín dụng / Ghi nợ quốc tế (CREDIT_CARD)</div>
                <div className="text-[11px] text-slate-400">Thanh toán bảo mật chuẩn PCI-DSS qua cổng Visa/Mastercard</div>
              </div>
              <input
                type="checkbox"
                checked={allowCredit}
                onChange={(e) => setAllowCredit(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-900/80">
              <div>
                <div className="text-xs font-bold text-white">Thanh toán khi nhận hàng (COD)</div>
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
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>Chế Độ Bảo Trì Sàn (Maintenance Mode)</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Khi bật, khách hàng và người bán sẽ thấy thông báo bảo trì, chỉ Admin mới truy cập được hệ thống.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              maintenanceMode
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {maintenanceMode ? 'ĐANG BẬT BẢO TRÌ' : 'Đang Tắt'}
          </button>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cấu Hình</span>
          </button>
        </div>
      </form>
    </div>
  );
};
