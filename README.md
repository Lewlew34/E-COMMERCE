# TechMart - Sàn Thương Mại Điện Tử Đồ Công Nghệ

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
- **Backend:**
  - **PHP 8.x + MySQL/MariaDB** (chạy qua XAMPP hoặc PHP CLI).
  - Kiến trúc API RESTful phân chia rõ ràng theo từng vai trò người dùng (**5 Roles**).
  - Quản lý phiên làm việc bằng Session Cookie an toàn (`httponly`, `samesite`).
- **Cấu hình môi trường:**
  - File `.env` duy nhất tại thư mục gốc dùng chung cho cả Frontend và Backend.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
E-COMMERCE/
├── .env                              # Cấu hình môi trường duy nhất (DB, URLs) - git ignore
├── .env.example                      # Bản mẫu cấu hình chung cho cả Frontend & Backend
├── .gitignore
├── README.md                         # Tài liệu hướng dẫn dự án
│
├── Backend/                          # Phân hệ Backend API (PHP + MariaDB)
│   ├── config/                       # Cấu hình lõi (Đọc từ .env gốc)
│   │   ├── env.php                   # Nạp biến môi trường từ file .env gốc
│   │   ├── database.php              # Kết nối PDO tập trung (Singleton)
│   │   └── cors.php                  # Xử lý CORS và Session Cookie thống nhất
│   │
│   ├── core/                         # Các hàm tiện ích dùng chung
│   │   ├── response.php              # Helper trả về JSON: json_success(), json_error()
│   │   └── auth_guard.php            # Kiểm tra quyền: require_customer(), require_seller(), require_admin()
│   │
│   └── api/                          # HỆ THỐNG API CHIA THEO 5 NHÓM ROLE
│       ├── common/                   # [Public/Guest] Sản phẩm, chi tiết đa biến thể, danh mục, hãng, flash sale
│       ├── auth/                     # [Tất cả] Đăng nhập, đăng ký (Cus/Seller), đăng xuất, phiên làm việc
│       ├── customer/                 # [Customer] Tạo đơn checkout, xem lịch sử đơn, hủy đơn, sổ địa chỉ
│       ├── seller/                   # [Seller] Quản lý kho sản phẩm shop, thêm biến thể SKU, duyệt đơn, báo cáo
│       └── admin/                    # [Admin] Quản trị danh sách người dùng sàn, khóa/mở tài khoản, chỉ số GMV
│
└── Frontend/                         # Phân hệ Giao diện (React 19 + TypeScript + Vite)
    ├── vite.config.ts                # Cấu hình envDir: '../' để đọc .env gốc
    ├── package.json
    └── src/
        ├── api/                      # Tầng gọi API Backend (chia theo 5 Role tương ứng 1:1)
        │   ├── client.ts             # Fetch wrapper cơ sở đọc VITE_API_URL
        │   ├── common/               # catalogApi.ts (sản phẩm, biến thể, danh mục, hãng)
        │   ├── auth/                 # authApi.ts (login, register, logout, me)
        │   ├── customer/             # customerOrderApi.ts, customerAddressApi.ts
        │   ├── seller/               # sellerProductApi.ts, sellerOrderApi.ts, sellerMetricsApi.ts
        │   └── admin/                # adminUserApi.ts, adminMetricsApi.ts
        │
        ├── components/               # UI components dùng chung (AIChatWidget, TawkToChat...)
        ├── contexts/                 # Quản lý State toàn cục (Auth, Cart, Wishlist, Toast)
        ├── layouts/                  # Layout theo vai trò (CustomerLayout, SellerLayout)
        ├── modules/                  # Phân hệ giao diện các trang
        │   ├── auth/                 # Đăng nhập, đăng ký khách hàng & người bán
        │   ├── customer/             # Home, Catalog, ProductDetail, Cart, Checkout, Orders
        │   ├── seller/               # Dashboard, Products, Orders, Analytics
        │   └── admin/                # Dashboard, Users
        ├── services/                 # storageService.ts (adapter chuyển tiếp & mock data fallback)
        ├── types/                    # Định nghĩa kiểu dữ liệu TypeScript
        └── utils/                    # Format tiền tệ VNĐ, date, validation
