<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

if (empty($_SESSION['auth_user_id'])) {
    json_response(['status' => 'success', 'user' => null, 'data' => null]);
}

$pdo = get_db_connection();
$stmt = $pdo->prepare(
    'SELECT id, full_name, email, phone, role, status, shop_name, shop_address, business_category, created_at
     FROM users WHERE id = :id AND status = "active"'
);
$stmt->execute(['id' => (int) $_SESSION['auth_user_id']]);
$user = $stmt->fetch();

if (!$user) {
    $_SESSION = [];
    session_destroy();
    json_response(['status' => 'success', 'user' => null, 'data' => null]);
}

$publicUser = format_public_user($user);
json_response([
    'status' => 'success',
    'user' => $publicUser,
    'data' => $publicUser,
]);
