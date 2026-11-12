<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Phương thức yêu cầu không hợp lệ.', 405);
}

$period = (string) ($_GET['period'] ?? 'month');
if (!in_array($period, ['day', 'week', 'month', 'year'], true)) {
    json_error('Kỳ báo cáo không hợp lệ.', 422);
}

$dateInput = (string) ($_GET['date'] ?? date('Y-m-d'));
$date = DateTimeImmutable::createFromFormat('!Y-m-d', $dateInput);
if (!$date || $date->format('Y-m-d') !== $dateInput) {
    json_error('Ngày báo cáo không hợp lệ.', 422);
}

$start = match ($period) {
    'day' => $date,
    'week' => $date->modify('monday this week'),
    'month' => $date->modify('first day of this month')->setTime(0, 0),
    'year' => $date->setDate((int) $date->format('Y'), 1, 1),
};
$end = match ($period) {
    'day' => $start->modify('+1 day'),
    'week' => $start->modify('+1 week'),
    'month' => $start->modify('+1 month'),
    'year' => $start->modify('+1 year'),
};

$pdo = get_db_connection();
$range = ['start' => $start->format('Y-m-d H:i:s'), 'end' => $end->format('Y-m-d H:i:s')];

$summaryStmt = $pdo->prepare(
    'SELECT COUNT(*) AS order_count,
            COALESCE(SUM(CASE
              WHEN o.order_status = "delivered"
                OR (COALESCE(line_summary.item_count, 0) > 0 AND line_summary.delivered_items = line_summary.item_count)
              THEN 1 ELSE 0 END), 0) AS delivered_count,
            COALESCE(SUM(CASE
              WHEN o.order_status = "cancelled"
                OR (COALESCE(line_summary.item_count, 0) > 0 AND line_summary.cancelled_items = line_summary.item_count)
              THEN 1 ELSE 0 END), 0) AS cancelled_count,
            COALESCE(SUM(CASE
              WHEN COALESCE(line_summary.item_count, 0) > 0 THEN line_summary.gmv
              WHEN o.order_status <> "cancelled" THEN o.total_amount ELSE 0 END), 0) AS gmv,
            COALESCE(SUM(CASE
              WHEN COALESCE(line_summary.item_count, 0) > 0 THEN line_summary.delivered_revenue
              WHEN o.order_status = "delivered" THEN o.total_amount ELSE 0 END), 0) AS delivered_revenue
     FROM orders o
     LEFT JOIN (
       SELECT oi.order_id, COUNT(*) AS item_count,
              SUM(CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                 ELSE COALESCE(sos.status, o.order_status) END <> "cancelled"
                       THEN oi.total_price ELSE 0 END) AS gmv,
              SUM(CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                 ELSE COALESCE(sos.status, o.order_status) END = "delivered"
                       THEN oi.total_price ELSE 0 END) AS delivered_revenue,
              SUM(CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                 ELSE COALESCE(sos.status, o.order_status) END = "delivered" THEN 1 ELSE 0 END) AS delivered_items,
              SUM(CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                 ELSE COALESCE(sos.status, o.order_status) END = "cancelled" THEN 1 ELSE 0 END) AS cancelled_items
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = oi.seller_id
       WHERE o.created_at >= :lines_start AND o.created_at < :lines_end
       GROUP BY oi.order_id
     ) line_summary ON line_summary.order_id = o.id
     WHERE o.created_at >= :start AND o.created_at < :end'
);
$summaryStmt->execute([
    'lines_start' => $range['start'],
    'lines_end' => $range['end'],
    'start' => $range['start'],
    'end' => $range['end'],
]);
$summary = $summaryStmt->fetch() ?: [];

$countsStmt = $pdo->query(
    'SELECT
       (SELECT COUNT(*) FROM users WHERE role = "customer") AS total_customers,
       (SELECT COUNT(*) FROM users WHERE role IN ("staff", "seller") AND status = "active") AS active_sellers,
       (SELECT COUNT(*) FROM users WHERE role IN ("staff", "seller") AND status = "inactive") AS pending_sellers,
       (SELECT COUNT(*) FROM products WHERE status = "published") AS published_products,
       (SELECT COUNT(*) FROM products WHERE status = "pending_review") AS pending_products'
);
$counts = $countsStmt->fetch() ?: [];

