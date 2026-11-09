<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

require_admin();
$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

// 1. GET: Danh sách người dùng sàn
if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT id, full_name, email, phone, role, status, shop_name, created_at FROM users ORDER BY id DESC');
    $stmt->execute();
    $users = array_map('format_public_user', $stmt->fetchAll());
    json_success($users);
}

// 2. PATCH: Đổi trạng thái (active/banned) hoặc đổi vai trò (customer/staff/admin)
if ($method === 'PATCH') {
    $id = require_positive_int($_GET['id'] ?? null, 'ID người dùng');
    $body = get_json_body();
    $action = $_GET['action'] ?? '';

    if ($action === 'status') {
        $status = (string) ($body['status'] ?? '');
        if (!in_array($status, ['active', 'banned'], true)) {
            json_error('Trạng thái người dùng không hợp lệ.', 422);
        }
        $stmt = $pdo->prepare('UPDATE users SET status = :status WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $id]);
        json_success(null, "Đã cập nhật trạng thái người dùng thành '$status'.");
    }

    if ($action === 'role') {
        $role = (string) ($body['role'] ?? '');
        if (!in_array($role, ['customer', 'staff', 'admin'], true)) {
            json_error('Vai trò người dùng không hợp lệ.', 422);
        }
        $stmt = $pdo->prepare('UPDATE users SET role = :role WHERE id = :id');
        $stmt->execute(['role' => $role, 'id' => $id]);
        json_success(null, "Đã chuyển vai trò người dùng thành '$role'.");
    }

    json_error('Hành động không hợp lệ.', 400);
}

json_error('Phương thức không hỗ trợ.', 405);
