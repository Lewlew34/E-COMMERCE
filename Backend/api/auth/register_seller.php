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
$shopName = trim((string) ($body['shopName'] ?? ''));
$email = filter_var(trim((string) ($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$phone = trim((string) ($body['phone'] ?? ''));
$address = trim((string) ($body['address'] ?? ''));
$category = trim((string) ($body['category'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($name === '' || $shopName === '' || !$email || $phone === '' || $address === '' || $category === '' || strlen($password) < 6) {
    json_error('Vui lòng điền đủ thông tin; mật khẩu cần tối thiểu 6 ký tự.', 422);
}

$pdo = get_db_connection();
$stmt = $pdo->prepare(
    'INSERT INTO users (email, password_hash, full_name, phone, role, status, shop_name, shop_address, business_category)
     VALUES (:email, :password_hash, :full_name, :phone, "staff", "inactive", :shop_name, :shop_address, :business_category)'
);

try {
    $stmt->execute([
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'full_name' => $name,
        'phone' => $phone,
        'shop_name' => $shopName,
        'shop_address' => $address,
        'business_category' => $category,
    ]);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        json_error('Email này đã được đăng ký trong hệ thống.', 409);
    }
    throw $error;
}

$userId = (int) $pdo->lastInsertId();

$user = [
    'id' => $userId,
    'name' => $name,
    'full_name' => $name,
    'email' => $email,
    'phone' => $phone,
    'role' => 'staff',
    'status' => 'inactive',
    'shopName' => $shopName,
    'createdAt' => date('Y-m-d H:i:s'),
];

json_response([
    'status' => 'success',
    'message' => 'Đã gửi hồ sơ đăng ký. Bạn có thể đăng nhập sau khi quản trị viên phê duyệt.',
    'user' => $user,
    'data' => $user,
], 201);
