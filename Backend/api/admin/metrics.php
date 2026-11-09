<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

require_admin();
$pdo = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Phương thức yêu cầu không hợp lệ.', 405);
}

$stmt = $pdo->prepare('
    SELECT 
        (SELECT COUNT(*) FROM users WHERE role = "customer") AS total_customers,
        (SELECT COUNT(*) FROM users WHERE role IN ("staff", "seller")) AS total_sellers,
        (SELECT COUNT(*) FROM products WHERE status = "published") AS total_products,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE order_status = "delivered") AS total_gmv,
        (SELECT COUNT(*) FROM orders WHERE order_status = "pending") AS pending_orders
');
$stmt->execute();
$metrics = $stmt->fetch() ?: [];

foreach ($metrics as $k => $v) {
    $metrics[$k] = (float) $v;
}

json_success($metrics);
