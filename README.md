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
  - **State Management:** Context API (`AuthContext`, `CartContext`, `WishlistContext`, `ToastContext`) kết hợp đồng bộ API CSDL và LocalStorage fallback.
- **Cơ sở dữ liệu (Database Schema):**
  - MySQL/MariaDB `techecommercedb` (16 bảng quan hệ: sản phẩm, biến thể, đơn hàng, kho, flash sale, tài khoản, `seller_order_status`).
- **Backend:**
  - **PHP 8.x + MySQL/MariaDB** (chạy qua XAMPP hoặc PHP CLI).
  - Kiến trúc API RESTful phân chia rõ ràng theo từng vai trò người dùng (**5 Roles**).
  - Tích hợp **Google Gemini API** cho trợ lý ảo **LHKTech AI**.
  - Quản lý phiên làm việc bằng Session Cookie an toàn (`httponly`, `samesite`).
- **Cấu hình môi trường:**
  - File `.env` duy nhất tại thư mục gốc dùng chung cho cả Frontend và Backend.

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
│   │   └── cors.php                  # Xử lý CORS và Session Cookie thống nhất
│   ├── core/                         # Các hàm tiện ích dùng chung
│   │   ├── response.php              # Helper trả về JSON: json_success(), json_error()
│   │   └── auth_guard.php            # Kiểm tra quyền & status thực từ DB
│   ├── migrations/                   # Script migration SQL (20261108_seller_center.sql)
│   ├── scripts/                      # Tiện ích CLI (create_admin.php)
│   └── api/                          # HỆ THỐNG API CHIA THEO 5 NHÓM ROLE
│       ├── common/                   # [Public/Guest] Sản phẩm, biến thể, danh mục, hãng, flash sale, ai_chat.php
│       ├── auth/                     # [Tất cả] Đăng nhập, đăng ký (Cus/Seller), đăng xuất, phiên làm việc
│       ├── customer/                 # [Customer] Tạo đơn checkout, lịch sử đơn, hủy đơn, sổ địa chỉ
│       ├── seller/                   # [Seller] Quản lý kho sản phẩm shop, biến thể SKU, duyệt đơn, báo cáo
│       └── admin/                    # [Admin] Moderation (duyệt shop/sản phẩm), người dùng, báo cáo GMV
│
└── Frontend/                         # Phân hệ Giao diện (React 19 + TypeScript + Vite)
    ├── vite.config.ts                # Cấu hình envDir: '../' để đọc .env gốc
    ├── package.json
    └── src/
        ├── api/                      # Tầng gọi API Backend (chia theo 5 Role tương ứng 1:1)
        │   ├── client.ts             # Fetch wrapper cơ sở đọc VITE_API_URL
        │   ├── common/               # catalogApi.ts, aiChatApi.ts
        │   ├── auth/                 # authApi.ts (login, register, logout, me)
        │   ├── customer/             # customerOrderApi.ts, customerAddressApi.ts
        │   ├── seller/               # sellerProductApi.ts, sellerOrderApi.ts, sellerMetricsApi.ts
        │   └── admin/                # adminUserApi.ts, adminMetricsApi.ts, adminModerationApi.ts
        ├── components/               # UI components dùng chung (AIChatWidget, TawkToChat...)
        ├── contexts/                 # Quản lý State toàn cục (Auth, Cart, Wishlist, Toast)
        ├── layouts/                  # Layout theo vai trò (Customer, Seller, Admin, DashboardPortalLayout)
        ├── modules/                  # Phân hệ giao diện các trang
        │   ├── auth/                 # Đăng nhập, đăng ký khách hàng & người bán
        │   ├── customer/             # Home, Catalog, ProductDetail, Cart, Checkout, Orders
        │   ├── seller/               # Dashboard, Products, Orders, Analytics
        │   └── admin/                # Dashboard, Reports, Sellers, Products, Users, Categories, Settings
        ├── services/                 # storageService.ts (adapter chuyển tiếp & mock data fallback)
        ├── types/                    # Định nghĩa kiểu dữ liệu TypeScript
        └── utils/                    # Format tiền tệ VNĐ, date, validation
