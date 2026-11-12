<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Phương thức yêu cầu không hợp lệ.', 405);
}

$body = get_json_body();
$email = filter_var(trim((string) ($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$password = (string) ($body['password'] ?? '');

if (!$email || $password === '') {
    json_error('Vui lòng nhập email và mật khẩu hợp lệ.', 422);
}

$pdo = get_db_connection();
$stmt = $pdo->prepare(
    'SELECT id, full_name, email, phone, password_hash, role, status, shop_name, shop_address, business_category, created_at
     FROM users WHERE email = :email LIMIT 1'
);
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_error('Email hoặc mật khẩu không chính xác.', 401);
}

if ($user['status'] !== 'active') {
    if (in_array($user['role'], ['staff', 'seller'], true) && $user['status'] === 'inactive') {
        json_error('Hồ sơ gian hàng đang chờ Admin phê duyệt. Bạn sẽ đăng nhập được sau khi được duyệt.', 403);
    }
    if (in_array($user['role'], ['staff', 'seller'], true) && $user['status'] === 'rejected') {
        json_error('Hồ sơ đăng ký gian hàng đã bị từ chối. Vui lòng liên hệ quản trị viên.', 403);
    }
    json_error('Tài khoản này đã bị khóa hoặc chưa được kích hoạt.', 403);
}

session_regenerate_id(true);
$_SESSION['auth_user_id'] = (int) $user['id'];
$_SESSION['auth_role'] = $user['role'];

if (in_array($user['role'], ['staff', 'seller'], true)) {
    $_SESSION['seller_user_id'] = (int) $user['id'];
    $_SESSION['seller_role'] = $user['role'];
} else {
    unset($_SESSION['seller_user_id'], $_SESSION['seller_role']);
}

$publicUser = format_public_user($user);
json_response([
    'status' => 'success',
    'message' => 'Đăng nhập thành công.',
    'user' => $publicUser,
    'data' => $publicUser,
]);
