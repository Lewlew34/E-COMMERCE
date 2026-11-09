<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$customer = require_customer();
$userId = $customer['id'];
$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

// LẤY DANH SÁCH ĐỊA CHỈ
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, user_id, recipient_name, phone, address_line, ward, district, city, is_default
         FROM user_addresses WHERE user_id = :user_id ORDER BY is_default DESC, id DESC'
    );
    $stmt->execute(['user_id' => $userId]);
    $addresses = array_map(static fn($r) => [
        'id' => (int) $r['id'],
        'userId' => (int) $r['user_id'],
        'recipientName' => $r['recipient_name'],
        'phone' => $r['phone'],
        'addressLine' => $r['address_line'],
        'ward' => $r['ward'] ?? '',
        'district' => $r['district'] ?? '',
        'city' => $r['city'],
        'isDefault' => (bool) $r['is_default'],
    ], $stmt->fetchAll());

    json_success($addresses);
}

// THÊM ĐỊA CHỈ MỚI
if ($method === 'POST') {
    $body = get_json_body();
    $recipientName = trim((string) ($body['recipientName'] ?? ''));
    $phone = trim((string) ($body['phone'] ?? ''));
    $addressLine = trim((string) ($body['addressLine'] ?? ''));
    $ward = trim((string) ($body['ward'] ?? ''));
    $district = trim((string) ($body['district'] ?? ''));
    $city = trim((string) ($body['city'] ?? ''));
    $isDefault = !empty($body['isDefault']) ? 1 : 0;

    if ($recipientName === '' || $phone === '' || $addressLine === '' || $city === '') {
        json_error('Vui lòng điền đủ tên, số điện thoại, số nhà/đường và tỉnh/thành phố.', 422);
    }

    if ($isDefault === 1) {
        $pdo->prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = :user_id')
            ->execute(['user_id' => $userId]);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, ward, district, city, is_default)
         VALUES (:user_id, :recipient_name, :phone, :address_line, :ward, :district, :city, :is_default)'
    );
    $stmt->execute([
        'user_id' => $userId,
        'recipient_name' => $recipientName,
        'phone' => $phone,
        'address_line' => $addressLine,
        'ward' => $ward ?: null,
        'district' => $district ?: null,
        'city' => $city,
        'is_default' => $isDefault,
    ]);

    json_success(['id' => (int) $pdo->lastInsertId()], 'Đã thêm địa chỉ mới.', 201);
}

// XÓA ĐỊA CHỈ
if ($method === 'DELETE') {
    $id = require_positive_int($_GET['id'] ?? null, 'ID địa chỉ');
    $stmt = $pdo->prepare('DELETE FROM user_addresses WHERE id = :id AND user_id = :user_id');
    $stmt->execute(['id' => $id, 'user_id' => $userId]);
    json_success(null, 'Đã xóa địa chỉ.');
}

json_error('Phương thức không hỗ trợ.', 405);
