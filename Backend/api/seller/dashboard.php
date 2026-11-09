<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$seller = require_seller();
$sellerId = $seller['id'];
$pdo = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Phương thức yêu cầu không hợp lệ.', 405);
}

$days = max(1, min(365, (int) ($_GET['days'] ?? 30)));

$summary = $pdo->prepare(
    'SELECT
       COUNT(DISTINCT p.id) AS product_count,
       (SELECT COALESCE(SUM(stock_variant.stock_quantity), 0)
        FROM products stock_product
        JOIN product_variants stock_variant ON stock_variant.product_id = stock_product.id
        WHERE stock_product.seller_id = :seller_id_stock
          AND stock_product.status = "published") AS stock_count,
       COUNT(DISTINCT CASE WHEN v.stock_quantity <= 5 THEN p.id END) AS low_stock_count,
       COUNT(DISTINCT o.id) AS order_count,
       COUNT(DISTINCT CASE WHEN COALESCE(sos.status, o.order_status) = "pending" THEN o.id END) AS pending_count,
       COUNT(DISTINCT CASE WHEN COALESCE(sos.status, o.order_status) = "confirmed" THEN o.id END) AS confirmed_count,
       COUNT(DISTINCT CASE WHEN COALESCE(sos.status, o.order_status) = "shipping" THEN o.id END) AS shipping_count,
       COUNT(DISTINCT CASE WHEN COALESCE(sos.status, o.order_status) = "delivered" THEN o.id END) AS delivered_count,
       COALESCE(SUM(CASE WHEN COALESCE(sos.status, o.order_status) = "delivered"
           AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ' . $days . ' DAY) THEN oi.total_price ELSE 0 END), 0) AS revenue
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id
     LEFT JOIN order_items oi ON oi.seller_id = p.seller_id AND oi.variant_id = v.id
     LEFT JOIN orders o ON o.id = oi.order_id AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ' . $days . ' DAY)
     LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = p.seller_id
     WHERE p.seller_id = :seller_id AND p.status = "published"'
);
$summary->bindValue(':seller_id', $sellerId, PDO::PARAM_INT);
$summary->bindValue(':seller_id_stock', $sellerId, PDO::PARAM_INT);
$summary->execute();
$metrics = $summary->fetch() ?: [];

$top = $pdo->prepare(
    'SELECT p.id, p.name, v.sku, SUM(oi.quantity) AS sold_count,
            SUM(oi.total_price) AS revenue, v.stock_quantity
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN product_variants v ON v.id = oi.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE oi.seller_id = :seller_id AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ' . $days . ' DAY)
       AND COALESCE((SELECT sos.status FROM seller_order_status sos
         WHERE sos.order_id = o.id AND sos.seller_id = :seller_id_status LIMIT 1), o.order_status) = "delivered"
     GROUP BY p.id, p.name, v.sku, v.stock_quantity
     ORDER BY revenue DESC LIMIT 10'
);
$top->bindValue(':seller_id', $sellerId, PDO::PARAM_INT);
$top->bindValue(':seller_id_status', $sellerId, PDO::PARAM_INT);
$top->execute();
$metrics['top_products'] = $top->fetchAll();

foreach (['product_count', 'stock_count', 'low_stock_count', 'order_count', 'pending_count', 'confirmed_count', 'shipping_count', 'delivered_count', 'revenue'] as $metric) {
    $metrics[$metric] = (float) ($metrics[$metric] ?? 0);
}

foreach ($metrics['top_products'] as &$topProduct) {
    $topProduct['id'] = (int) $topProduct['id'];
    $topProduct['sold_count'] = (int) $topProduct['sold_count'];
    $topProduct['stock_quantity'] = (int) $topProduct['stock_quantity'];
    $topProduct['revenue'] = (float) $topProduct['revenue'];
}
unset($topProduct);

json_success($metrics);
