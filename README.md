# LHK Tech - Sàn Thương Mại Điện Tử Đồ Công Nghệ

Hệ thống sàn thương mại điện tử chuyên biệt cho các thiết bị và sản phẩm công nghệ cao cấp (Laptop Gaming, Ultrabook, Flagship Smartphone, Màn hình đồ họa, Linh kiện PC & Gaming Gear).

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend:**
  - **Framework & Ngôn ngữ:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - **Công cụ build:** [Vite](https://vite.dev/) (chạy tại cổng mặc định `http://localhost:3000`)
  - **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
  - **Bộ icon:** [Lucide React](https://lucide.dev/)
  - **Điều hướng:** [React Router v7](https://reactrouter.com/)
  - **HTTP Client:** [Axios](https://axios-http.com/) & Fetch API
  - **State Management:** Context API (`AuthContext`, `CartContext`, `WishlistContext`, `ToastContext`, `AuthModalContext`) kết hợp đồng bộ API CSDL và LocalStorage fallback.
- **Cơ sở dữ liệu (Database Schema):**
  - MySQL/MariaDB `techecommercedb` (18 bảng quan hệ: sản phẩm, biến thể, đơn hàng, kho, flash sale, hội thoại chat, tài khoản, `seller_order_status`).
- **Backend:**
  - **PHP 8.x + MySQL/MariaDB** (chạy qua XAMPP hoặc PHP CLI).
  - Kiến trúc API RESTful phân chia rõ ràng theo từng vai trò người dùng (**5 Roles**).
  - Tích hợp **Google Gemini API** cho trợ lý ảo **LHKTech AI**.
  - Cổng thanh toán trực tuyến: **VNPAY Sandbox** & **PayPal**.
  - Dịch vụ gửi email thông báo đơn hàng: **PHPMailer / OrderMailService**.
  - Quản lý phiên làm việc bằng Session Cookie an toàn (`httponly`, `samesite`).
- **SEO & Social Sharing Prerender:**
  - URL thân thiện chuẩn SEO (`/product/:slug`).
  - Thẻ Meta động: Title, Description, Canonical URL, Open Graph (Facebook/Zalo), Twitter Card.
  - Server-Side Meta Injector (`Backend/api/common/seo_render.php`) kết hợp Apache `.htaccess` tự động bắt bot crawler (Facebook Crawler, Googlebot) giải quyết triệt để vấn đề SPA Metadata.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
E-COMMERCE/
├── .env                              # Cấu hình môi trường duy nhất (DB, Gemini API, URLs) - git ignore
├── .env.example                      # Bản mẫu cấu hình chung cho cả Frontend & Backend
├── .gitignore
├── README.md                         # Tài liệu hướng dẫn dự án
│
├── Backend/                          # Phân hệ Backend API (PHP + MariaDB)
│   ├── config/                       # Cấu hình lõi (Đọc từ .env gốc)
│   │   ├── env.php                   # Nạp biến môi trường từ file .env gốc
│   │   ├── database.php              # Kết nối PDO tập trung (Singleton)
│   │   ├── cors.php                  # Xử lý CORS và Session Cookie thống nhất
│   │   ├── mail.php                  # Cấu hình SMTP gửi mail đơn hàng
│   │   ├── vnpay_create.php          # Cấu hình khởi tạo thanh toán VNPAY
│   │   └── vnpay_return.php          # Xử lý kết quả trả về từ VNPAY
│   ├── core/                         # Các hàm tiện ích dùng chung
│   │   ├── response.php              # Helper trả về JSON: json_success(), json_error()
│   │   ├── auth_guard.php            # Kiểm tra quyền & status thực từ DB
│   │   └── OrderMailService.php      # Gửi email hóa đơn tự động
│   ├── migrations/                   # File SQL di chuyển CSDL (Chat, Seller, Enhancements)
│   ├── storage/                      # Lưu trữ ảnh upload (chat attachments...)
│   ├── scripts/                      # Tiện ích CLI (create_admin.php)
│   └── api/                          # HỆ THỐNG API CHIA THEO PHÂN HỆ
│       ├── common/                   # [Public] products, product_detail, seo_render, flash_sales, ai_chat
│       ├── auth/                     # [Tất cả] login, logout, me, register_customer, register_seller
│       ├── customer/                 # [Customer] addresses, orders
│       ├── chat/                     # [Chat] conversations, messages, attachment, notifications, share_options
│       ├── seller/                   # [Seller] dashboard, products, variants, orders, flash_sale, transactions
│       ├── admin/                    # [Admin] metrics, moderation, users
│       ├── vnpay_create_payment.php  # Cổng thanh toán VNPAY
│       ├── vnpay_callback.php        # Webhook IPN xử lý thanh toán VNPAY
│       └── verify_paypal.php         # Xác thực thanh toán PayPal quốc tế
│
└── Frontend/                         # Phân hệ Giao diện (React 19 + TypeScript + Vite)
    ├── vite.config.ts                # Cấu hình envDir, dev crawler middleware
    ├── package.json
    ├── public/
    │   └── .htaccess                 # Cấu hình Apache cho SPA Routing & Crawler Bot
    └── src/
        ├── api/                      # Tầng gọi API Backend (client.ts, chatApi, catalogApi, authApi...)
        ├── components/               # UI components dùng chung (AIChatWidget, TawkToChat, ui/)
        ├── contexts/                 # State toàn cục (Auth, Cart, Wishlist, Toast, AuthModal)
        ├── hooks/                    # Custom Hooks (usePageMeta - quản lý SEO & Open Graph)
        ├── layouts/                  # Layout theo vai trò (CustomerLayout, SellerLayout, AdminLayout, AuthLayout)
        ├── modules/                  # Phân hệ giao diện các trang
        │   ├── auth/                 # Đăng nhập, đăng ký khách hàng & người bán, quên mật khẩu
        │   ├── customer/             # Home, Catalog, ProductDetail, Cart, Checkout, Orders, Wishlist
        │   ├── chat/                 # ChatInboxPage (Hộp thư Live Chat giữa Khách & Shop)
        │   ├── seller/               # Dashboard, Products, Orders, Messages, Analytics
        │   └── admin/                # Dashboard, Reports, Sellers, Products, Users, Categories, Settings
        ├── routes/                   # Hệ thống định tuyến AppRoutes & ProtectedRoute
        ├── services/                 # storageService.ts (đồng bộ CSDL & fallback)
        ├── types/                    # Định nghĩa kiểu dữ liệu TypeScript
        └── utils/                    # Format tiền tệ VNĐ (format.ts)
```

---

## 🌟 Các Phân Hệ & Tính Năng Hoàn Thiện

### 1. Phân Hệ Khách Hàng (Customer Storefront)
- **Trang chủ & Flash Sale (`/`):** Đồng hồ đếm ngược Flash Sale thời gian thực, danh sách deal sốc và banner công nghệ.
- **Danh Mục & Bộ Lọc Nâng Cao (`/catalog`):** Tìm kiếm thông minh (bỏ dấu tiếng Việt), lọc đa chiều theo Thương hiệu & Ngành hàng, sắp xếp giá bán.
- **Chi Tiết Sản Phẩm & SEO Friendly URL (`/product/:slug`):**
  - Đường dẫn thân thiện chuẩn SEO (Ví dụ: `/product/asus-rog-strix-scar-16`).
  - Tự động gán Title, Meta Description, Canonical URL và Open Graph tags cho xem trước khi chia sẻ lên **Facebook / Zalo**.
  - Bộ chọn biến thể cấu hình (RAM, SSD, Màu sắc), cập nhật giá & tồn kho tương ứng.
  - Nút **"Nhắn tin với Shop"** kết nối trò chuyện trực tiếp với chủ gian hàng.
- **Giỏ Hàng & Thanh Toán Đa Cổng (`/cart`, `/checkout`):**
  - Quản lý sổ địa chỉ giao hàng (`user_addresses`).
  - Hỗ trợ 4 phương thức thanh toán linh hoạt:
    1. **COD**: Thanh toán tiền mặt khi nhận hàng.
    2. **VietQR 24/7**: Quét mã QR chuyển khoản ngân hàng tức thì.
    3. **VNPAY-QR / Thẻ Quốc Tế**: Tích hợp cổng thanh toán trực tuyến VNPAY Sandbox.
    4. **PayPal**: Thanh toán qua cổng quốc tế bằng thẻ tín dụng / tài khoản PayPal.
  - Tự động sinh mã đơn hàng chuẩn (`ORD-YYYYMMDD-XXX`), cập nhật tồn kho và ghi nhật ký `inventory_logs`.
- **Lịch Sử Đơn Hàng & Hóa Đơn (`/customer/orders`):**
  - Xem chi tiết từng món hàng, tiến trình xử lý và mã vận đơn giao hàng từ shop.
  - Hỗ trợ hủy đơn hàng khi đang ở trạng thái `pending` (tự động hoàn trả số lượng vào kho).
- **Hệ Thống Live Chat Khách Hàng ↔ Shop (`/customer/messages`):**
  - Nhắn tin trực tiếp với từng gian hàng, đính kèm hình ảnh thiết bị (tối đa 5MB).
  - Chia sẻ trực tiếp thẻ sản phẩm hoặc đơn hàng cần khiếu nại/hỗ trợ ngay trong khung chat.
  - Chức năng trả lời (reply) tin nhắn cụ thể và thu hồi/xóa tin nhắn.
- **Trợ Lý Ảo LHKTech AI (Google Gemini):**
  - Khung chatbox nổi ở góc màn hình kết nối trực tiếp **Google Gemini API** (`Backend/api/common/ai_chat.php`).
  - Tư vấn cấu hình máy, gợi ý laptop gaming/đồ họa/smartphone đang mở bán thực tế trong CSDL và giải đáp chính sách bảo hành.

### 2. Kênh Người Bán (Seller Center)
- **Đăng ký & Kiểm duyệt (`/seller/register`):** Đăng ký thông tin gian hàng (shop name, địa chỉ, ngành hàng kinh doanh). Tài khoản ở trạng thái `inactive` chờ Admin duyệt trước khi được bán hàng.
- **Quản lý sản phẩm & Kho hàng (`/seller/products`):** Thêm mới và chỉnh sửa thiết bị, cấu hình biến thể SKU (giá bán, giá so sánh, tồn kho, ảnh). Sản phẩm mới tự động chuyển trạng thái `pending_review` chờ duyệt.
- **Chiến dịch Flash Sale:** Đăng ký sản phẩm tham gia khung giờ vàng giảm giá trực tiếp từ trang quản lý shop.
- **Xử lý đơn hàng gian hàng (`/seller/orders`):** Tiếp nhận đơn hàng, duyệt giao đơn, cập nhật mã vận đơn riêng theo từng shop (`seller_order_status`).
- **Tin nhắn khách hàng (`/seller/messages`):** Quản lý toàn bộ danh sách hội thoại khách hàng, nhận thông báo tin nhắn chưa đọc và tư vấn bán hàng.
- **Lịch sử giao dịch & Phân tích (`/seller/analytics`, `transactions.php`):** Thống kê doanh thu ròng, lịch sử tiền về từ các cổng thanh toán online, cảnh báo sản phẩm sắp hết hàng ($\le 5$).

### 3. Kênh Quản Trị Viên (Admin Center)
- **Bảng điều khiển chỉ số toàn sàn (`/admin/dashboard`, `/admin/reports`):** Theo dõi tổng doanh số GMV, doanh thu thực tế, số lượng đơn hàng theo ngày/tuần/tháng/năm; phân tích đóng góp doanh số giữa các shop và hỗ trợ xuất báo cáo file CSV.
- **Duyệt hồ sơ gian hàng (`/admin/sellers`):** Xem hồ sơ Seller mới đăng ký, phê duyệt (`active`), từ chối (`rejected`), tạm khóa shop (`banned`) hoặc mở lại.
- **Duyệt sản phẩm đăng bán (`/admin/products`):** Kiểm duyệt nội dung mô tả, hình ảnh, thông số kỹ thuật của thiết bị trước khi cho phép xuất hiện trên sàn (`published`).
- **Quản lý người dùng (`/admin/users`):** Danh sách người dùng, vai trò (`customer`, `seller`, `admin`), phân quyền và kích hoạt tài khoản.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (`techecommercedb`)

Hệ thống bao gồm 18 bảng quan hệ chuẩn hóa:

| STT | Bảng Cơ Sở Dữ Liệu | Vai Trò & Nghiệp Vụ |
| :---: | :--- | :--- |
| 1 | `users` | Tài khoản khách hàng, người bán (`staff`/`seller`) và quản trị viên (`admin`) |
| 2 | `user_addresses` | Sổ địa chỉ nhận hàng của khách |
| 3 | `categories` | Cây danh mục thiết bị công nghệ đa cấp (`parent_id`) |
| 4 | `brands` | Thương hiệu công nghệ chính hãng (Apple, ASUS, Nvidia...) |
| 5 | `products` | Sản phẩm chính, tên, slug, mô tả, thông số kỹ thuật JSON, `seller_id` |
| 6 | `product_variants` | Biến thể sản phẩm (SKU, giá bán, giá so sánh, tồn kho, thuộc tính RAM/SSD/Color) |
| 7 | `carts` | Giỏ hàng người dùng |
| 8 | `cart_items` | Chi tiết món hàng trong giỏ |
| 9 | `orders` | Đơn hàng, mã đơn, tổng tiền, phí vận chuyển, trạng thái đơn & thanh toán |
| 10 | `order_items` | Snapshot tên sản phẩm, cấu hình biến thể và giá bán gắn với `seller_id` |
| 11 | `payments` | Giao dịch thanh toán (COD, VietQR, VNPAY, PayPal) |
| 12 | `flash_sales` | Chiến dịch giờ vàng công nghệ (Khung giờ bắt đầu & kết thúc) |
| 13 | `flash_sale_items` | Sản phẩm tham gia Flash Sale (Giá sốc, giới hạn suất bán, đã bán) |
| 14 | `wishlists` | Danh sách sản phẩm được khách hàng lưu yêu thích |
| 15 | `inventory_logs` | Lịch sử biến động kho (Tự động trừ tồn kho khi phát sinh đơn hàng) |
| 16 | `seller_order_status` | Trạng thái xử lý và mã vận đơn riêng theo từng gian hàng trong đơn nhiều shop |
| 17 | `chat_conversations` | Hội thoại Live Chat riêng biệt cho mỗi cặp khách hàng và shop |
| 18 | `chat_messages` | Nội dung tin nhắn, ảnh đính kèm, thẻ chia sẻ sản phẩm/đơn hàng, phản hồi & xóa tin |

---

## 🛠️ Hướng Dẫn Khởi Chạy Dự Án

### Yêu cầu môi trường:
- [Node.js](https://nodejs.org/) phiên bản 20.x trở lên
- XAMPP (Apache + MySQL/MariaDB, PHP 8.x)

### Bước 1: Khởi động Cơ sở dữ liệu & Cấu hình `.env`
1. Mở **XAMPP Control Panel**, bấm **Start** cả **Apache** và **MySQL**.
2. Mở trình duyệt vào phpMyAdmin (`http://localhost/phpmyadmin`), tạo CSDL tên: **`techecommercedb`**.
3. Import file CSDL `techecommercedb.sql` (hoặc chạy các file migration trong `Backend/migrations/`).
4. Tạo file cấu hình **`.env`** tại thư mục gốc `E-COMMERCE/` (sao chép từ `.env.example`):
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=techecommercedb
   DB_USER=root
   DB_PASS=

   FRONTEND_URL=http://localhost:3000
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   VITE_API_URL=http://localhost/TechMart/Backend/api

   # Khóa Google Gemini (cho LHKTech AI Chatbot)
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.5-flash-lite

   # Cấu hình Live Chat Tawk.to (Tùy chọn)
   VITE_TAWK_PROPERTY_ID=
   VITE_TAWK_WIDGET_ID=
   ```

### Bước 2: Kết nối Backend với Apache XAMPP
Tạo một liên kết thư mục (Directory Junction) từ thư mục dự án sang thư mục `htdocs` của XAMPP bằng quyền Administrator:
```cmd
mklink /J "C:\xampp\htdocs\TechMart" "C:\Users\Asus\Documents\hoc\E-COMMERCE"
```
Kiểm tra API hoạt động bằng cách truy cập: `http://localhost/TechMart/Backend/api/common/products.php`.

### Bước 3: Khởi chạy Giao diện Frontend
Mở terminal tại thư mục `Frontend`:
```powershell
cd Frontend
npm install
npm run dev
```
Mở trình duyệt truy cập: **`http://localhost:3000`**.

---

## ⚡ Tài Khoản Mẫu Để Kiểm Thử

| Vai trò | Email đăng nhập | Mật khẩu mẫu | Chức năng kiểm thử chính |
| :--- | :--- | :---: | :--- |
| 👤 **Khách hàng (Customer)** | `hthuy54365@gmail.com` *(hoặc tạo tại `/register`)* | `12345678` | Mua hàng, thanh toán COD/QR/VNPAY/PayPal, xem đơn hàng, chat trực tiếp với Shop, hỏi đáp LHKTech AI |
| 🏪 **Người bán (Seller)** | `hthuy123@gmail.com` *(hoặc tạo tại `/seller/register`)* | `12345678` | Quản lý kho sản phẩm, tạo Flash Sale, duyệt đơn hàng, chat tư vấn khách hàng (`/seller/messages`) |
| 👑 **Quản trị viên (Admin)** | `admin@lhktech.com` | `12345678` | Bảng điều khiển GMV, duyệt Shop mới (`/admin/sellers`), duyệt sản phẩm (`/admin/products`), quản lý người dùng |
