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

$productId = require_positive_int($_GET['productId'] ?? null, 'ID sản phẩm');
$owner = $pdo->prepare('SELECT id FROM products WHERE id = :id AND seller_id = :seller_id');
$owner->execute(['id' => $productId, 'seller_id' => $sellerId]);

if (!$owner->fetch()) {
    json_error('Không tìm thấy sản phẩm thuộc gian hàng của bạn.', 404);
}

$body = get_json_body();
$sku = trim((string) ($body['sku'] ?? ''));
$price = filter_var($body['price'] ?? null, FILTER_VALIDATE_FLOAT);
$comparePriceRaw = $body['comparePrice'] ?? null;
$comparePrice = ($comparePriceRaw === '' || $comparePriceRaw === null) ? null : filter_var($comparePriceRaw, FILTER_VALIDATE_FLOAT);
$stock = filter_var($body['stock'] ?? null, FILTER_VALIDATE_INT);
$image = trim((string) ($body['image'] ?? ''));
$variantAttr = trim((string) ($body['variantAttr'] ?? 'Tiêu chuẩn'));

if ($sku === '' || $price === false || $price <= 0 || $stock === false || $stock < 0) {
    json_error('Thông tin biến thể, SKU, giá bán hoặc tồn kho không hợp lệ.', 422);
}

try {
    $pdo->beginTransaction();
    $pdo->prepare(
        'UPDATE products SET status = "pending_review"
         WHERE id = :product_id AND seller_id = :seller_id'
    )->execute(['product_id' => $productId, 'seller_id' => $sellerId]);
    $stmt = $pdo->prepare(
        'INSERT INTO product_variants (product_id, sku, price, compare_at_price, stock_quantity, attributes, image)
         VALUES (:product_id, :sku, :price, :compare_price, :stock, :attributes, :image)'
    );
    $stmt->execute([
        'product_id' => $productId,
        'sku' => $sku,
        'price' => $price,
        'compare_price' => $comparePrice,
        'stock' => $stock,
        'attributes' => json_encode(['Phiên bản' => $variantAttr], JSON_UNESCAPED_UNICODE),
        'image' => $image,
    ]);
    $variantId = (int) $pdo->lastInsertId();

    $pdo->prepare(
        'INSERT INTO inventory_logs (variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by)
         VALUES (:variant_id, "import", :quantity_changed, 0, :new_stock, :reference_id, :created_by)'
    )->execute([
        'variant_id' => $variantId,
        'quantity_changed' => $stock,
        'new_stock' => $stock,
        'reference_id' => 'PRODUCT-' . $productId,
        'created_by' => $sellerId,
    ]);

    $pdo->commit();
    json_success(['id' => $variantId, 'productId' => $productId], 'Đã thêm biến thể mới.', 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($e instanceof PDOException && (string)$e->getCode() === '23000' && str_contains(strtolower($e->getMessage()), 'sku')) {
        json_error('Mã SKU "' . $sku . '" đã tồn tại trong hệ thống. Vui lòng nhập mã SKU khác.', 409);
    }
    json_error('Lỗi khi thêm biến thể: ' . $e->getMessage(), 500);
}
