# TechMart - Sàn Thương Mại Điện Tử Đồ Công Nghệ

Hệ thống sàn thương mại điện tử chuyên biệt cho các thiết bị và sản phẩm công nghệ (Laptop Gaming, PC đồ họa, Smartphone, Màn hình, Linh kiện và Phụ kiện cao cấp).

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend:**
  - **Framework / Thư viện:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - **Công cụ build:** [Vite](https://vite.dev/) (chạy tại cổng mặc định `http://localhost:3000`)
  - **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
  - **Bộ icon:** [Lucide React](https://lucide.dev/)
  - **Điều hướng & Phân quyền:** [React Router v7](https://reactrouter.com/)
- **Cơ sở dữ liệu:** [MySQL](https://www.mysql.com/)
- **Backend:** *(Dự kiến lựa chọn và triển khai sau khi hoàn thiện giao diện)*

---

## 📂 Cấu Trúc Dự Án

```text
E-COMMERCE/
├── Frontend/               # Mã nguồn phân hệ giao diện người dùng (React + TS)
│   ├── public/             # Assets tĩnh công khai
│   └── src/
│       ├── layouts/        # Khung giao diện theo từng vai trò (Customer, Admin, Seller, Auth)
│       ├── modules/        # Phân hệ chức năng theo vai trò (Role & Feature-based)
│       │   ├── auth/       # Đăng nhập, đăng ký khách hàng, đăng ký người bán
│       │   ├── customer/   # Sàn mua sắm công nghệ (Trang chủ, Bộ lọc, Giỏ hàng)
│       │   ├── admin/      # Quản trị sàn (Dashboard GMV, Duyệt shop, Quản lý tài khoản)
│       │   └── seller/     # Kênh người bán (Seller Center - Xử lý đơn, tồn kho)
│       ├── routes/         # Quản lý định tuyến và bảo vệ phân quyền (ProtectedRoute)
│       ├── contexts/       # Quản lý trạng thái xác thực và vai trò người dùng (AuthContext)
│       ├── services/       # Dữ liệu giả lập (Mock data) & API service
│       └── types/          # Định nghĩa kiểu dữ liệu TypeScript (User, Product, Order...)
├── Backend/                # Mã nguồn phân hệ máy chủ API (sẽ triển khai ở giai đoạn tiếp theo)
└── README.md               # Tài liệu tổng quan dự án
```

---

## 👥 Các Vai Trò Trong Hệ Thống (RBAC)

1. **Khách Hàng (Customer):**
   - Trải nghiệm mua sắm thiết bị công nghệ với thông số kỹ thuật chi tiết (CPU, RAM, GPU, Màn hình...).
   - Săn ưu đãi giờ vàng (Flash Sale) đếm ngược theo thời gian thực.
   - Quản lý giỏ hàng và đặt hàng.
2. **Người Bán Hàng (Seller):**
   - Trang quản trị gian hàng (Seller Center).
   - Quản lý kho hàng, đăng bán thiết bị công nghệ.
   - Tiếp nhận và cập nhật tiến trình đơn hàng (Xác nhận đơn $\rightarrow$ Giao đơn vị vận chuyển).
3. **Quản Trị Viên Sàn (Admin):**
   - Theo dõi chỉ số doanh thu (GMV), tăng trưởng đơn hàng toàn sàn.
   - Kiểm duyệt hồ sơ mở shop của người bán mới (Phê duyệt / Từ chối).
   - Quản lý người dùng và theo dõi tỷ trọng doanh thu theo từng ngành hàng.

---

## 🛠️ Hướng Dẫn Khởi Chạy Dự Án

### Yêu cầu môi trường:
- [Node.js](https://nodejs.org/) phiên bản 18+ trở lên
- Trình quản lý gói `npm`

### Chạy phân hệ Frontend:
```powershell
# 1. Di chuyển vào thư mục Frontend
cd Frontend

# 2. Cài đặt các thư viện phụ thuộc (nếu chưa cài)
npm install

# 3. Khởi chạy môi trường phát triển
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ: **`http://localhost:3000`**

---

## ⚡ Tài Khoản Kiểm Thử Nhanh (Demo)

Tại trang **Đăng nhập** (`/login`), hệ thống hỗ trợ **3 nút bấm 1-Click Demo** để bạn trải nghiệm ngay từng vai trò mà không cần nhập mật khẩu:
- **Khách hàng:** `khachhang@techstore.vn`
- **Người bán:** `seller@gearzone.vn`
- **Admin:** `admin@techmart.vn`
