import type { 
  Brand, 
  Category, 
  Product, 
  UserAddress, 
  Order, 
  FlashSale 
} from '../../types/ecommerce.types';

export const INITIAL_BRANDS: Brand[] = [
  { id: 1, name: 'Apple', slug: 'apple', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=120' },
  { id: 2, name: 'ASUS ROG', slug: 'asus-rog', logo: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=120' },
  { id: 3, name: 'NVIDIA', slug: 'nvidia', logo: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=120' },
  { id: 4, name: 'Samsung', slug: 'samsung', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=120' },
  { id: 5, name: 'Lenovo Legion', slug: 'lenovo-legion', logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=120' },
  { id: 6, name: 'Sony', slug: 'sony', logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=120' },
  { id: 7, name: 'Corsair', slug: 'corsair', logo: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=120' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Laptop & MacBook', slug: 'laptop', parentId: null, description: 'Laptop Gaming, Ultrabook cao cấp và MacBook chính hãng' },
  { id: 2, name: 'Điện Thoại & Tablet', slug: 'phone', parentId: null, description: 'Smartphone Flagship, máy tính bảng phục vụ công việc và giải trí' },
  { id: 3, name: 'Linh Kiện PC & VGA', slug: 'pc-component', parentId: null, description: 'Card đồ họa RTX, CPU Intel & AMD, RAM, Bo mạch chủ, Nguồn' },
  { id: 4, name: 'Màn Hình Công Nghệ', slug: 'monitor', parentId: null, description: 'Màn hình đồ họa chuẩn màu, màn hình gaming tần số quét 240Hz+' },
  { id: 5, name: 'Phụ Kiện & Gaming Gear', slug: 'accessory', parentId: null, description: 'Bàn phím cơ, chuột gaming, tai nghe chống ồn, tay cầm' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Laptop Gaming ASUS ROG Strix G16 (2026)',
    slug: 'asus-rog-strix-g16-2026',
    brandId: 2,
    categoryId: 1,
    description: 'Laptop gaming đỉnh cao trang bị vi xử lý Intel Core i9 thế hệ mới nhất cùng card đồ họa NVIDIA RTX 40-series. Hệ thống tản nhiệt thông minh ROG Intelligent Cooling 3 quạt với kim loại lỏng Conductonaut Extreme mang lại hiệu suất tối đa bền bỉ.',
    specifications: {
      'CPU': 'Intel Core i9-14900HX (24 nhân, 32 luồng, Turbo 5.8GHz)',
      'GPU': 'NVIDIA GeForce RTX 4070 8GB GDDR6 (TGP 140W)',
      'Màn hình': '16 inch QHD+ (2560 x 1600) 240Hz, 100% DCI-P3, ROG Nebula Display',
      'RAM': '32GB DDR5 5600MHz (2x 16GB)',
      'Ổ cứng': '1TB PCIe 4.0 NVMe M.2 SSD',
      'Pin': '90WHrs, 4-cell Li-ion',
      'Trọng lượng': '2.50 kg',
      'Hệ điều hành': 'Windows 11 Home bản quyền'
    },
    status: 'active',
    rating: 4.9,
    reviewCount: 128,
    soldCount: 450,
    isFeatured: true,
    isFlashSale: true,
    variants: [
      {
        id: 101,
        productId: 1,
        sku: 'G614JIR-N4001W-16GB',
        price: 36990000,
        compareAtPrice: 42990000,
        stockQuantity: 15,
        attributes: { 'Cấu hình': 'Core i7 / RTX 4060 / 16GB RAM / 512GB SSD', 'Màu sắc': 'Eclipse Gray' },
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'
      },
      {
        id: 102,
        productId: 1,
        sku: 'G614JIR-N4002W-32GB',
        price: 44990000,
        compareAtPrice: 49990000,
        stockQuantity: 8,
        attributes: { 'Cấu hình': 'Core i9 / RTX 4070 / 32GB RAM / 1TB SSD', 'Màu sắc': 'Volt Green Special' },
        image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800'
      }
    ]
  },
  {
    id: 2,
    name: 'Apple MacBook Pro 16 inch M3 Max',
    slug: 'macbook-pro-16-m3-max',
    brandId: 1,
    categoryId: 1,
    description: 'Chiếc máy tính xách tay chuyên nghiệp mạnh nhất từ trước đến nay của Apple. Trang bị chip M3 Max với 16 nhân CPU và 40 nhân GPU, xử lý mượt mà render 3D, dựng phim 8K ProRes và huấn luyện mô hình AI cục bộ.',
    specifications: {
      'Chipset': 'Apple M3 Max (16-core CPU, 40-core GPU, 16-core Neural Engine)',
      'RAM': '48GB Unified Memory',
      'Ổ cứng': '1TB SSD siêu tốc (tốc độ đọc ghi lên tới 7.4GB/s)',
      'Màn hình': '16.2 inch Liquid Retina XDR (3456 x 2234), 120Hz ProMotion, 1600 nits đỉnh',
      'Cổng kết nối': '3x Thunderbolt 4, HDMI, Đầu đọc thẻ SDXC, Cổng MagSafe 3',
      'Pin': 'Thời lượng sử dụng liên tục lên đến 22 giờ',
      'Trọng lượng': '2.16 kg',
      'Hệ điều hành': 'macOS Sonoma'
    },
    status: 'active',
    rating: 5.0,
    reviewCount: 94,
    soldCount: 310,
    isFeatured: true,
    variants: [
      {
        id: 201,
        productId: 2,
        sku: 'MBP16-M3MAX-48-1TB-SB',
        price: 89990000,
        compareAtPrice: 94990000,
        stockQuantity: 12,
        attributes: { 'Bộ nhớ': '48GB RAM / 1TB SSD', 'Màu sắc': 'Đen Không Gian (Space Black)' },
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'
      },
      {
        id: 202,
        productId: 2,
        sku: 'MBP16-M3MAX-64-2TB-SIL',
        price: 109990000,
        compareAtPrice: 115990000,
        stockQuantity: 5,
        attributes: { 'Bộ nhớ': '64GB RAM / 2TB SSD', 'Màu sắc': 'Bạc (Silver)' },
        image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'
      }
    ]
  },
  {
    id: 3,
    name: 'Apple iPhone 16 Pro Max 256GB - 1TB',
    slug: 'iphone-16-pro-max',
    brandId: 1,
    categoryId: 2,
    description: 'Thiết kế khung viền Titan cấp 5 siêu nhẹ và bền bỉ, màn hình 6.9 inch Super Retina XDR với viền mỏng nhất lịch sử Apple. Nút Camera Control điện dung mới cùng chip A18 Pro hỗ trợ Apple Intelligence toàn diện.',
    specifications: {
      'Màn hình': '6.9 inch OLED Super Retina XDR, ProMotion 120Hz, Always-On display',
      'Chip': 'Apple A18 Pro 6 nhân (2 nhân hiệu năng + 4 nhân tiết kiệm điện)',
      'Camera sau': 'Chính 48MP Fusion + Góc siêu rộng 48MP + Telephoto 5x 12MP',
      'Quay video': '4K Dolby Vision 120 fps chuẩn điện ảnh',
      'Pin': 'Lên đến 33 giờ xem video',
      'Chuẩn chống nước': 'IP68 (độ sâu tối đa 6m trong 30 phút)',
      'Cổng kết nối': 'USB-C chuẩn USB 3 (tốc độ truyền tải lên tới 10Gb/s)'
    },
    status: 'active',
    rating: 4.9,
    reviewCount: 312,
    soldCount: 1420,
    isFeatured: true,
    isFlashSale: true,
    variants: [
      {
        id: 301,
        productId: 3,
        sku: 'IP16PM-256GB-DESERT',
        price: 33490000,
        compareAtPrice: 35990000,
        stockQuantity: 25,
        attributes: { 'Dung lượng': '256GB', 'Màu sắc': 'Titan Sa Mạc (Desert Titanium)' },
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800'
      },
      {
        id: 302,
        productId: 3,
        sku: 'IP16PM-512GB-BLACK',
        price: 38990000,
        compareAtPrice: 41490000,
        stockQuantity: 18,
        attributes: { 'Dung lượng': '512GB', 'Màu sắc': 'Titan Đen (Black Titanium)' },
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800'
      },
      {
        id: 303,
        productId: 3,
        sku: 'IP16PM-1TB-NATURAL',
        price: 45990000,
        compareAtPrice: 48990000,
        stockQuantity: 7,
        attributes: { 'Dung lượng': '1TB', 'Màu sắc': 'Titan Tự Nhiên (Natural Titanium)' },
        image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800'
      }
    ]
  },
  {
    id: 4,
    name: 'Card Màn Hình ASUS ROG Strix GeForce RTX 4080 Super OC 16GB',
    slug: 'asus-rog-strix-rtx-4080-super-16gb',
    brandId: 3,
    categoryId: 3,
    description: 'Sức mạnh đồ họa đỉnh cao với kiến trúc Ada Lovelace từ NVIDIA. Quạt Axial-tech thế hệ mới tăng lưu lượng gió thêm 23%, khung đúc kim loại gia cường chống cong vênh và đèn Aura Sync RGB lộng lẫy.',
    specifications: {
      'Nhân đồ họa': 'NVIDIA GeForce RTX 4080 SUPER (10240 CUDA Cores)',
      'Xung nhịp OC': '2670 MHz (OC mode) / 2640 MHz (Default)',
      'Bộ nhớ': '16GB GDDR6X, tốc độ 23 Gbps, Bus 256-bit',
      'Chuẩn Bus': 'PCI Express 4.0',
      'Cổng xuất hình': '2x HDMI 2.1a, 3x DisplayPort 1.4a',
      'Nguồn khuyến nghị': '850W (Cổng nguồn 16-pin 12VHPWR)'
    },
    status: 'active',
    rating: 4.8,
    reviewCount: 65,
    soldCount: 198,
    isFeatured: true,
    variants: [
      {
        id: 401,
        productId: 4,
        sku: 'ROG-STRIX-RTX4080S-O16G-GAMING',
        price: 31990000,
        compareAtPrice: 35500000,
        stockQuantity: 10,
        attributes: { 'Phiên bản': 'Bản Đen Tiêu Chuẩn (Black OC)', 'VRAM': '16GB GDDR6X' },
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800'
      },
      {
        id: 402,
        productId: 4,
        sku: 'ROG-STRIX-RTX4080S-O16G-WHITE',
        price: 33490000,
        compareAtPrice: 36900000,
        stockQuantity: 6,
        attributes: { 'Phiên bản': 'Bản Trắng Tuyết (White Edition OC)', 'VRAM': '16GB GDDR6X' },
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800'
      }
    ]
  },
  {
    id: 5,
    name: 'Màn Hình Gaming ASUS ROG Swift OLED PG32UCDM 32 inch 4K 240Hz',
    slug: 'asus-rog-swift-oled-pg32ucdm',
    brandId: 2,
    categoryId: 4,
    description: 'Màn hình chơi game QD-OLED 4K 32 inch đầu tiên trên thế giới với tần số quét kinh ngạc 240Hz và thời gian phản hồi siêu tốc 0.03ms (GTG). Tấm tản nhiệt tùy chỉnh graphene tiên tiến loại bỏ nguy cơ lưu ảnh burn-in.',
    specifications: {
      'Kích thước': '31.5 inch (16:9)',
      'Tấm nền': 'QD-OLED thế hệ 3 mới nhất',
      'Độ phân giải': '4K UHD (3840 x 2160)',
      'Tần số quét': '240Hz',
      'Thời gian phản hồi': '0.03ms (Gray to Gray)',
      'Độ tương phản': '1,500,000:1 (Chuẩn DisplayHDR True Black 400)',
      'Cổng kết nối': 'DisplayPort 1.4 (DSC), HDMI 2.1, USB-C (Power Delivery 90W)'
    },
    status: 'active',
    rating: 5.0,
    reviewCount: 42,
    soldCount: 89,
    isFeatured: true,
    variants: [
      {
        id: 501,
        productId: 5,
        sku: 'PG32UCDM-OLED-4K',
        price: 36990000,
        compareAtPrice: 39990000,
        stockQuantity: 4,
        attributes: { 'Kích thước': '32 inch 4K QD-OLED', 'Tần số': '240Hz' },
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'
      }
    ]
  },
  {
    id: 6,
    name: 'Tai Nghe Chống Ồn Cao Cấp Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    brandId: 6,
    categoryId: 5,
    description: 'Công nghệ chống ồn hàng đầu thế giới với hai bộ xử lý tích hợp điều khiển 8 micrô. Hỗ trợ âm thanh độ phân giải cao Hi-Res Audio Wireless và tính năng đàm thoại trong trẻo nhờ AI Speak-to-Chat.',
    specifications: {
      'Thời lượng pin': 'Lên đến 30 giờ (bật chống ồn) hoặc 40 giờ (tắt chống ồn)',
      'Sạc nhanh': '3 phút sạc cho 3 giờ phát nhạc liên tục',
      'Bluetooth': 'Phiên bản 5.2, hỗ trợ codec LDAC, AAC, SBC',
      'Trọng lượng': '250g cực nhẹ với da tổng hợp êm ái',
      'Tính năng': 'Chống ồn chủ động thích ứng Auto NC Optimizer'
    },
    status: 'active',
    rating: 4.8,
    reviewCount: 210,
    soldCount: 820,
    isFeatured: false,
    isFlashSale: true,
    variants: [
      {
        id: 601,
        productId: 6,
        sku: 'WH1000XM5-BLACK',
        price: 6490000,
        compareAtPrice: 7990000,
        stockQuantity: 20,
        attributes: { 'Màu sắc': 'Đen Cổ Điển (Black)' },
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'
      },
      {
        id: 602,
        productId: 6,
        sku: 'WH1000XM5-SILVER',
        price: 6490000,
        compareAtPrice: 7990000,
        stockQuantity: 14,
        attributes: { 'Màu sắc': 'Bạc Bạch Kim (Silver Platinum)' },
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
      }
    ]
  }
];

export const INITIAL_ADDRESSES: UserAddress[] = [
  {
    id: 1,
    userId: 1, // Khách hàng Demo
    recipientName: 'Nguyễn Văn Công Nghệ',
    phone: '0901234567',
    addressLine: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ',
    ward: 'Phường 22',
    district: 'Quận Bình Thạnh',
    city: 'TP. Hồ Chí Minh',
    isDefault: true
  },
  {
    id: 2,
    userId: 1,
    recipientName: 'Văn Phòng GearZone',
    phone: '0988776655',
    addressLine: 'Tầng 5, Tòa nhà FPT, Phố Duy Tân',
    ward: 'Phường Dịch Vọng Hậu',
    district: 'Quận Cầu Giấy',
    city: 'Hà Nội',
    isDefault: false
  }
];

export const INITIAL_FLASH_SALE: FlashSale = {
  id: 1,
  title: 'Siêu Sale Đêm Công Nghệ 2026',
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
  status: 'active',
  items: [
    {
      id: 1,
      flashSaleId: 1,
      variantId: 101,
      flashSalePrice: 34990000,
      stockLimit: 20,
      soldCount: 16
    },
    {
      id: 2,
      flashSaleId: 1,
      variantId: 301,
      flashSalePrice: 31990000,
      stockLimit: 30,
      soldCount: 27
    },
    {
      id: 3,
      flashSaleId: 1,
      variantId: 601,
      flashSalePrice: 5990000,
      stockLimit: 50,
      soldCount: 42
    }
  ]
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 1,
    userId: 1,
    orderCode: 'ORD-20261102-001',
    totalAmount: 36990000,
    shippingFee: 0,
    finalAmount: 36990000,
    paymentStatus: 'paid',
    orderStatus: 'shipping',
    paymentMethod: 'BANK_TRANSFER',
    shippingAddressSnapshot: INITIAL_ADDRESSES[0],
    items: [
      {
        id: 1,
        orderId: 1,
        variantId: 101,
        productNameSnapshot: 'Laptop Gaming ASUS ROG Strix G16 (2026)',
        variantAttributesSnapshot: { 'Cấu hình': 'Core i7 / RTX 4060 / 16GB RAM / 512GB SSD', 'Màu sắc': 'Eclipse Gray' },
        price: 36990000,
        quantity: 1,
        totalPrice: 36990000,
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400'
      }
    ],
    createdAt: '2026-11-02T09:30:00Z',
    updatedAt: '2026-11-02T14:15:00Z'
  }
];
