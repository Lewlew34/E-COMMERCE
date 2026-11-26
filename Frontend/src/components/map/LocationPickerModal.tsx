import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Navigation, X, Check, Loader2, AlertCircle } from 'lucide-react';

export interface LocationResult {
  address: string;
  ward: string;
  district: string;
  city: string;
  fullAddress: string;
  lat: number;
  lng: number;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (data: LocationResult) => void;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}

// Icon ghim vị trí SVG hiện đại không bị lỗi đường dẫn ảnh
const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: #2563eb;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(37, 99, 235, 0.45);
        border: 2px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });
};

// Vị trí mặc định: TP. Hồ Chí Minh
const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialAddress = '',
  initialLat = DEFAULT_LAT,
  initialLng = DEFAULT_LNG,
  title = 'Chọn địa chỉ nhận hàng trên bản đồ'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const geocodeRequestRef = useRef(0);
  const nominatimQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const nominatimLastRequestAt = useRef(0);

  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hasResolvedCurrentCoord, setHasResolvedCurrentCoord] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resolvedLocation, setResolvedLocation] = useState<LocationResult>({
    address: initialAddress,
    ward: '',
    district: '',
    city: '',
    fullAddress: initialAddress || 'Đang xác định địa chỉ...',
    lat: initialLat,
    lng: initialLng
  });

  const requestNominatim = <T,>(url: string): Promise<T> => {
    const request = nominatimQueueRef.current.then(async () => {
      const waitMs = Math.max(0, 1100 - (Date.now() - nominatimLastRequestAt.current));
      if (waitMs > 0) await new Promise(resolve => window.setTimeout(resolve, waitMs));
      nominatimLastRequestAt.current = Date.now();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`OpenStreetMap trả về lỗi ${response.status}`);
      return response.json() as Promise<T>;
    });
    nominatimQueueRef.current = request.then(() => undefined, () => undefined);
    return request;
  };

  // OpenStreetMap Nominatim is queried one request at a time with at least 1.1 seconds between requests.
  const reverseGeocode = async (lat: number, lng: number) => {
    const requestId = ++geocodeRequestRef.current;
    setIsGeocoding(true);
    setHasResolvedCurrentCoord(false);
    setErrorMessage(null);
    try {
      const data = await requestNominatim<any>(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`
      );
      if (requestId !== geocodeRequestRef.current) return;

      const addr = data.address || {};
      const road = addr.road || addr.neighbourhood || addr.suburb || '';
      const ward = addr.suburb || addr.quarter || addr.village || addr.ward || '';
      const district = addr.city_district || addr.district || addr.county || '';
      const city = addr.city || addr.state || addr.province || '';
      const fullDisplay = data.display_name || `${road}, ${ward}, ${district}, ${city}`.replace(/(,\s*)+/g, ', ').trim();

      const parsedResult: LocationResult = {
        address: [addr.house_number, road].filter(Boolean).join(' ') || road || 'Vị trí đã ghim',
        ward: ward,
        district: district,
        city: city,
        fullAddress: fullDisplay,
        lat,
        lng
      };

      setResolvedLocation(parsedResult);
    } catch (err) {
      if (requestId !== geocodeRequestRef.current) return;
      console.warn('Lỗi reverse geocode:', err);
      setErrorMessage('Không đọc được tên địa chỉ. Bạn vẫn có thể xác nhận tọa độ; sau đó hãy tự nhập địa chỉ vào biểu mẫu.');
      setResolvedLocation({
        address: '',
        ward: '',
        district: '',
        city: '',
        lat,
        lng,
        fullAddress: `Toạ độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
      });
    } finally {
      if (requestId === geocodeRequestRef.current) {
        setIsGeocoding(false);
        setHasResolvedCurrentCoord(true);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const coordinate = { lat: initialLat, lng: initialLng };
    setSearchQuery(initialAddress);
    setErrorMessage(null);
    setHasResolvedCurrentCoord(false);
    setResolvedLocation({
      address: initialAddress,
      ward: '',
      district: '',
      city: '',
      fullAddress: initialAddress || 'Đang xác định địa chỉ...',
      ...coordinate
    });
  }, [isOpen, initialAddress, initialLat, initialLng]);

  // 2. Khởi tạo bản đồ khi modal mở
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 15,
          zoomControl: true
        });

        // Lớp bản đồ OpenStreetMap chất lượng cao
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(map);

        // Marker có thể kéo thả
        const pinIcon = createCustomPinIcon();
        const marker = L.marker([initialLat, initialLng], {
          draggable: true,
          icon: pinIcon
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        });

        map.on('click', (e: L.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // Tự động phân giải địa chỉ ban đầu
        reverseGeocode(initialLat, initialLng);
      } else {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, initialLat, initialLng]);

  // Dọn dẹp map khi đóng modal hoàn toàn
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [isOpen]);

  // Di chuyển bản đồ đến toạ độ mới
  const moveToLocation = (lat: number, lng: number, zoomLevel = 16) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoomLevel, { duration: 1.2 });
      markerRef.current.setLatLng([lat, lng]);
    }
    reverseGeocode(lat, lng);
  };

  // 3. Tìm kiếm địa chỉ bằng OpenStreetMap Nominatim
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMessage(null);
    setSearchResults([]);

    try {
      const data = await requestNominatim<any[]>(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=vn&limit=5&addressdetails=1&accept-language=vi`
      );

      if (data.length === 0) {
        setErrorMessage('Không tìm thấy địa chỉ phù hợp. Vui lòng nhập chi tiết hơn (ví dụ: kèm Quận, Thành phố).');
      } else {
        setSearchResults(data);
      }
    } catch (err) {
      setErrorMessage('Đã xảy ra lỗi khi tìm kiếm địa chỉ. Vui lòng thử lại.');
    } finally {
      setIsSearching(false);
    }
  };

  // 4. Lấy vị trí GPS hiện tại của người dùng
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        moveToLocation(latitude, longitude, 17);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Không thể lấy vị trí hiện tại.';
        if (err.code === 1) msg = 'Bạn đã từ chối quyền truy cập vị trí trên trình duyệt.';
        else if (err.code === 2) msg = 'Không thể xác định vị trí khả dụng.';
        setErrorMessage(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Chọn từ kết quả tìm kiếm gợi ý
  const selectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSearchResults([]);
    setSearchQuery(item.display_name);
    moveToLocation(lat, lng, 16);
  };

  // Hoàn tất chọn địa chỉ
  const handleConfirm = () => {
    if (!hasResolvedCurrentCoord || isGeocoding) return;
    onSelectLocation(resolvedLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{title}</h3>
              <p className="text-xs text-slate-500">Bản đồ OpenStreetMap miễn phí. Kéo ghim hoặc click để chọn vị trí; vui lòng kiểm tra địa chỉ trước khi xác nhận.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh công cụ: Tìm kiếm & Định vị GPS */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 relative">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập địa chỉ, tên đường, tòa nhà hoặc quận/huyện..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSearching}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Tìm kiếm</span>
              </button>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                title="Định vị vị trí hiện tại của bạn"
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Navigation className="w-4 h-4 text-emerald-600" />}
                <span className="hidden sm:inline">Vị trí của tôi</span>
              </button>
            </div>

            {/* Danh sách gợi ý tìm kiếm */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSearchResult(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 text-xs sm:text-sm text-slate-700 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {errorMessage && (
            <div className="mt-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Khung bản đồ Leaflet */}
        <div className="relative flex-1 w-full bg-slate-100 min-h-[340px] sm:min-h-[400px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[340px] sm:min-h-[400px] z-10" />

          {/* Indicator đang cập nhật toạ độ */}
          {isGeocoding && (
            <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-md border border-slate-200/80 text-xs text-slate-600 font-medium flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Đang đọc địa chỉ...</span>
            </div>
          )}

          {/* Tooltip hướng dẫn nhanh */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none bg-slate-900/75 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-lg shadow">
            💡 Click hoặc kéo ghim đỏ để chỉnh vị trí
          </div>
        </div>

        {/* Footer hiển thị địa chỉ đã chọn & Nút xác nhận */}
        <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Địa chỉ được chọn:</span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-tight mt-0.5">
              {resolvedLocation.fullAddress || 'Chưa chọn vị trí'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasResolvedCurrentCoord || isGeocoding}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận địa chỉ này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
