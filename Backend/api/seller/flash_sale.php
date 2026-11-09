<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$seller = require_seller();
$sellerId = $seller['id'];
$pdo = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Phương thức yêu cầu không hợp lệ.', 405);
}

$body = get_json_body();
$productId = require_positive_int($body['productId'] ?? null, 'ID sản phẩm');

$owner = $pdo->prepare(
    'SELECT v.id AS variant_id, v.price, v.stock_quantity FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE p.id = :product_id AND p.seller_id = :seller_id ORDER BY v.id ASC LIMIT 1'
);
$owner->execute(['product_id' => $productId, 'seller_id' => $sellerId]);
$variant = $owner->fetch();

if (!$variant) {
    json_error('Không tìm thấy sản phẩm thuộc gian hàng của bạn.', 404);
}

$variantId = (int) $variant['variant_id'];
$pdo->beginTransaction();

$pdo->prepare('DELETE fsi FROM flash_sale_items fsi JOIN flash_sales fs ON fs.id = fsi.flash_sale_id WHERE fsi.variant_id = :variant_id')
    ->execute(['variant_id' => $variantId]);

if (!empty($body['enabled'])) {
    $start = strtotime((string) ($body['startTime'] ?? ''));
    $end = strtotime((string) ($body['endTime'] ?? ''));
    $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_FLOAT);
    $limit = filter_var($body['stockLimit'] ?? null, FILTER_VALIDATE_INT);

    if (!$start || !$end || $end <= $start || $price === false || $price <= 0
        || $price >= (float) $variant['price'] || $limit === false || $limit < 1
        || $limit > (int) $variant['stock_quantity']) {
        $pdo->rollBack();
        json_error('Giá Flash Sale phải thấp hơn giá niêm yết, số lượng phải trong kho và khung giờ phải hợp lệ.', 422);
    }

    $sale = $pdo->prepare(
        'INSERT INTO flash_sales (title, start_time, end_time, status) VALUES (:title, :start_time, :end_time, "upcoming")'
    );
    $sale->execute([
        'title' => trim((string) ($body['title'] ?? 'Flash Sale')),
        'start_time' => date('Y-m-d H:i:s', $start),
        'end_time' => date('Y-m-d H:i:s', $end),
    ]);
    $saleId = (int) $pdo->lastInsertId();

    $pdo->prepare(
        'INSERT INTO flash_sale_items (flash_sale_id, variant_id, flash_sale_price, stock_limit, sold_count)
         VALUES (:sale_id, :variant_id, :price, :stock_limit, 0)'
    )->execute([
        'sale_id' => $saleId,
        'variant_id' => $variantId,
        'price' => $price,
        'stock_limit' => $limit,
    ]);
}

$pdo->commit();
json_success(null, 'Cập nhật cấu hình Flash Sale thành công.');