```

---

## 🌟 Các Phân Hệ & Tính Năng Hoàn Thiện

### 1. Phân Hệ Khách Hàng (Customer Experience)
- **Trang chủ & Flash Sale Giờ Vàng (`/`):** Đồng hồ đếm ngược Flash Sale, lưới sản phẩm nổi bật kèm thông số cấu hình tóm tắt.
- **Danh Mục & Bộ Lọc Nâng Cao (`/catalog`):** Tìm kiếm thông minh (có dấu/không dấu), lọc theo Danh mục & Thương hiệu, sắp xếp theo giá.
- **Chi Tiết Sản Phẩm (`/product/:id`):** Bộ chọn biến thể nối MySQL thực tế, bảng thông số kỹ thuật, giới hạn tồn kho.
- **Giỏ Hàng & Thanh Toán (`/cart`, `/checkout`):** Sổ địa chỉ (`user_addresses`), COD / VietQR 24/7 / Thẻ tín dụng, tạo mã đơn (`ORD-YYYYMMDD-XXX`), trừ tồn kho và ghi `inventory_logs`.
- **Theo Dõi & Hủy Đơn (`/customer/orders`):** Đồng bộ trạng thái xử lý mới nhất từ Seller; tự hoàn tồn kho khi hủy đơn `pending`.
- **Trợ Lý Ảo LHKTech AI:** Tích hợp Google Gemini (`Backend/api/common/ai_chat.php`) tư vấn cấu hình, gợi ý sản phẩm đang bán hợp lệ từ MySQL và chính sách giao hàng.

### 2. Kênh Người Bán (Seller Center)
- **Đăng ký & Phê duyệt (`/seller/register`):** Hồ sơ mới tạo ở trạng thái `inactive`, chờ Admin duyệt mới được đăng nhập Seller Center.
- **Quản lý sản phẩm, tồn kho & Flash Sale (`/seller/products`):** Thêm/sửa sản phẩm và biến thể SKU (tự động đưa về `pending_review` chờ Admin kiểm duyệt trước khi hiển thị công khai), tạo Flash Sale, soft-delete an toàn.
- **Xử lý đơn hàng (`/seller/orders`):** Quy trình duyệt đơn theo từng gian hàng (`seller_order_status`) và cập nhật mã vận đơn.
- **Dashboard & Phân tích (`/seller/dashboard`, `/seller/analytics`):** Doanh thu đơn đã giao, cảnh báo tồn kho thấp ($\le 5$) và sản phẩm bán chạy.

### 3. Kênh Quản Trị Viên (Admin Center)
- **Bảng điều khiển & báo cáo (`/admin/dashboard`, `/admin/reports`):** GMV, doanh thu đơn đã giao, số đơn hàng theo ngày/tuần/tháng/năm; so sánh GMV, doanh thu đã giao và lượng đơn riêng từng shop; hỗ trợ xuất CSV.
- **Duyệt gian hàng (`/admin/sellers`):** Xem hồ sơ Seller đăng ký mới, duyệt (`active`), từ chối (`rejected`), khóa (`banned`) hoặc mở khóa shop.
- **Duyệt sản phẩm (`/admin/products`):** Xem mô tả, thông số, ảnh, giá, tồn kho và shop gửi sản phẩm; duyệt đăng công khai (`published`) hoặc từ chối (`rejected`).
- **Bảo vệ hiển thị & thanh toán:** Sản phẩm đang chờ duyệt hoặc thuộc shop chưa duyệt/bị khóa không hiển thị trên storefront, AI Chat và bị chặn khi checkout.
- **Quản trị người dùng (`/admin/users`):** Quản lý danh sách người dùng, vai trò và trạng thái hoạt động.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (`techecommercedb`)

| STT | Bảng Cơ Sở Dữ Liệu | Vai Trò & Nghiệp Vụ |
| :---: | :--- | :--- |
| 1 | `users` | Tài khoản khách hàng, người bán (`staff`/`seller`) và quản trị viên (`admin`) |
| 2 | `user_addresses` | Sổ địa chỉ giao hàng |
| 3 | `categories` | Cây danh mục thiết bị công nghệ (`parent_id`) |
| 4 | `brands` | Thương hiệu công nghệ |
| 5 | `products` | Sản phẩm chính, mô tả, thông số kỹ thuật (JSON), `seller_id` |
| 6 | `product_variants` | Biến thể sản phẩm (SKU, giá, tồn kho, thuộc tính) |
| 7 | `carts` | Giỏ hàng người dùng |
| 8 | `cart_items` | Chi tiết món hàng trong giỏ |
| 9 | `orders` | Đơn hàng, mã đơn, tổng tiền, phí ship, trạng thái đơn & thanh toán |
| 10 | `order_items` | Chi tiết đơn hàng gắn `seller_id` |
| 11 | `payments` | Giao dịch thanh toán (COD, QR, Thẻ) |
| 12 | `flash_sales` | Chiến dịch giờ vàng công nghệ |
| 13 | `flash_sale_items` | Sản phẩm tham gia Flash Sale |
| 14 | `wishlists` | Danh sách sản phẩm yêu thích |
| 15 | `inventory_logs` | Lịch sử biến động kho |
| 16 | `seller_order_status` | Trạng thái xử lý và mã vận đơn riêng theo từng shop |

---

## 🛠️ Hướng Dẫn Khởi Chạy Dự Án

### Yêu cầu môi trường:
- [Node.js](https://nodejs.org/) phiên bản 20.x trở lên
- XAMPP (Apache + MySQL/MariaDB, PHP 8.x)

### Bước 1: Cấu hình CSDL và File `.env`

1. **Khởi động XAMPP:** Mở XAMPP Control Panel, bấm **Start** cả **Apache** và **MySQL**.
2. **Cơ sở dữ liệu:**
   - Mở phpMyAdmin (`http://localhost/phpmyadmin`), tạo/chọn database `techecommercedb` và import dữ liệu gốc.
   - Nếu DB chưa có cột/bảng của Seller Center, import `Backend/migrations/20261108_seller_center.sql` **một lần duy nhất**.
