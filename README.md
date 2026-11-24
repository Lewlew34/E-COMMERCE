# LHK Tech - Sàn Thương Mại Điện Tử Thiết Bị & Sản Phẩm Công Nghệ

Hệ thống sàn thương mại điện tử chuyên biệt cho các thiết bị và sản phẩm công nghệ cao cấp (Laptop Gaming, Ultrabook, Flagship Smartphone, Màn hình đồ họa, Linh kiện PC & Gaming Gear), xây dựng theo kiến trúc phân tách rõ ràng giữa Frontend Single-Page Application (SPA) và Backend RESTful API.

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend:**
  - **Framework & Ngôn ngữ:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - **Công cụ build:** [Vite](https://vite.dev/)
  - **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
  - **Bản đồ & Định vị:** [Leaflet](https://leafletjs.com/) + OpenStreetMap (OSM) & Nominatim Geocoding API (Miễn phí 100%, không cần API Key)
  - **Bộ icon:** [Lucide React](https://lucide.dev/)
  - **Điều hướng:** [React Router v7](https://reactrouter.com/)
  - **HTTP Client:** [Axios](https://axios-http.com/) & Native Fetch API
  - **State Management:** React Context API (`AuthContext`, `CartContext`, `WishlistContext`, `ToastContext`, `AuthModalContext`)
- **Backend & API:**
  - **Ngôn ngữ & Nền tảng:** PHP 8.x (chạy qua XAMPP Apache / PHP CLI)
  - **Kiến trúc:** RESTful API chuẩn hóa JSON (`json_success`, `json_error`), phân quyền theo 5 nhóm người dùng
  - **Cơ sở dữ liệu:** MySQL / MariaDB (kết nối PDO Singleton bảo mật chống SQL Injection)
  - **Trí tuệ nhân tạo:** Tích hợp **Google Gemini API** cho trợ lý ảo tư vấn công nghệ thông minh
  - **Cổng thanh toán:** **VNPAY Sandbox** & **PayPal SDK**
  - **Dịch vụ Email:** **PHPMailer** tự động gửi hóa đơn và thông báo xác nhận đơn hàng
- **SEO & Social Sharing Prerender:**
  - Đường dẫn thân thiện chuẩn SEO (`/product/:slug`)
  - Server-Side Meta Injector (`Backend/api/common/seo_render.php`) kết hợp Apache `.htaccess` tự động nhận diện bot crawler (Facebook, Zalo, Googlebot) để render thẻ Open Graph / Twitter Card động.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
E-COMMERCE/
├── .env                              # Cấu hình môi trường duy nhất (DB, Gemini API, URLs)
├── .env.example                      # Mẫu cấu hình môi trường chuẩn
├── .gitignore
├── README.md                         # Tài liệu hướng dẫn cài đặt & vận hành dự án
│
├── Backend/                          # PHÂN HỆ BACKEND API (PHP + MySQL)
│   ├── config/                       # Cấu hình kết nối & tích hợp bên ngoài
│   │   ├── env.php                   # Nạp biến môi trường từ .env gốc
│   │   ├── database.php              # Kết nối PDO Singleton tập trung
│   │   ├── cors.php                  # Xử lý CORS và Session Cookie
│   │   ├── mail.php                  # Cấu hình SMTP gửi mail hóa đơn
│   │   ├── vnpay_create.php          # Cấu hình tạo URL thanh toán VNPAY
│   │   └── vnpay_return.php          # Xử lý kết quả trả về từ VNPAY
│   ├── core/                         # Các hàm tiện ích cốt lõi
│   │   ├── response.php              # Helper JSON Response chuẩn
│   │   ├── auth_guard.php            # Middleware kiểm tra phiên & quyền hạn
│   │   └── OrderMailService.php      # Dịch vụ gửi email đơn hàng tự động
│   ├── migrations/                   # File SQL di chuyển CSDL & cập nhật cấu trúc
│   ├── storage/                      # Thư mục lưu trữ ảnh tải lên (tin nhắn chat...)
│   ├── scripts/                      # Công cụ dòng lệnh CLI (create_admin.php)
│   └── api/                          # HỆ THỐNG ENDPOINT API CHIA THEO PHÂN HỆ
│       ├── common/                   # [Public] Danh mục, sản phẩm, Flash Sale, AI Chatbot
│       ├── auth/                     # [Auth] Đăng nhập, đăng ký, xác thực token
│       ├── customer/                 # [Customer] Sổ địa chỉ, đặt hàng, lịch sử đơn
│       ├── chat/                     # [Chat] Hội thoại, tin nhắn thời gian thực
│       ├── seller/                   # [Seller] Dashboard, sản phẩm, biến thể, đơn shop, doanh thu
│       ├── admin/                    # [Admin] Báo cáo chỉ số GMV, duyệt shop, duyệt sản phẩm
│       ├── vnpay_create_payment.php  # Cổng thanh toán VNPAY
│       ├── vnpay_callback.php        # Webhook IPN xử lý thanh toán VNPAY
│       └── verify_paypal.php         # Xác thực thanh toán PayPal quốc tế
│
└── Frontend/                         # PHÂN HỆ GIAO DIỆN (React 19 + TypeScript + Vite)
    ├── vite.config.ts                # Cấu hình Vite & Middleware
    ├── package.json                  # Khai báo thư viện phụ thuộc
    ├── public/                       # Tài nguyên tĩnh & file .htaccess
    └── src/
        ├── api/                      # Tầng gọi API Backend (axios client, chatApi, catalogApi...)
        ├── components/
        │   ├── common/               # AIChatWidget, TawkToChat, AuthRequiredModal
        │   └── map/                  # BỘ COMPONENT BẢN ĐỒ DÙNG CHUNG
        │       ├── LocationPickerModal.tsx  # Modal bản đồ chọn địa chỉ (Ghim + GPS + Geocoding)
        │       └── ShopLocationMap.tsx      # Hiển thị vị trí Showroom & dẫn đường Google Maps
        ├── contexts/                 # State toàn cục (Auth, Cart, Wishlist, Toast)
        ├── layouts/                  # Layout theo từng phân hệ (Customer, Seller, Admin, Auth)
        ├── modules/                  # Các trang chức năng theo phân hệ
        │   ├── auth/                 # Đăng nhập, đăng ký khách hàng, đăng ký người bán
        │   ├── customer/             # Home, Catalog, ProductDetail, Cart, Checkout, Showroom, Orders
        │   ├── chat/                 # ChatInboxPage (Hộp thư Live Chat giữa Khách & Shop)
        │   ├── seller/               # Dashboard, Products, Orders, Messages, Analytics
        │   └── admin/                # Dashboard, Users, Sellers, Products, Categories, Settings
        ├── routes/                   # Hệ thống định tuyến (AppRoutes & ProtectedRoute)
        ├── types/                    # Định nghĩa kiểu dữ liệu TypeScript
        └── utils/                    # Các hàm helper (định dạng tiền tệ VNĐ, xử lý chuỗi)
```

---

## 🌟 Các Phân Hệ & Tính Năng Hoàn Thiện

### 1. Phân Hệ Khách Hàng (Customer Storefront)
- **Trang chủ & Flash Sale (`/`):** Đồng hồ đếm ngược Flash Sale theo thời gian thực, danh sách deal sốc và banner công nghệ.
- **Danh Mục & Lọc Nâng Cao (`/catalog`):** Tìm kiếm thông minh (bỏ dấu tiếng Việt), lọc đa tiêu chí theo Hãng & Danh mục, sắp xếp giá bán.
- **Chi Tiết Sản Phẩm & SEO Friendly URL (`/product/:slug`):**
  - Đường dẫn thân thiện chuẩn SEO (Ví dụ: `/product/asus-rog-strix-scar-16`).
  - Tự động sinh thẻ Meta Open Graph hỗ trợ xem trước sinh động khi chia sẻ liên kết lên **Facebook / Zalo**.
  - Bộ chọn biến thể cấu hình linh hoạt (RAM, SSD, Màu sắc), cập nhật giá & tồn kho tương ứng.
  - Nút **"Nhắn tin với Shop"** kết nối trò chuyện trực tiếp với chủ gian hàng.
- **Bản Đồ Chọn Vị Trí Nhận Hàng Thông Minh (`/checkout`):**
  - Tích hợp nút **"🗺️ Chọn trên bản đồ"** ngay tại form địa chỉ giao hàng.
  - Cho phép khách hàng kéo thả ghim vị trí hoặc bấm **"Vị trí của tôi"** (GPS).
  - Tự động phân giải tọa độ thành địa chỉ chi tiết tiếng Việt (*Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành*) và điền ngược lại vào form.
  - Vẫn hỗ trợ nhập tay truyền thống song song 100%.
- **Thanh Toán Đa Phương Thức:**
  1. **COD**: Thanh toán tiền mặt khi nhận hàng.
  2. **VietQR 24/7**: Quét mã QR chuyển khoản ngân hàng tức thì.
  3. **VNPAY Sandbox**: Thanh toán qua thẻ ATM / Internet Banking / VNPAY-QR.
  4. **PayPal**: Thanh toán qua cổng quốc tế bằng thẻ Visa / MasterCard / PayPal.
- **Trang Showroom Trực Tiếp Miền Nam (`/showroom`):**
  - Hiển thị vị trí showroom chính của sàn tại Miền Nam trên bản đồ tương tác.
  - Tích hợp nút **"Chỉ đường trên Google Maps"** mở ứng dụng dẫn đường trực tiếp.
- **Hệ Thống Live Chat Khách Hàng ↔ Shop (`/customer/messages`):**
  - Trò chuyện trực tiếp với từng gian hàng, đính kèm hình ảnh thiết bị.
  - Chia sẻ trực tiếp thẻ sản phẩm hoặc đơn hàng cần khiếu nại/hỗ trợ ngay trong khung chat.
- **Trợ Lý Ảo LHKTech AI (Google Gemini):**
  - Chatbox nổi tư vấn cấu hình máy, gợi ý laptop gaming, đồ họa và giải đáp chính sách bảo hành.

### 2. Kênh Người Bán (Seller Center)
- **Đăng ký mở gian hàng (`/seller/register`):** Đăng ký thông tin shop (tên shop, số điện thoại, ngành hàng kinh doanh).
- **Quản lý sản phẩm & Kho hàng (`/seller/products`):** Thêm mới và chỉnh sửa thiết bị, tạo biến thể SKU, giá bán, tồn kho và hình ảnh.
- **Quản lý vị trí Kho / Showroom của Shop (`/seller/dashboard`):** Mỗi Shop có thể tự chọn và ghim vị trí kho xuất hàng của riêng mình trên bản đồ để khách hàng định vị điểm xuất phát đơn hàng.
- **Xử lý đơn hàng gian hàng (`/seller/orders`):** Tiếp nhận đơn hàng, duyệt giao đơn, cập nhật mã vận đơn riêng theo từng shop.
- **Hộp thư tư vấn bán hàng (`/seller/messages`):** Quản lý toàn bộ danh sách hội thoại khách hàng, nhận thông báo tin nhắn chưa đọc.
- **Báo cáo doanh thu & Phân tích (`/seller/analytics`):** Thống kê doanh thu ròng, cảnh báo sản phẩm sắp hết hàng ($\le 5$).

### 3. Kênh Quản Trị Viên (Admin Center)
- **Bảng điều khiển toàn sàn (`/admin/dashboard`):** Theo dõi tổng doanh số GMV, doanh thu đã giao, số lượng đơn hàng và biểu đồ so sánh giữa các gian hàng.
- **Quản lý & Điều chỉnh vị trí Showroom chính:** Admin có thể trực tiếp kéo ghim bản đồ hoặc cập nhật địa chỉ showroom của sàn ngay trên Dashboard; hệ thống sẽ tự động đồng bộ ngay lập tức sang trang `/showroom` của khách hàng.
- **Duyệt hồ sơ gian hàng (`/admin/sellers`):** Phê duyệt (`active`), từ chối (`rejected`), tạm khóa shop (`banned`) hoặc mở khóa.
- **Kiểm duyệt sản phẩm (`/admin/products`):** Kiểm tra thông số kỹ thuật, hình ảnh thiết bị trước khi cho phép mở bán công khai.
- **Quản lý người dùng (`/admin/users`):** Xem danh sách tài khoản, phân quyền vai trò và quản lý trạng thái hoạt động.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (`techecommercedb`)

Hệ thống bao gồm 18 bảng quan hệ chuẩn hóa:

| STT | Bảng Cơ Sở Dữ Liệu | Vai Trò & Nghiệp Vụ |
| :---: | :--- | :--- |
| 1 | `users` | Tài khoản khách hàng, người bán (`seller`) và quản trị viên (`admin`) |
| 2 | `user_addresses` | Sổ địa chỉ nhận hàng của khách |
| 3 | `categories` | Danh mục thiết bị công nghệ đa cấp (`parent_id`) |
| 4 | `brands` | Thương hiệu công nghệ chính hãng (Apple, ASUS, Dell, MSI, Nvidia...) |
| 5 | `products` | Sản phẩm chính, tên, slug SEO, mô tả, thông số kỹ thuật JSON, `seller_id` |
| 6 | `product_variants` | Biến thể cấu hình SKU (giá bán, giá so sánh, tồn kho, RAM/SSD/Màu sắc) |
| 7 | `carts` | Giỏ hàng của người dùng |
| 8 | `cart_items` | Danh sách sản phẩm và số lượng trong giỏ hàng |
| 9 | `orders` | Đơn hàng, mã đơn, tổng tiền, địa chỉ giao hàng, trạng thái xử lý |
| 10 | `order_items` | Snapshot tên sản phẩm, cấu hình biến thể và giá bán gắn với từng shop |
| 11 | `payments` | Lịch sử giao dịch thanh toán (COD, VietQR, VNPAY, PayPal) |
| 12 | `flash_sales` | Chiến dịch giờ vàng giảm giá (Khung giờ bắt đầu & kết thúc) |
| 13 | `flash_sale_items` | Sản phẩm tham gia Flash Sale (Giá ưu đãi, giới hạn số lượng) |
| 14 | `wishlists` | Danh sách sản phẩm được khách hàng lưu yêu thích |
| 15 | `inventory_logs` | Lịch sử biến động kho (Tự động trừ tồn kho khi phát sinh đơn hàng) |
| 16 | `seller_order_status` | Trạng thái xử lý và mã vận đơn riêng theo từng gian hàng trong đơn |
| 17 | `chat_conversations` | Hội thoại Live Chat riêng biệt giữa khách hàng và từng shop |
| 18 | `chat_messages` | Nội dung tin nhắn chat, ảnh đính kèm, thẻ chia sẻ sản phẩm / đơn hàng |

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án

### 1. Yêu cầu môi trường & Phần mềm cần cài
Trước khi cài đặt, hãy đảm bảo máy tính của bạn đã cài đặt các phần mềm sau:
- **Node.js**: Phiên bản **v20.x** hoặc **v22.x** trở lên ([Tải tại đây](https://nodejs.org/)).
- **XAMPP**: Bao gồm Apache 2.4, MySQL / MariaDB và PHP **8.1** trở lên ([Tải tại đây](https://www.apachefriends.org/)).
- **Git**: Dùng để quản lý mã nguồn.

### 2. Cấu hình Extension PHP (Bắt buộc)
Mở file cấu hình **`php.ini`** trong thư mục XAMPP (`C:\xampp\php\php.ini`) và đảm bảo các dòng sau **không có dấu chấm phẩy (`;`) ở đầu**:
```ini
extension=pdo_mysql
extension=curl
extension=openssl
extension=mbstring
extension=fileinfo
```
> Sau khi chỉnh sửa, lưu file và **Restart Apache** trong XAMPP Control Panel.

### 3. Thiết lập Cơ sở dữ liệu MySQL
1. Mở **XAMPP Control Panel**, bấm **Start** cả **Apache** và **MySQL**.
2. Mở trình duyệt truy cập phpMyAdmin: `http://localhost/phpmyadmin`.
3. Tạo một Database mới có tên: **`techecommercedb`** (Collation: `utf8mb4_unicode_ci`).
4. Nhấn tab **Import**, chọn file `techecommercedb.sql` (hoặc chạy các file trong thư mục `Backend/migrations/`) để khởi tạo toàn bộ 18 bảng CSDL.

### 4. Cấu hình file môi trường `.env`
Tạo một file có tên **`.env`** tại thư mục gốc `E-COMMERCE/` (sao chép nội dung từ `.env.example`):
```env
# Kết nối Cơ sở dữ liệu
DB_HOST=localhost
DB_PORT=3306
DB_NAME=techecommercedb
DB_USER=root
DB_PASS=

# Cấu hình địa chỉ URL
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
VITE_API_URL=http://localhost/TechMart/Backend/api

# Khóa Google Gemini (cho trợ lý ảo AI Chatbot)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Cấu hình gửi mail hóa đơn SMTP (Tùy chọn)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=586
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

### 5. Kết nối Backend với Apache XAMPP
Để Apache của XAMPP nhận diện được thư mục mã nguồn Backend, mở **Command Prompt (cmd) với quyền Administrator** và chạy lệnh tạo liên kết:
```cmd
mklink /J "C:\xampp\htdocs\TechMart" "C:\Users\Asus\Documents\hoc\E-COMMERCE"
```
> Kiểm tra kết nối Backend bằng cách mở trình duyệt truy cập:  
> `http://localhost/TechMart/Backend/api/common/products.php`. Nếu trả về chuỗi JSON thì Backend đã hoạt động chính xác.

### 6. Cài đặt thư viện & Khởi chạy Giao diện Frontend
Mở cửa sổ Terminal tại thư mục `Frontend` và thực hiện các lệnh:

```powershell
# Di chuyển vào thư mục Frontend
cd Frontend

# Cài đặt toàn bộ thư viện phụ thuộc (bao gồm React, Tailwind CSS, Leaflet...)
npm install

# Khởi chạy máy chủ phát triển Frontend
npm run dev
```

Sau khi chạy lệnh, mở trình duyệt truy cập: **`http://localhost:3000`**.

---

## 👥 Hướng Dẫn Tạo & Quản Trị Tài Khoản

Hệ thống được thiết kế khởi đầu luôn ở trạng thái **Khách vãng lai** để đảm bảo tính bảo mật. Bạn có thể chủ động tạo các tài khoản theo nhu cầu:

### 1. Khởi tạo tài khoản Quản trị viên (Admin) đầu tiên
Để tạo tài khoản Admin chính thức và an toàn trực tiếp vào cơ sở dữ liệu, mở Terminal tại thư mục gốc và chạy lệnh CLI:
```powershell
php Backend/scripts/create_admin.php admin@lhktech.vn "Quản Trị Viên LHK"
```
- Hệ thống sẽ yêu cầu bạn nhập mật khẩu quản trị (tối thiểu 12 ký tự).
- Mật khẩu sẽ được mã hóa chuẩn `bcrypt` an toàn và kích hoạt ngay trạng thái `active`.
- Sau khi tạo xong, đăng nhập tại trang `/login` để truy cập vào kênh quản trị `/admin/dashboard`.

### 2. Đăng ký tài khoản Khách hàng (Customer)
- Truy cập trực tiếp đường dẫn `/register`.
- Điền đầy đủ Họ tên, Email, Mật khẩu và bấm Đăng ký. Tài khoản sẽ được kích hoạt ngay lập tức để mua sắm.

### 3. Đăng ký tài khoản Người bán (Seller)
- Truy cập đường dẫn `/seller/register`.
- Nhập thông tin gian hàng (Tên shop, hotline, địa chỉ kho).
- Sau khi gửi đơn đăng ký, đăng nhập tài khoản **Admin** vào mục **Duyệt Gian Hàng (`/admin/sellers`)** để bấm **Phê Duyệt** kích hoạt gian hàng đi vào hoạt động.
