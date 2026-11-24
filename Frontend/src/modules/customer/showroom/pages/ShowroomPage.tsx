import React, { useState, useEffect } from 'react';
import { ShopLocationMap } from '../../../../components/map/ShopLocationMap';
import { ShieldCheck, Sparkles, Navigation, CheckCircle2 } from 'lucide-react';

export interface ShowroomConfig {
  name: string;
  tag: string;
  address: string;
  phone: string;
  openHours: string;
  lat: number;
  lng: number;
}

export const DEFAULT_SHOWROOM: ShowroomConfig = {
  name: 'LHK Tech Flagship Showroom - Trụ Sở Miền Nam',
  tag: 'Trụ sở chính & Showroom Miền Nam',
  address: 'Số 50, Đường Tân Liễu, Xã Hưng Long, Huyện Bình Chánh, TP. Hồ Chí Minh',
  phone: '1900 8888',
  openHours: '08:00 - 21:30 (Mở cửa cả tuần & ngày lễ)',
  lat: 10.6652,
  lng: 106.6028
};

export const ShowroomPage: React.FC = () => {
  const [showroom, setShowroom] = useState<ShowroomConfig>(() => {
    try {
      const saved = localStorage.getItem('lhk_main_showroom');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SHOWROOM;
  });

  // Tự động lắng nghe nếu Admin cập nhật từ tab khác
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lhk_main_showroom' && e.newValue) {
        try {
          setShowroom(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const openDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${showroom.lat},${showroom.lng}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header giới thiệu */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Trụ Sở Trực Tiếp & Điểm Trải Nghiệm Công Nghệ</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Showroom Trực Tiếp <span className="text-blue-600">LHK Tech Miền Nam</span>
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Điểm hẹn công nghệ hàng đầu tại TP. Hồ Chí Minh. Trực tiếp trải nghiệm các dòng Laptop gaming cao cấp, PC đồ họa, linh kiện chính hãng và nhận tư vấn chuyên sâu từ đội ngũ kỹ thuật.
          </p>
        </div>

        {/* Khung bản đồ chính của Showroom */}
        <div className="mb-8">
          <ShopLocationMap
            key={`${showroom.lat}-${showroom.lng}`}
            shopName={showroom.name}
            address={showroom.address}
            phone={showroom.phone}
            openHours={showroom.openHours}
            lat={showroom.lat}
            lng={showroom.lng}
            zoom={16}
            height="460px"
            showCard={true}
          />
        </div>

        {/* Thẻ thông tin tóm tắt & Nút chỉ đường nhanh */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chi nhánh mở cửa đón khách hàng ngày</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{showroom.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                📍 <strong>Địa chỉ:</strong> {showroom.address}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                type="button"
                onClick={openDirections}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Mở Google Maps chỉ đường</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cam kết & Đặc quyền dịch vụ tại Showroom */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Đặc quyền khi trải nghiệm trực tiếp tại Showroom LHK Tech</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">1</div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Trải nghiệm máy không giới hạn</h4>
                <p className="leading-relaxed">Khách hàng được trực tiếp gõ phím, test màn hình, chơi thử game trên các dòng Laptop & PC Gaming cao cấp nhất.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">2</div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Tư vấn Build PC chuyên sâu</h4>
                <p className="leading-relaxed">Đội ngũ kỹ thuật viên giàu kinh nghiệm hỗ trợ tối ưu cấu hình theo đúng nhu cầu đồ họa, render hoặc gaming.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">3</div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Bàn giao & Cài đặt miễn phí</h4>
                <p className="leading-relaxed">Hỗ trợ cài đặt hệ điều hành, vệ sinh máy định kỳ và hướng dẫn kiểm tra máy chu đáo trước khi ra về.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
