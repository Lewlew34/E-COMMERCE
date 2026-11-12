import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { CustomerLayout } from '../layouts/CustomerLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { SellerLayout } from '../layouts/SellerLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth Pages
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { RegisterCustomerPage } from '../modules/auth/pages/RegisterCustomerPage';
import { RegisterSellerPage } from '../modules/auth/pages/RegisterSellerPage';
import { ForgotPasswordPage } from '../modules/auth/pages/ForgotPasswordPage';

// Customer Pages
import { CustomerHomePage } from '../modules/customer/home/pages/CustomerHomePage';
import { CatalogPage } from '../modules/customer/catalog/pages/CatalogPage';
import { ProductDetailPage } from '../modules/customer/product/pages/ProductDetailPage';
import { CartPage } from '../modules/customer/cart/pages/CartPage';
import { CheckoutPage } from '../modules/customer/checkout/pages/CheckoutPage';
import { OrderSuccessPage } from '../modules/customer/orders/pages/OrderSuccessPage';
import { CustomerOrdersPage } from '../modules/customer/orders/pages/CustomerOrdersPage';
import { WishlistPage } from '../modules/customer/wishlist/pages/WishlistPage';

// Admin Pages
import { AdminDashboardPage } from '../modules/admin/dashboard/pages/AdminDashboardPage';
import { AdminUsersPage } from '../modules/admin/users/pages/AdminUsersPage';
import { AdminSellersPage } from '../modules/admin/sellers/pages/AdminSellersPage';
import { AdminCategoriesPage } from '../modules/admin/categories/pages/AdminCategoriesPage';
import { AdminReportsPage } from '../modules/admin/reports/pages/AdminReportsPage';
import { AdminProductsPage } from '../modules/admin/products/pages/AdminProductsPage';
import { AdminSettingsPage } from '../modules/admin/settings/pages/AdminSettingsPage';

// Seller Pages
import { SellerDashboardPage } from '../modules/seller/dashboard/pages/SellerDashboardPage';
import { SellerProductsPage } from '../modules/seller/products/pages/SellerProductsPage';
import { SellerOrdersPage } from '../modules/seller/orders/pages/SellerOrdersPage';
import { SellerAnalyticsPage } from '../modules/seller/analytics/pages/SellerAnalyticsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. XÁC THỰC CÔNG KHAI (AUTH ROUTES) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterCustomerPage />} />
        <Route path="/seller/register" element={<RegisterSellerPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* 2. CÁC TRANG CỦA SÀN (BẢO VỆ: YÊU CẦU ĐÃ ĐĂNG NHẬP) */}
      <Route element={<ProtectedRoute />}>
        {/* Phân hệ Khách hàng / Mua sắm (Customer) */}
        <Route element={<CustomerLayout />}>
          <Route index element={<CustomerHomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success/:code" element={<OrderSuccessPage />} />
          <Route path="customer/orders" element={<CustomerOrdersPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>

        {/* 3. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN ROUTES - role: admin) */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="sellers" element={<AdminSellersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* 4. PHÂN HỆ NGƯỜI BÁN HÀNG (SELLER ROUTES - role: staff / seller) */}
        <Route element={<ProtectedRoute allowedRoles={['staff', 'seller', 'SELLER']} />}>
          <Route path="/seller" element={<SellerLayout />}>
            <Route index element={<Navigate to="/seller/dashboard" replace />} />
            <Route path="dashboard" element={<SellerDashboardPage />} />
            <Route path="products" element={<SellerProductsPage />} />
            <Route path="orders" element={<SellerOrdersPage />} />
            <Route path="analytics" element={<SellerAnalyticsPage />} />
            <Route path="*" element={<Navigate to="/seller/dashboard" replace />} />
          </Route>
        </Route>
      </Route>

      {/* 5. WILDCARD FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