```

---

## 🌟 Các Phân Hệ & Tính Năng Hoàn Thiện

### 1. Phân Hệ Khách Hàng (Customer Experience)
- **Trang chủ & Flash Sale Giờ Vàng (`/`):**
  - Đồng hồ đếm ngược Flash Sale theo thời gian thực.
  - Lưới sản phẩm nổi bật kèm thông số cấu hình tóm tắt (CPU, GPU, RAM, Màn hình).
  - Đối tác thương hiệu công nghệ ủy quyền (Apple, ASUS ROG, NVIDIA...).
- **Danh Mục & Bộ Lọc Nâng Cao (`/catalog`):**
  - Tìm kiếm theo từ khóa thông minh (hỗ trợ tiếng Việt có dấu và không dấu).
  - Lọc đa chiều theo Danh mục thiết bị và Thương hiệu sản xuất.
  - Sắp xếp linh hoạt theo giá tăng/giảm hoặc mức độ phổ biến.
- **Trang Chi Tiết Sản Phẩm (`/product/:id`):**
  - **Bộ chọn biến thể (Variant Matrix) nối MySQL thực tế:** Chọn cấu hình (RAM, SSD, màu sắc) $\rightarrow$ giá bán và tồn kho tương ứng tự động cập nhật.
  - Bảng thông số kỹ thuật chi tiết (Tech Specifications).
  - Nút *"Thêm vào giỏ hàng"* (kiểm tra giới hạn tồn kho) và *"Mua ngay"*.
- **Giỏ Hàng Tương Tác (`/cart`):**
  - Tăng/giảm số lượng món hàng, tự động giới hạn theo số lượng tồn kho từng biến thể.
  - Tự động tính phí vận chuyển (Miễn phí hỏa tốc cho đơn từ 500.000đ).
- **Thanh Toán & Đặt Hàng (`/checkout`):**
  - Sổ địa chỉ nhận hàng lưu CSDL (`user_addresses`).
  - Phương thức thanh toán: **COD** (tiền mặt khi nhận), **Chuyển khoản VietQR 24/7** (kèm mã QR mẫu), **Thẻ tín dụng**.
  - Tự động tạo mã đơn hàng chuẩn (`ORD-YYYYMMDD-XXX`), trừ tồn kho biến thể và ghi nhận vào `inventory_logs`.
- **Theo Dõi Đơn Hàng & Hủy Đơn (`/customer/orders`):**
  - Xem danh sách đơn hàng thực tế từ CSDL kèm trạng thái mới nhất do Seller cập nhật.
  - Cho phép khách hàng tự hủy đơn khi đơn ở trạng thái chờ duyệt (`pending`) và tự động hoàn lại tồn kho trong MySQL.
- **Trợ Lý Ảo TechMart AI:**
  - Nút và cửa sổ chatbox AI thông minh cố định tại góc dưới bên phải màn hình (`bottom-6 right-6`), tư vấn cấu hình thiết bị và chính sách giao hàng tức thì.

### 2. Kênh Người Bán (Seller Center)
- **Quản lý sản phẩm, tồn kho và Flash Sale (`/seller/products`):**
  - Dữ liệu sản phẩm được giới hạn theo tài khoản Seller đang đăng nhập (`role = staff/seller`).
  - Thêm, sửa sản phẩm và thêm biến thể SKU mới, tự động lưu lịch sử kho (`inventory_logs`).
  - Thiết lập chiến dịch Flash Sale Giờ Vàng cho sản phẩm của shop.
  - Ẩn sản phẩm an toàn (soft delete) thay vì xóa vĩnh viễn để bảo toàn dữ liệu đơn hàng cũ.
- **Xử lý đơn hàng cửa hàng (`/seller/orders`):**
  - Tiếp nhận đơn hàng có chứa sản phẩm của shop.
  - Quy trình duyệt đơn 4 bước: *Chờ xác nhận $\rightarrow$ Đã duyệt $\rightarrow$ Đang giao $\rightarrow$ Hoàn thành*, hỗ trợ nhập mã vận đơn.
- **Dashboard & Phân tích doanh số (`/seller/dashboard` & `/seller/analytics`):**
  - Thống kê doanh thu thực tế dựa trên các đơn đã giao thành công (`delivered`).
  - Báo cáo số lượng đơn cần duyệt, cảnh báo sản phẩm sắp hết hàng ($\le 5$) và top sản phẩm bán chạy nhất.

### 3. Kênh Quản Trị Viên (Admin Center)
- **Quản trị người dùng sàn (`/admin/users`):**
  - Tải danh sách toàn bộ tài khoản người dùng từ bảng `users` trong MySQL.
  - Thao tác khóa (`banned`) hoặc mở khóa (`active`) tài khoản vi phạm.
  - Phân quyền và chuyển đổi vai trò người dùng (`customer` $\leftrightarrow$ `staff` $\leftrightarrow$ `admin`).
- **Thống kê toàn sàn (`/admin/dashboard`):**
  - Thống kê tổng doanh thu toàn sàn (GMV), tổng số đơn hàng, số lượng nhà bán và khách hàng.

---

## 🛠️ Hướng Dẫn Khởi Chạy Dự Án

### Yêu cầu môi trường:
- [Node.js](https://nodejs.org/) phiên bản 20.x trở lên
- XAMPP (Apache + MySQL/MariaDB)

---

### Bước 1: Cấu hình CSDL và File `.env`

1. **Khởi động XAMPP:**
   - Mở XAMPP Control Panel, bấm **Start** cả 2 dịch vụ: **Apache** và **MySQL**.
2. **Cơ sở dữ liệu:**
   - Mở phpMyAdmin: `http://localhost/phpmyadmin`.
   - Tạo database tên: `techecommercedb`.
   - Import file dump CSDL của bạn vào database này.
