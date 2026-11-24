import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Phone, Clock, ExternalLink, Copy, Check } from 'lucide-react';

export interface ShopLocationProps {
  shopName?: string;
  address?: string;
  phone?: string;
  openHours?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: string;
  showCard?: boolean;
}

// Icon ghim vị trí Showroom màu đỏ nổi bật
const createShopPinIcon = () => {
  return L.divIcon({
    className: 'shop-pin-icon',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        background: #ef4444;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
        border: 2px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 20px; height: 20px; color: white;" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
  });
};

export const ShopLocationMap: React.FC<ShopLocationProps> = ({
  shopName = 'LHK Tech Flagship Showroom - Miền Nam',
  address = 'Số 50, Đường Tân Liễu, Xã Hưng Long, Huyện Bình Chánh, TP. Hồ Chí Minh',
  phone = '1900 8888',
  openHours = '8:00 - 21:30 (Mở cửa cả tuần & ngày lễ)',
  lat = 10.6652,
  lng = 106.6028,
  zoom = 16,
  height = '420px',
  showCard = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: false // Tránh vô tình zoom khi cuộn trang
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      const marker = L.marker([lat, lng], {
        icon: createShopPinIcon()
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; max-width: 240px;">
          <h4 style="font-weight: 700; color: #1e293b; font-size: 14px; margin: 0 0 4px 0;">${shopName}</h4>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0; line-height: 1.4;">${address}</p>
          <div style="font-size: 11px; color: #2563eb; font-weight: 600;">Hotline: ${phone}</div>
        </div>
      `);

      mapInstanceRef.current = map;
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    } else {
      mapInstanceRef.current.setView([lat, lng], zoom);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, zoom, shopName, address, phone]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openGoogleMapsDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className={showCard ? 'grid grid-cols-1 lg:grid-cols-3' : 'w-full'}>
        {/* Bản đồ trực quan */}
        <div className={`relative ${showCard ? 'lg:col-span-2' : ''} w-full bg-slate-100 min-h-[380px] h-full`} style={{ height }}>
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-10" />
          <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Showroom đang hoạt động</span>
          </div>
        </div>

        {/* Card thông tin chi tiết */}
        {showCard && (
          <div className="p-6 bg-slate-50/60 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span>Trụ sở & Showroom Trực tiếp</span>
              </div>

              <h3 className="text-lg font-bold text-slate-800 leading-snug mb-3">
                {shopName}
              </h3>

              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Địa chỉ showroom:</span>
                    <span className="leading-relaxed">{address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Điện thoại tư vấn:</span>
                    <span className="font-bold text-slate-800">{phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Giờ đón khách:</span>
                    <span>{openHours}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <button
                type="button"
                onClick={openGoogleMapsDirections}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>Chỉ đường trên Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
              </button>

              <button
                type="button"
                onClick={copyAddress}
                className="w-full px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Đã sao chép địa chỉ!' : 'Sao chép địa chỉ'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
