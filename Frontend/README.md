# Phân Hệ Frontend - TechMart

Phân hệ giao diện người dùng của sàn thương mại điện tử công nghệ TechMart, được phát triển trên nền tảng **React 19**, **TypeScript**, **Vite** và **Tailwind CSS v4**.

---

## ⚙️ Cấu Hình Cổng Chạy (Port: 3000)

Cổng localhost được thiết lập cố định tại file [`vite.config.ts`](file:///c:/Users/Asus/Documents/hoc/E-COMMERCE/Frontend/vite.config.ts):

```typescript
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000, // Cấu hình chạy tại http://localhost:3000
  },
})
```

---

## 🏗️ Kiến Trúc Thư Mục Chuẩn Hóa (`Role & Feature-based`)

Dự án được phân chia theo cấu trúc mô-đun hóa, giúp bạn dễ dàng tìm kiếm, chỉnh sửa và mở rộng tính năng:

```text
src/
├── assets/                 # Hình ảnh, logo, vector tĩnh
├── components/             # Thành phần giao diện dùng chung
│   ├── common/             # Header, Footer, Thanh điều hướng, Breadcrumb...
│   └── ui/                 # Nút bấm (Button), Ô nhập (Input), Hộp thoại (Modal)...
├── config/                 # Các hằng số, đường dẫn và cấu hình toàn cục
├── contexts/               # Quản lý trạng thái chia sẻ (AuthContext, ThemeContext...)
├── hooks/                  # Custom hooks tái sử dụng
├── layouts/                # Khung giao diện riêng biệt cho từng vai trò
│   ├── CustomerLayout.tsx  # Khung trang khách hàng (TopBar, Logo, Giỏ hàng, Menu danh mục)
│   ├── AdminLayout.tsx     # Khung trang quản trị viên (Sidebar đen mờ, Topbar KPI)
│   ├── SellerLayout.tsx    # Khung kênh người bán (Sidebar gian hàng, Profile shop)
│   └── AuthLayout.tsx      # Khung trang đăng nhập / đăng ký
├── modules/                # CÁC MÔ-ĐUN CHỨC NĂNG CHÍNH
│   ├── auth/               # Phân hệ đăng nhập, đăng ký khách hàng và người bán
│   ├── customer/           # Phân hệ mua sắm của khách hàng (Trang chủ, Bộ lọc, Giỏ hàng)
│   ├── admin/              # Phân hệ quản trị sàn (Dashboard GMV, Duyệt hồ sơ người bán)
│   └── seller/             # Phân hệ kênh người bán (Quản lý kho hàng, xử lý đơn hàng)
├── routes/                 # Quản lý điều hướng (AppRoutes) và bộ bảo vệ quyền (ProtectedRoute)
├── services/               # Dữ liệu mẫu (Mock data) và các hàm gọi API
├── types/                  # Định nghĩa kiểu dữ liệu TypeScript (Auth, Product, Order...)
└── utils/                  # Các hàm tiện ích (format tiền tệ VNĐ, format ngày tháng...)
```

---

## 💻 Các Lệnh Thao Tác (Scripts)

Chạy các lệnh sau bên trong thư mục `Frontend`:

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev` | Khởi chạy máy chủ phát triển cục bộ tại `http://localhost:3000` |
| `npm run build` | Kiểm tra lỗi TypeScript (`tsc -b`) và biên dịch đóng gói sản phẩm |
| `npm run preview` | Xem trước bản build production tại localhost |

---

## 🛡️ Hệ Thống Phân Quyền & Kiểm Thử Nhanh

- Hệ thống tích hợp sẵn thanh công cụ **Chuyển nhanh vai trò (Role Switcher)** ngay trên thanh thông báo đầu trang để bạn thử nghiệm qua lại giữa 3 góc nhìn:
  - **Khách Hàng** (`CUSTOMER`): Xem trang chủ mua sắm tại `/`
  - **Kênh Người Bán** (`SELLER`): Quản lý gian hàng tại `/seller/dashboard`
  - **Quản Trị Viên** (`ADMIN`): Quản lý sàn tại `/admin/dashboard`
- Nếu truy cập đường dẫn trái quyền (ví dụ khách hàng cố tình vào `/admin`), bộ lọc [`ProtectedRoute`](file:///c:/Users/Asus/Documents/hoc/E-COMMERCE/Frontend/src/routes/ProtectedRoute.tsx) sẽ tự động chặn và chuyển hướng về đúng trang tương ứng.
