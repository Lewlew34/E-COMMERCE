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
$name = trim((string) ($body['name'] ?? ''));
$email = filter_var(trim((string) ($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$phone = trim((string) ($body['phone'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($name === '' || !$email || $phone === '' || strlen($password) < 6) {
    json_error('Vui lòng điền đủ thông tin; mật khẩu cần tối thiểu 6 ký tự.', 422);
}

$pdo = get_db_connection();
$stmt = $pdo->prepare(
    'INSERT INTO users (email, password_hash, full_name, phone, role, status)
     VALUES (:email, :password_hash, :full_name, :phone, "customer", "active")'
);

try {
    $stmt->execute([
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'full_name' => $name,
        'phone' => $phone,
    ]);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        json_error('Email này đã được đăng ký trong hệ thống.', 409);
    }
    throw $error;
}

$userId = (int) $pdo->lastInsertId();
session_regenerate_id(true);
$_SESSION['auth_user_id'] = $userId;
$_SESSION['auth_role'] = 'customer';
unset($_SESSION['seller_user_id'], $_SESSION['seller_role']);

$user = [
    'id' => $userId,
    'name' => $name,
    'full_name' => $name,
    'email' => $email,
    'phone' => $phone,
    'role' => 'customer',
    'status' => 'active',
    'shopName' => null,
    'createdAt' => date('Y-m-d H:i:s'),
];

json_response([
    'status' => 'success',
    'message' => 'Đăng ký tài khoản khách hàng thành công.',
    'user' => $user,
    'data' => $user,
], 201);
