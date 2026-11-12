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
  - MySQL/MariaDB `techecommercedb` lưu sản phẩm, đơn hàng, kho và tài khoản; migration bổ sung quyền sở hữu gian hàng cùng trạng thái xử lý Seller.
- **Backend:**
  - **PHP + MySQL/MariaDB** chạy qua XAMPP, dùng session và API JSON cho đăng nhập, mua hàng và Seller Center.

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
│       │       ├── dashboard/          # GMV, doanh thu đã giao, đơn hàng và hàng chờ duyệt
│       │       ├── reports/            # Báo cáo theo kỳ và theo từng gian hàng
│       │       ├── sellers/            # Duyệt và quản lý gian hàng
│       │       ├── products/           # Duyệt sản phẩm của Seller
│       │       └── users/              # Quản lý người dùng
│       ├── contexts/                   # Quản lý trạng thái toàn cục (Auth, Cart, Wishlist, Toast)
│       ├── services/                   # Dữ liệu mẫu (Database Mock) & Tầng lưu trữ (Storage Service)
│       ├── routes/                     # Hệ thống định tuyến & Bảo vệ phân quyền (ProtectedRoute)
│       ├── types/                      # Định nghĩa kiểu dữ liệu TypeScript chuẩn 1:1 với Database
│       └── utils/                      # Hàm tiện ích (định dạng tiền tệ VNĐ, ngày tháng...)
├── Backend/                            # PHP API và migration MySQL cho Seller Center
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
- **Quản lý sản phẩm, tồn kho và Flash Sale (`/seller/products`):**
  - Dữ liệu sản phẩm được giới hạn theo tài khoản Seller đang đăng nhập.
  - Thêm/sửa sản phẩm và SKU, điều chỉnh tồn kho có ghi lịch sử, ẩn sản phẩm thay vì xóa dữ liệu đơn cũ.
  - Tạo Flash Sale có giá, thời hạn và giới hạn số lượng; sản phẩm đang khuyến mãi được phục vụ qua API công khai.
- **Xử lý đơn hàng cửa hàng (`/seller/orders`):**
  - Đơn checkout được lưu trong MySQL và gắn với Seller sở hữu sản phẩm.
  - Quy trình: *Chờ xác nhận → Đã duyệt → Đang giao → Đã giao*; có thể nhập mã vận đơn.
  - Hủy đơn chỉ hoàn tồn kho các sản phẩm của Seller đó; trạng thái Seller và lịch sử kho được lưu trong database.
- **Dashboard và phân tích:** doanh thu đơn đã giao, trạng thái đơn, tồn kho thấp và sản phẩm bán chạy lấy từ dữ liệu thực; không có bảng đánh giá/lượt xem trong schema nên không hiển thị số giả.

### 3. Kênh Quản Trị Viên (Admin Center)
- **Bảng điều khiển & báo cáo (`/admin/dashboard`, `/admin/reports`):** GMV, doanh thu đơn đã giao, số đơn hàng theo ngày/tuần/tháng/năm; so sánh GMV, doanh thu đã giao và lượng đơn riêng cho từng shop. Báo cáo theo shop có thể xuất CSV.
- **Duyệt gian hàng (`/admin/sellers`):** hồ sơ Seller mới đăng ký ở trạng thái chờ; Admin có thể duyệt, từ chối, khóa hoặc mở khóa shop. Seller chưa được duyệt không thể đăng nhập vào Seller Center.
- **Duyệt sản phẩm (`/admin/products`):** xem mô tả, thông số, ảnh, giá, tồn kho và shop gửi sản phẩm; duyệt để đăng công khai hoặc từ chối. Thêm/sửa sản phẩm hay biến thể cần được duyệt lại.
- Sản phẩm của shop chưa được duyệt hoặc đang bị khóa sẽ không xuất hiện trên storefront và không thể checkout, kể cả khi khách còn giữ sản phẩm trong giỏ.
- **Quản trị người dùng (`/admin/users`):** xem tài khoản, vai trò và trạng thái hoạt động.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (`techecommercedb`)

Database gồm các bảng nghiệp vụ chính và bảng `seller_order_status` được thêm bởi migration Seller:

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
| 16 | `seller_order_status` | Trạng thái xử lý và mã vận đơn riêng theo từng gian hàng trong đơn nhiều shop |

---

## 🛠️ Hướng Dẫn Khởi Chạy Dự Án

