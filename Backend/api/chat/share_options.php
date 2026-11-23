<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$auth = require_auth();
if ($auth['role'] === 'customer') {
    require_customer();
    $role = 'customer';
} elseif (in_array($auth['role'], ['staff', 'seller'], true)) {
    require_seller();
    $role = 'seller';
} else {
    json_error('Chức năng chia sẻ chỉ dành cho khách hàng và Seller.', 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Phương thức yêu cầu không hợp lệ.', 405);
}

$conversationId = require_positive_int($_GET['conversation_id'] ?? null, 'ID hội thoại');
$pdo = get_db_connection();
$ownerColumn = $role === 'customer' ? 'customer_id' : 'seller_id';
$conversationStmt = $pdo->prepare(
    "SELECT id, customer_id, seller_id FROM chat_conversations
     WHERE id = :conversation_id AND $ownerColumn = :user_id LIMIT 1"
);
$conversationStmt->execute(['conversation_id' => $conversationId, 'user_id' => $auth['id']]);
$conversation = $conversationStmt->fetch();
if (!$conversation) {
    json_error('Không tìm thấy hội thoại hoặc bạn không có quyền truy cập.', 404);
}

$productsStmt = $pdo->prepare(
    'SELECT p.id, p.name, MIN(v.price) AS price, MIN(v.image) AS image
     FROM products p
     JOIN users seller ON seller.id = p.seller_id AND seller.status = "active"
     LEFT JOIN product_variants v ON v.product_id = p.id
     WHERE p.seller_id = :seller_id AND p.status = "published"
     GROUP BY p.id, p.name
     ORDER BY p.name'
);
$productsStmt->execute(['seller_id' => (int) $conversation['seller_id']]);
$products = array_map(static function (array $row): array {
    $row['id'] = (int) $row['id'];
    $row['price'] = $row['price'] === null ? null : (float) $row['price'];
    return $row;
}, $productsStmt->fetchAll());

if ($role === 'customer') {
    $ordersStmt = $pdo->prepare(
        'SELECT o.id, o.order_code, o.order_status, o.created_at, COUNT(DISTINCT oi.id) AS item_count
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = :customer_id AND oi.seller_id = :seller_id
         GROUP BY o.id, o.order_code, o.order_status, o.created_at
         ORDER BY o.created_at DESC'
    );
    $ordersStmt->execute([
        'customer_id' => (int) $conversation['customer_id'],
        'seller_id' => (int) $conversation['seller_id'],
    ]);
} else {
    $ordersStmt = $pdo->prepare(
        'SELECT o.id, o.order_code, COALESCE(sos.status, o.order_status) AS order_status,
                o.created_at, COUNT(DISTINCT oi.id) AS item_count
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id AND oi.seller_id = :seller_item_id
         LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = :seller_status_id
         WHERE o.user_id = :customer_id
         GROUP BY o.id, o.order_code, sos.status, o.order_status, o.created_at
         ORDER BY o.created_at DESC'
    );
    $ordersStmt->execute([
        'seller_item_id' => (int) $conversation['seller_id'],
        'seller_status_id' => (int) $conversation['seller_id'],
        'customer_id' => (int) $conversation['customer_id'],
    ]);
}
$orders = array_map(static function (array $row): array {
    $row['id'] = (int) $row['id'];
    $row['item_count'] = (int) $row['item_count'];
    return $row;
}, $ordersStmt->fetchAll());

json_success(['products' => $products, 'orders' => $orders]);
