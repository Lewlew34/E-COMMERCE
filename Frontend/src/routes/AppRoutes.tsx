import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CustomerLayout } from '../layouts/CustomerLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { SellerLayout } from '../layouts/SellerLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth Pages
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { RegisterCustomerPage } from '../modules/auth/pages/RegisterCustomerPage';
import { RegisterSellerPage } from '../modules/auth/pages/RegisterSellerPage';

// Customer Pages
import { CustomerHomePage } from '../modules/customer/home/pages/CustomerHomePage';
import { CatalogPage } from '../modules/customer/catalog/pages/CatalogPage';
import { CartPage } from '../modules/customer/cart/pages/CartPage';

// Admin Pages
import { AdminDashboardPage } from '../modules/admin/dashboard/pages/AdminDashboardPage';
import { AdminUsersPage } from '../modules/admin/users/pages/AdminUsersPage';

// Seller Pages
import { SellerDashboardPage } from '../modules/seller/dashboard/pages/SellerDashboardPage';
import { SellerProductsPage } from '../modules/seller/products/pages/SellerProductsPage';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. KHÁCH HÀNG (CUSTOMER ROUTES) */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<CustomerHomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="cart" element={<CartPage />} />
      </Route>

      {/* 2. XÁC THỰC (AUTH ROUTES) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterCustomerPage />} />
        <Route path="/seller/register" element={<RegisterSellerPage />} />
      </Route>

      {/* 3. QUẢN TRỊ VIÊN (ADMIN ROUTES - PROTECTED) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="sellers" element={<AdminDashboardPage />} />
          <Route path="categories" element={<AdminDashboardPage />} />
          <Route path="reports" element={<AdminDashboardPage />} />
        </Route>
      </Route>

      {/* 4. NGƯỜI BÁN HÀNG (SELLER ROUTES - PROTECTED) */}
      <Route element={<ProtectedRoute allowedRoles={['SELLER']} />}>
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<Navigate to="/seller/dashboard" replace />} />
          <Route path="dashboard" element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="orders" element={<SellerDashboardPage />} />
          <Route path="analytics" element={<SellerDashboardPage />} />
        </Route>
      </Route>

      {/* 5. WILDCARD FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