3. **Tạo tài khoản Admin (nếu DB chưa có):**
   ```powershell
   C:\xampp\php\php.exe Backend\scripts\create_admin.php admin@example.com "Quan tri vien"
   ```
   *(Nhập mật khẩu tối thiểu 12 ký tự tại dấu nhắc CLI).*
4. **Cấu hình file `.env` tại thư mục gốc `E-COMMERCE/`:**
   - Sao chép từ `.env.example` nếu chưa có:
     ```powershell
     copy .env.example .env
     ```
   - Điền cấu hình DB, `GEMINI_API_KEY` (nếu dùng LHKTech AI) và `VITE_API_URL=http://localhost/TechMart/Backend/api`.

### Bước 2: Kết nối Backend với Apache XAMPP

Tạo liên kết tắt (Directory Junction) trỏ vào `C:\xampp\htdocs\TechMart`:
```cmd
mklink /J "C:\xampp\htdocs\TechMart" "C:\Users\Asus\Documents\hoc\E-COMMERCE"
```
Kiểm tra API tại `http://localhost/TechMart/Backend/api/common/products.php`.

### Bước 3: Khởi chạy Giao diện Frontend

```powershell
cd Frontend
npm install
npm run dev
```
Ứng dụng chạy tại: **`http://localhost:3000`**.

### Bật live chat Tawk.to (tùy chọn):
1. Tạo Property trên [Tawk.to](https://www.tawk.to/) và lấy **Property ID** + **Widget ID**.
2. Tạo `Frontend/.env.local` từ `Frontend/.env.example`:
   ```env
   VITE_TAWK_PROPERTY_ID=your_property_id
   VITE_TAWK_WIDGET_ID=default
   ```
3. Khởi động lại `npm run dev`. Không commit `.env.local`.

---

## ⚡ Tài Khoản Mẫu Để Kiểm Thử

| Vai trò | Email đăng nhập | Mật khẩu mẫu | Chức năng kiểm thử chính |
| :--- | :--- | :---: | :--- |
| 👤 **Khách hàng (Customer)** | Đăng ký tại `/register` hoặc tài khoản có sẵn trong DB | Mật khẩu khi tạo | Mua hàng, thanh toán COD/QR, xem/hủy đơn, hỏi LHKTech AI |
| 🏪 **Người bán (Seller)** | Đăng ký tại `/seller/register` (chờ Admin duyệt) hoặc `staff` active trong DB | Mật khẩu khi tạo | Thêm sản phẩm (`pending_review`), tạo Flash Sale, duyệt đơn |
| 👑 **Quản trị viên (Admin)** | Tạo bằng `Backend/scripts/create_admin.php` hoặc nâng quyền `role='admin'` trong DB | Mật khẩu khi tạo | Duyệt Seller (`/admin/sellers`), duyệt sản phẩm (`/admin/products`), báo cáo GMV (`/admin/reports`) |