$shopStmt = $pdo->prepare(
    'SELECT u.id AS seller_id, u.shop_name, u.full_name AS owner_name,
            COALESCE(s.shop_gmv, 0) AS gmv,
            COALESCE(s.delivered_revenue, 0) AS delivered_revenue,
            COALESCE(s.order_count, 0) AS order_count,
            COALESCE(s.delivered_count, 0) AS delivered_count,
            COALESCE(s.cancelled_count, 0) AS cancelled_count
     FROM users u
     LEFT JOIN (
       SELECT oi.seller_id,
              SUM(CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                 ELSE COALESCE(sos.status, o.order_status) END <> "cancelled"
                       THEN oi.total_price ELSE 0 END) AS shop_gmv,
              SUM(CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                 ELSE COALESCE(sos.status, o.order_status) END = "delivered"
                       THEN oi.total_price ELSE 0 END) AS delivered_revenue,
              COUNT(DISTINCT o.id) AS order_count,
              COUNT(DISTINCT CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                            ELSE COALESCE(sos.status, o.order_status) END = "delivered"
                                  THEN o.id END) AS delivered_count,
              COUNT(DISTINCT CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                            ELSE COALESCE(sos.status, o.order_status) END = "cancelled"
                                  THEN o.id END) AS cancelled_count
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = oi.seller_id
       WHERE oi.seller_id IS NOT NULL AND o.created_at >= :start AND o.created_at < :end
       GROUP BY oi.seller_id
     ) s ON s.seller_id = u.id
     WHERE u.role IN ("staff", "seller")
     ORDER BY gmv DESC, u.shop_name ASC'
);
$shopStmt->execute($range);

$recentStmt = $pdo->prepare(
    'SELECT o.id, o.order_code, o.final_amount,
            CASE
              WHEN o.order_status = "cancelled" THEN "cancelled"
              WHEN COALESCE(line_summary.item_count, 0) > 0 AND line_summary.delivered_items = line_summary.item_count THEN "delivered"
              WHEN COALESCE(line_summary.item_count, 0) > 0 AND line_summary.cancelled_items = line_summary.item_count THEN "cancelled"
              ELSE o.order_status
            END AS order_status,
            o.created_at,
            customer.full_name AS customer_name,
            GROUP_CONCAT(DISTINCT COALESCE(seller.shop_name, seller.full_name)
                         ORDER BY seller.shop_name SEPARATOR ", ") AS shops
     FROM orders o
     LEFT JOIN (
       SELECT oi.order_id, COUNT(*) AS item_count,
              SUM(CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                 ELSE COALESCE(sos.status, o.order_status) END = "delivered" THEN 1 ELSE 0 END) AS delivered_items,
              SUM(CASE WHEN CASE WHEN o.order_status = "cancelled" THEN "cancelled"
                                 ELSE COALESCE(sos.status, o.order_status) END = "cancelled" THEN 1 ELSE 0 END) AS cancelled_items
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = oi.seller_id
       WHERE o.created_at >= :lines_start AND o.created_at < :lines_end
       GROUP BY oi.order_id
     ) line_summary ON line_summary.order_id = o.id
     JOIN users customer ON customer.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN users seller ON seller.id = oi.seller_id
     WHERE o.created_at >= :start AND o.created_at < :end
     GROUP BY o.id, o.order_code, o.final_amount, o.order_status, o.created_at, customer.full_name,
              line_summary.item_count, line_summary.delivered_items, line_summary.cancelled_items
     ORDER BY o.created_at DESC
     LIMIT 10'
);
$recentStmt->execute([
    'lines_start' => $range['start'],
    'lines_end' => $range['end'],
    'start' => $range['start'],
    'end' => $range['end'],
]);

$summary = array_map(static fn(mixed $value): float => (float) $value, $summary);
$counts = array_map(static fn(mixed $value): float => (float) $value, $counts);
$shops = array_map(static function (array $shop): array {
    foreach (['seller_id', 'gmv', 'delivered_revenue', 'order_count', 'delivered_count', 'cancelled_count'] as $key) {
        $shop[$key] = (float) $shop[$key];
    }
    return $shop;
}, $shopStmt->fetchAll());
$recentOrders = array_map(static function (array $order): array {
    $order['id'] = (int) $order['id'];
    $order['final_amount'] = (float) $order['final_amount'];
    return $order;
}, $recentStmt->fetchAll());

json_success([
    'period' => $period,
    'date' => $dateInput,
    'start' => $range['start'],
    'end' => $range['end'],
    'end_inclusive' => $end->modify('-1 day')->format('Y-m-d'),
    'summary' => $summary,
    'counts' => $counts,
    'shops' => $shops,
    'recent_orders' => $recentOrders,
]);