### Yêu cầu môi trường:
- [Node.js](https://nodejs.org/) phiên bản 20.19+ hoặc 22.12+ (phù hợp Vite 8)
- Trình quản lý gói `npm`
- XAMPP với Apache, MySQL và PHP PDO MySQL được bật

### Cấu hình Backend với XAMPP:
1. Mở XAMPP Control Panel và khởi chạy **Apache** cùng **MySQL**.
2. Đặt/cập nhật thư mục `Backend` của dự án tại `C:\xampp\htdocs\TechMart\Backend`. Frontend hiện gọi API tại `http://localhost/TechMart/Backend/api`.
3. Mở phpMyAdmin (`http://localhost/phpmyadmin`), chọn database `techecommercedb`, rồi import `Backend/migrations/20261108_seller_center.sql` **một lần duy nhất**. Migration thêm thông tin gian hàng, quyền sở hữu sản phẩm/đơn hàng và trạng thái xử lý riêng của Seller. Không chạy lại sau khi đã import.
4. Cấu hình kết nối MySQL mặc định nằm trong `Backend/config/database.php` (host `localhost`, database `techecommercedb`, user `root`, mật khẩu trống). Nếu XAMPP của bạn dùng cấu hình khác, cập nhật file này.
5. Nếu database chưa có tài khoản Admin đang hoạt động, mở PowerShell tại thư mục dự án và tạo một tài khoản riêng bằng CLI:

   ```powershell
   C:\xampp\php\php.exe Backend\scripts\create_admin.php admin@example.com "Quan tri vien"
   ```

   Nhập mật khẩu tối thiểu 12 ký tự tại dấu nhắc (ký tự sẽ hiển thị; hãy dùng terminal riêng tư). Script chỉ chạy bằng CLI, không tạo tài khoản qua web và không thay đổi email đã tồn tại.
6. Đăng ký tài khoản tại trang đăng ký Người bán. Hồ sơ sẽ ở trạng thái chờ Admin duyệt; Seller chưa được duyệt không thể đăng nhập. Các sản phẩm cũ không tự động thuộc về tài khoản mới. Để giao sản phẩm cũ cho Seller, chạy thủ công sau khi thay email và ID sản phẩm phù hợp:

   ```sql
   UPDATE products
   SET seller_id = (SELECT id FROM users WHERE email = 'seller@example.com')
   WHERE id IN (1, 2);

   UPDATE order_items oi
   JOIN product_variants pv ON pv.id = oi.variant_id
   JOIN products p ON p.id = pv.product_id
   SET oi.seller_id = p.seller_id
   WHERE oi.seller_id IS NULL;
   ```

7. Đăng ký tài khoản khách hàng riêng để thử checkout. Seller chỉ được vào Seller Center sau khi Admin duyệt hồ sơ. Đơn đặt cho sản phẩm đã gán Seller sẽ xuất hiện trong Seller Center. Tài khoản/demo đăng nhập cũ chạy local không tạo đơn database.
8. Để tạo một đơn hàng thử nghiệm mà không cần thao tác checkout, chỉnh email Seller/Customer và slug sản phẩm trong `Backend/seed_seller_test.sql`, rồi chạy file đó trong phpMyAdmin. Script chỉ gán sản phẩm được chọn, tạo một đơn chờ xác nhận và trừ một sản phẩm tồn kho; chạy mỗi lần sẽ tạo thêm một đơn mới.

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

Nếu trình duyệt dùng địa chỉ `http://127.0.0.1:3000`, thêm origin đó (và origin thực tế) vào danh sách cho phép trong `Backend/config/cors.php`.

### Bật live chat Tawk.to:
1. Tạo tài khoản tại [Tawk.to](https://www.tawk.to/), tạo Property cho TechMart và thêm website đang chạy vào danh sách domain được phép nếu Tawk yêu cầu.
2. Trong Tawk.to, mở **Administration → Channels → Chat Widget → Direct Chat Link / Widget Code** (tên mục có thể thay đổi), lấy **Property ID** và **Widget ID** trong mã nhúng.
3. Tạo file `Frontend/.env.local` từ `Frontend/.env.example` rồi điền hai giá trị:

   ```env
   VITE_TAWK_PROPERTY_ID=your_property_id
   VITE_TAWK_WIDGET_ID=default
   ```

4. Khởi động lại Vite (`npm run dev`). Widget live chat sẽ hiển thị ở góc dưới bên phải trên các trang mua sắm; chatbot tư vấn sản phẩm hiện có được chuyển sang góc dưới bên trái. Nếu để trống ID thì không tải script Tawk.to.

Không commit `.env.local`; hai ID dùng để nhúng widget trên trình duyệt, không phải mật khẩu tài khoản Tawk.to. Cấu hình hiện kết nối mọi khách vào cùng một inbox/shop Tawk.to. Muốn mỗi gian hàng Marketplace có hộp thư riêng cần cấu hình Property hoặc cơ chế định tuyến riêng cho từng Seller.

---

## ⚡ Thanh Chuyển Vai Trò Nhanh (Role Switcher)

Để trình diễn phần giao diện mẫu, ứng dụng tích hợp thanh **Role Switcher** tại thanh thông báo đầu trang (Top Bar):
- Bấm vào nút vai trò trên cùng bên phải để chuyển ngay lập tức giữa:
  - 👤 **Khách Hàng (Customer)**: Mua sắm, giỏ hàng, thanh toán, xem đơn hàng.
  - 🏪 **Người Bán (Seller Center)**: Quản lý kho sản phẩm biến thể, duyệt đơn hàng.
  - 👑 **Quản Trị Viên (Admin Portal)**: Bảng điều khiển GMV, quản lý người dùng.
- Đây là chuyển vai trò demo phía giao diện, không thay thế phiên PHP/MySQL và không dùng cho đơn hàng thực.
- Để xem dữ liệu Admin thật từ MySQL, tạo tài khoản Admin bằng CLI ở bước cấu hình Backend rồi đăng nhập bằng tài khoản đó; Role Switcher không cấp quyền Admin cho API.
