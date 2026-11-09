<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOriginsStr = $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost:3000,http://127.0.0.1:3000';
$allowedOrigins = array_map('trim', explode(',', $allowedOriginsStr));

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
} else {
    // Cho phép gọi dạng public nếu không dùng credentials
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
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
