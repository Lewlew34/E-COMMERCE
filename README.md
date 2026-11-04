# TechMart - Sàn Thương Mại Điện Tử Đồ Công Nghệ

Hệ thống sàn thương mại điện tử chuyên biệt cho các thiết bị và sản phẩm công nghệ cao cấp (Laptop Gaming, Ultrabook, Flagship Smartphone, Màn hình đồ họa, Linh kiện PC & Gaming Gear).

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend:**
  - **Framework / Thư viện:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - **Công cụ build:** [Vite](https://vite.dev/) (chạy tại cổng mặc định `http://localhost:3000`)
  - **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
  - **Bộ icon:** [Lucide React](https://lucide.dev/)
  - **Điều hướng:** [React Router v7](https://reactrouter.com/)
  - **State & Storage:** Context API (`CartContext`, `WishlistContext`, `ToastContext`, `AuthContext`) kết hợp đồng bộ bền vững qua `localStorage`.
- **Cơ sở dữ liệu (Database Schema):**
  - Thiết kế chuẩn 15 bảng quan hệ (`script.sql`) hỗ trợ đa biến thể, quản lý kho, flash sale và sổ địa chỉ giao hàng.
- **Backend:**
  - Định hướng xây dựng RESTful API bằng **PHP** (kết nối cơ sở dữ liệu và xác thực người dùng).

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
E-COMMERCE/
├── Frontend/                           # Phân hệ giao diện người dùng (React 19 + TypeScript)
│   ├── public/                         # Assets tĩnh công khai
│   └── src/
│       ├── layouts/                    # Khung layout theo vai trò (Customer, Seller, Admin, Auth)
│       ├── modules/                    # Các module tính năng theo phân hệ nghiệp vụ
│       │   ├── auth/                   # Đăng nhập, đăng ký tài khoản khách hàng & người bán
│       │   ├── customer/               # Phân hệ Khách hàng
│       │   │   ├── home/               # Trang chủ, banner ưu đãi, top thương hiệu
│       │   │   ├── catalog/            # Danh mục sản phẩm, bộ lọc hãng, ngành hàng, giá bán
│       │   │   ├── product/            # Chi tiết sản phẩm, chọn biến thể (Variant), thông số kỹ thuật
│       │   │   ├── cart/               # Giỏ hàng tương tác, chọn sản phẩm, tính phí ship
│       │   │   ├── checkout/           # Thanh toán, sổ địa chỉ (user_addresses), COD & VietQR
│       │   │   ├── orders/             # Đặt hàng thành công & Quản lý lịch sử đơn hàng
│       │   │   └── wishlist/           # Danh sách thiết bị công nghệ yêu thích
│       │   ├── seller/                 # Kênh Người Bán (Seller Center)
│       │   │   ├── dashboard/          # Thống kê doanh thu shop, đơn hàng mới
│       │   │   ├── products/           # Quản lý thiết bị đa biến thể (SKU, giá, tồn kho) & Thêm mới
│       │   │   └── orders/             # Tiếp nhận đơn, quy trình duyệt đơn & bàn giao vận chuyển
│       │   └── admin/                  # Kênh Quản Trị Viên (Admin Center)
│       │       ├── dashboard/          # Thống kê chỉ số GMV toàn sàn, phân bổ ngành hàng
│       │       └── users/              # Quản lý người dùng và duyệt tài khoản
│       ├── contexts/                   # Quản lý trạng thái toàn cục (Auth, Cart, Wishlist, Toast)
│       ├── services/                   # Dữ liệu mẫu (Database Mock) & Tầng lưu trữ (Storage Service)
│       ├── routes/                     # Hệ thống định tuyến & Bảo vệ phân quyền (ProtectedRoute)
│       ├── types/                      # Định nghĩa kiểu dữ liệu TypeScript chuẩn 1:1 với Database
│       └── utils/                      # Hàm tiện ích (định dạng tiền tệ VNĐ, ngày tháng...)
├── Backend/                            # Phân hệ máy chủ API (triển khai giai đoạn tiếp theo)
└── README.md                           # Tài liệu tổng quan dự án
```

---

## 🌟 Các Phân Hệ & Tính Năng Đã Hoàn Thiện

### 1. Phân Hệ Khách Hàng (Customer Experience)
- **Trang chủ & Flash Sale Giờ Vàng:**
  - Đồng hồ đếm ngược Flash Sale theo thời gian thực.
  - Lưới sản phẩm nổi bật kèm thông số cấu hình tóm tắt (CPU, GPU, RAM, Màn hình).
  - Đối tác thương hiệu công nghệ ủy quyền (Apple, ASUS ROG, NVIDIA, Samsung, Sony...).
- **Danh Mục & Bộ Lọc Nâng Cao (`/catalog`):**
  - Tìm kiếm theo từ khóa thông minh.
  - Lọc đa chiều theo Danh mục thiết bị và Thương hiệu sản xuất.
  - Sắp xếp linh hoạt theo mức độ phổ biến, giá tăng dần hoặc giảm dần.
- **Trang Chi Tiết Sản Phẩm (`/product/:id`):**
  - Bộ chọn ảnh theo biến thể (Gallery preview & Thumbnails).
  - **Bộ chọn biến thể (Variant Matrix):** Chọn cấu hình (RAM, SSD, Màu sắc) $\rightarrow$ giá bán và tồn kho tương ứng tự động cập nhật.
  - Bảng thông số kỹ thuật chi tiết (Tech Specifications).
  - Nút *"Thêm vào giỏ hàng"* (có kiểm tra giới hạn tồn kho) và *"Mua ngay"*.
- **Giỏ Hàng Tương Tác (`/cart`):**
  - Tăng/giảm số lượng món hàng, tự động giới hạn theo số lượng tồn kho của từng biến thể.
  - Checkbox chọn từng món hoặc chọn tất cả để thanh toán.
  - Tự động tính phí vận chuyển (Miễn phí hỏa tốc cho đơn từ 500.000đ).
- **Thanh Toán & Đặt Hàng (`/checkout`):**
  - Sổ địa chỉ nhận hàng (`user_addresses`): Chọn địa chỉ có sẵn hoặc thêm nhanh địa chỉ mới (Phường/Xã, Quận/Huyện, Tỉnh/TP).
  - Phương thức thanh toán: **COD** (tiền mặt khi nhận), **Chuyển khoản VietQR 24/7** (kèm mã QR mẫu), **Thẻ tín dụng quốc tế**.
  - Tự động tạo mã đơn hàng chuẩn (`ORD-YYYYMMDD-XXX`) và lưu bản sao địa chỉ (`shipping_address_snapshot`).
- **Đặt Hàng Thành Công & Theo Dõi Đơn (`/order-success/:code` & `/customer/orders`):**
  - Xem danh sách đơn đã đặt kèm các tab lọc: *Tất cả, Chờ xử lý, Đang vận chuyển, Hoàn tất, Đã hủy*.
  - Hỗ trợ hủy đơn hàng khi đơn còn ở trạng thái chờ duyệt (`pending`).
- **Danh Sách Yêu Thích (`/wishlist`):**
  - Lưu các thiết bị quan tâm để theo dõi biến động giá, hỗ trợ 1-Click thêm vào giỏ.

### 2. Kênh Người Bán (Seller Center)
- **Quản lý sản phẩm đa biến thể (`/seller/products`):**
  - Hiển thị danh sách SKU, giá niêm yết, giá khuyến mãi và số lượng tồn kho từng mẫu.
  - Modal tạo thiết bị mới: Nhập thông tin cấu hình, hãng, danh mục và khởi tạo biến thể đầu tiên.
  - Xóa sản phẩm và cập nhật danh mục kho hàng.
- **Xử lý đơn hàng cửa hàng (`/seller/orders`):**
  - Tiếp nhận đơn hàng do khách đặt theo thời gian thực.
  - Quy trình xử lý đơn qua các bước: *Duyệt đơn $\rightarrow$ Bàn giao đơn vị vận chuyển $\rightarrow$ Đã giao xong*.
  - Xem chi tiết từng đơn hàng và địa chỉ người nhận.

### 3. Kênh Quản Trị Viên (Admin Center)
- **Bảng điều khiển tổng quan (`/admin/dashboard`):**
  - Theo dõi chỉ số doanh thu (GMV), tăng trưởng đơn hàng toàn sàn.
  - Thống kê tỷ trọng doanh số theo từng nhóm ngành hàng công nghệ.
- **Quản trị người dùng sàn (`/admin/users`):**
  - Danh sách tài khoản người dùng, vai trò (`customer`, `seller`, `admin`) và trạng thái hoạt động.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu Mô Phỏng (`script.sql`)

Hệ thống đã chuẩn hóa TypeScript Interfaces và tầng dữ liệu mô phỏng khớp hoàn toàn với **15 bảng** trong database:

| STT | Bảng Cơ Sở Dữ Liệu | Vai Trò & Nghiệp Vụ |
| :---: | :--- | :--- |
| 1 | `users` | Tài khoản khách hàng, người bán và quản trị viên |
| 2 | `user_addresses` | Sổ địa chỉ giao hàng (Tên, SĐT, Số nhà, Phường, Quận, Tỉnh/TP, Mặc định) |
| 3 | `categories` | Cây danh mục thiết bị công nghệ (hỗ trợ phân cấp `parent_id`) |
| 4 | `brands` | Thương hiệu công nghệ chính hãng (Apple, ASUS ROG, NVIDIA, Sony...) |
| 5 | `products` | Thông tin sản phẩm chính, mô tả và bảng thông số kỹ thuật (JSON) |
| 6 | `product_variants` | Biến thể sản phẩm (SKU, giá bán, so sánh giá, tồn kho, thuộc tính) |
| 7 | `carts` | Giỏ hàng người dùng |
| 8 | `cart_items` | Chi tiết món hàng trong giỏ gắn theo từng biến thể (`variant_id`) |
| 9 | `orders` | Đơn hàng, mã đơn, tổng tiền, phí ship, trạng thái đơn & thanh toán |
| 10 | `order_items` | Snapshot tên sản phẩm, cấu hình biến thể và giá tại thời điểm đặt |
| 11 | `payments` | Giao dịch thanh toán (COD, Chuyển khoản QR, Thẻ tín dụng) |
| 12 | `flash_sales` | Chiến dịch giờ vàng công nghệ (Khung giờ bắt đầu & kết thúc) |
| 13 | `flash_sale_items` | Sản phẩm tham gia Flash Sale (Giá sốc, giới hạn số suất, đã bán) |
| 14 | `wishlists` | Danh sách sản phẩm được khách hàng lưu yêu thích |
| 15 | `inventory_logs` | Lịch sử biến động kho (Tự động trừ tồn kho khi phát sinh đơn hàng) |

---

## 🛠️ Hướng Dẫn Khởi Chạy Dự Án

### Yêu cầu môi trường:
- [Node.js](https://nodejs.org/) phiên bản 18+ trở lên
- Trình quản lý gói `npm`

### Chạy phân hệ Frontend:
```powershell
# 1. Di chuyển vào thư mục Frontend
cd Frontend

# 2. Cài đặt các thư viện phụ thuộc (nếu là lần đầu)
npm install

# 3. Khởi chạy môi trường phát triển Vite
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ: **`http://localhost:3000`**

---

## ⚡ Thanh Chuyển Vai Trò Nhanh (Role Switcher)

Để hỗ trợ kiểm thử và trình diễn toàn bộ chức năng mà không cần đăng nhập lại nhiều lần, ứng dụng tích hợp thanh **Role Switcher** tại thanh thông báo đầu trang (Top Bar):
- Bấm vào nút vai trò trên cùng bên phải để chuyển ngay lập tức giữa:
  - 👤 **Khách Hàng (Customer)**: Mua sắm, giỏ hàng, thanh toán, xem đơn hàng.
  - 🏪 **Người Bán (Seller Center)**: Quản lý kho sản phẩm biến thể, duyệt đơn hàng.
  - 👑 **Quản Trị Viên (Admin Portal)**: Bảng điều khiển GMV, quản lý người dùng.
