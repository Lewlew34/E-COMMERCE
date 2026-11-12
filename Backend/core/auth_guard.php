<?php
declare(strict_types=1);

require_once __DIR__ . '/response.php';
require_once dirname(__DIR__) . '/config/database.php';

/**
 * Kiểm tra người dùng đã đăng nhập chưa
 */
function require_auth(): array
{
    if (empty($_SESSION['auth_user_id'])) {
        json_error('Vui lòng đăng nhập để tiếp tục.', 401);
    }
    return [
        'id' => (int) $_SESSION['auth_user_id'],
        'role' => (string) ($_SESSION['auth_role'] ?? 'customer'),
    ];
}

/**
 * Bắt buộc vai trò Khách hàng (Customer)
 */
function require_customer(): array
{
    $auth = require_auth();
    if ($auth['role'] !== 'customer') {
        json_error('Thao tác này chỉ dành cho tài khoản Khách hàng.', 403);
    }
    return $auth;
}

/**
 * Bắt buộc vai trò Người bán (Seller / Staff)
 */
function require_seller(): array
{
    $auth = require_auth();
    if (!in_array($auth['role'], ['staff', 'seller'], true)) {
        json_error('Vui lòng đăng nhập bằng tài khoản Người bán (Seller).', 403);
    }
    $stmt = get_db_connection()->prepare('SELECT status FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $auth['id']]);
    if ($stmt->fetchColumn() !== 'active') {
        json_error('Gian hàng chưa được phê duyệt hoặc hiện không hoạt động.', 403);
    }
    return $auth;
}

/**
 * Bắt buộc vai trò Quản trị viên (Admin)
 */
function require_admin(): array
{
    $auth = require_auth();
    if ($auth['role'] !== 'admin') {
        json_error('Thao tác này yêu cầu quyền Quản trị viên (Admin).', 403);
    }
    $stmt = get_db_connection()->prepare('SELECT role, status FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $auth['id']]);
    $user = $stmt->fetch();
    if (!$user || $user['role'] !== 'admin' || $user['status'] !== 'active') {
        json_error('Tài khoản không còn quyền quản trị hoạt động.', 403);
    }
    return $auth;
}

/**
 * Format thông tin người dùng công khai an toàn (loại bỏ password_hash)
 */
function format_public_user(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => $user['full_name'] ?? '',
        'full_name' => $user['full_name'] ?? '',
        'email' => $user['email'] ?? '',
        'phone' => $user['phone'] ?? '',
        'role' => $user['role'] ?? 'customer',
        'status' => $user['status'] ?? 'active',
        'shopName' => $user['shop_name'] ?? null,
        'shopAddress' => $user['shop_address'] ?? null,
        'businessCategory' => $user['business_category'] ?? null,
        'createdAt' => $user['created_at'] ?? null,
    ];
}