3. **Cấu hình file `.env` tại thư mục gốc `E-COMMERCE/`:**
   - Nếu chưa có file `.env`, sao chép từ `.env.example`:
     ```powershell
     copy .env.example .env
     ```
   - Kiểm tra các thông số trong `.env`:
     ```env
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=techecommercedb
     DB_USER=root
     DB_PASS=

     FRONTEND_URL=http://localhost:3000
     ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

     VITE_API_URL=http://localhost/TechMart/Backend/api
     ```

---

### Bước 2: Kết nối Backend với Apache XAMPP

Apache của XAMPP phục vụ tại `C:\xampp\htdocs`. Để Apache nhận code Backend mà **không cần copy thủ công mỗi khi sửa code**, bạn tạo liên kết tắt (Directory Junction) bằng lệnh sau:

*Mở Command Prompt (CMD) và chạy:*
```cmd
mklink /J "C:\xampp\htdocs\TechMart" "C:\Users\Asus\Documents\hoc\E-COMMERCE"
```
*(Thay đường dẫn trên bằng đường dẫn thực tế đến thư mục E-COMMERCE trên máy bạn nếu khác).*

Kiểm tra API hoạt động bằng cách mở trình duyệt vào:
`http://localhost/TechMart/Backend/api/common/products.php` $\rightarrow$ Nếu trả về JSON danh sách sản phẩm là thành công!

---

### Bước 3: Khởi chạy Giao diện Frontend

Mở Terminal tại thư mục dự án và chạy:
```powershell
# 1. Di chuyển vào thư mục Frontend
cd Frontend

# 2. Cài đặt thư viện phụ thuộc (nếu là lần đầu)
npm install

# 3. Khởi chạy Vite dev server
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ: **`http://localhost:3000`**

---

## ⚡ Tài Khoản Mẫu Để Kiểm Thử

| Vai trò | Email đăng nhập | Mật khẩu mẫu | Chức năng kiểm thử chính |
| :--- | :--- | :---: | :--- |
| 👤 **Khách hàng (Customer)** | Đăng ký mới tại `/register` hoặc tài khoản có sẵn trong DB | Mật khẩu khi tạo | Mua hàng, thanh toán COD/QR, xem và hủy đơn hàng |
| 🏪 **Người bán (Seller)** | Đăng ký mới tại `/seller/register` hoặc tài khoản `staff` trong DB | Mật khẩu khi tạo | Thêm sản phẩm, tạo Flash Sale, duyệt đơn hàng |
| 👑 **Quản trị viên (Admin)** | Truy cập trực tiếp trang `/admin/users` | - | Khóa/mở khóa tài khoản, phân quyền người dùng |
