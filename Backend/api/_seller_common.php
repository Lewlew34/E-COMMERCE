<?php
declare(strict_types=1);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'path' => '/',
    ]);
    session_start();
}

function seller_db(): PDO
{
    static $connection = null;
    if ($connection instanceof PDO) {
        return $connection;
    }

    $host = 'localhost';
    $database = 'techecommercedb';
    $username = 'root';
    $password = '';
    $connection = new PDO(
        "mysql:host=$host;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    return $connection;
}

function seller_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function seller_body(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        seller_json(['status' => 'error', 'message' => 'Request JSON không hợp lệ.'], 400);
    }
    return $body;
}

function require_seller(): array
{
    if (empty($_SESSION['seller_user_id'])) {
        seller_json(['status' => 'error', 'message' => 'Vui lòng đăng nhập tài khoản người bán.'], 401);
    }
    return [
        'id' => (int) $_SESSION['seller_user_id'],
        'role' => (string) ($_SESSION['seller_role'] ?? ''),
    ];
}

function seller_public_user(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => $user['full_name'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'status' => $user['status'],
        'shopName' => $user['shop_name'] ?? null,
        'createdAt' => $user['created_at'],
    ];
}

function require_postive_int(mixed $value, string $field): int
{
    $validated = filter_var($value, FILTER_VALIDATE_INT);
    if ($validated === false || $validated < 1) {
        seller_json(['status' => 'error', 'message' => "$field phải là số nguyên dương."], 422);
    }
    return $validated;
}

set_exception_handler(static function (Throwable $error): void {
    error_log($error->__toString());
    seller_json(['status' => 'error', 'message' => 'Lỗi máy chủ. Kiểm tra cấu hình database và migration Seller.'], 500);
});
