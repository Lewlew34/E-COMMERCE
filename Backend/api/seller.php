<?php
require_once __DIR__ . '/_seller_common.php';

$seller = require_seller();
$pdo = seller_db();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

function seller_product_rows(PDO $pdo, int $sellerId): array
{
    $stmt = $pdo->prepare(
        'SELECT p.id, p.name, p.slug, p.brand_id AS brandId, p.category_id AS categoryId,
                p.description, p.specifications, p.status,
                b.name AS brandName, b.slug AS brandSlug, b.logo AS brandLogo,
                c.name AS categoryName, c.slug AS categorySlug,
                v.id AS variantId, v.sku, v.price, v.compare_at_price AS compareAtPrice,
                v.stock_quantity AS stockQuantity, v.attributes, v.image,
                fs.start_time AS flashSaleStart, fs.end_time AS flashSaleEnd,
                fsi.flash_sale_price AS flashSalePrice, fsi.stock_limit AS flashSaleStockLimit
         FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN product_variants v ON v.product_id = p.id
         LEFT JOIN flash_sale_items fsi ON fsi.variant_id = v.id
         LEFT JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
         WHERE p.seller_id = :seller_id AND p.status <> "archived"
         ORDER BY p.id DESC, v.id ASC'
    );
    $stmt->execute(['seller_id' => $sellerId]);
    $products = [];
    while ($row = $stmt->fetch()) {
        $id = (int) $row['id'];
        if (!isset($products[$id])) {
            $specifications = json_decode((string) $row['specifications'], true);
            $products[$id] = [
                'id' => $id,
                'name' => $row['name'],
                'slug' => $row['slug'],
                'brandId' => (int) $row['brandId'],
                'categoryId' => (int) $row['categoryId'],
                'description' => $row['description'] ?? '',
                'status' => $row['status'],
                'brand' => [
                    'id' => (int) $row['brandId'],
                    'name' => $row['brandName'] ?? '',
                    'slug' => $row['brandSlug'] ?? '',
                    'logo' => $row['brandLogo'] ?? '',
                ],
                'category' => [
                    'id' => (int) $row['categoryId'],
                    'name' => $row['categoryName'] ?? '',
                    'slug' => $row['categorySlug'] ?? '',
                ],
                'specifications' => is_array($specifications) ? $specifications : [],
                'variants' => [],
                'isFlashSale' => false,
            ];
        }
        if ($row['variantId'] !== null) {
            $attributes = json_decode((string) $row['attributes'], true);
            $products[$id]['variants'][] = [
                'id' => (int) $row['variantId'],
                'productId' => $id,
                'sku' => $row['sku'],
                'price' => (float) $row['price'],
                'compareAtPrice' => $row['compareAtPrice'] === null ? null : (float) $row['compareAtPrice'],
                'stockQuantity' => (int) $row['stockQuantity'],
                'attributes' => is_array($attributes) ? $attributes : [],
                'image' => $row['image'] ?? '',
            ];
            if ($row['flashSalePrice'] !== null) {
                $products[$id]['isFlashSale'] = true;
                $products[$id]['flashSalePrice'] = (float) $row['flashSalePrice'];
                $products[$id]['flashSaleOriginalPrice'] = (float) $row['price'];
                $products[$id]['flashSaleStartTime'] = $row['flashSaleStart'];
                $products[$id]['flashSaleEndTime'] = $row['flashSaleEnd'];
                $products[$id]['flashSaleDiscountPercent'] = (int) round(
                    (1 - (float) $row['flashSalePrice'] / (float) $row['price']) * 100
                );
            }
        }
    }
    return array_values($products);
}

function validate_product_body(array $body): array
{
    $name = trim((string) ($body['name'] ?? ''));
    $sku = trim((string) ($body['sku'] ?? ''));
    $image = trim((string) ($body['image'] ?? ''));
    $brandId = require_postive_int($body['brandId'] ?? null, 'Thương hiệu');
    $categoryId = require_postive_int($body['categoryId'] ?? null, 'Danh mục');
    $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_FLOAT);
    $stock = filter_var($body['stock'] ?? null, FILTER_VALIDATE_INT);
    $comparePriceRaw = $body['comparePrice'] ?? null;
    $comparePrice = $comparePriceRaw === '' || $comparePriceRaw === null
        ? null
        : filter_var($comparePriceRaw, FILTER_VALIDATE_FLOAT);
    if ($name === '' || $sku === '' || $price === false || $price <= 0 || $stock === false || $stock < 0
        || ($comparePriceRaw !== '' && $comparePriceRaw !== null && ($comparePrice === false || $comparePrice <= 0))
        || ($comparePrice !== null && $comparePrice < $price)
        || ($image !== '' && !filter_var($image, FILTER_VALIDATE_URL))) {
        seller_json(['status' => 'error', 'message' => 'Thông tin sản phẩm, SKU, giá, tồn kho hoặc ảnh không hợp lệ.'], 422);
    }
    return [
        'name' => $name,
        'brand_id' => $brandId,
        'category_id' => $categoryId,
        'description' => trim((string) ($body['description'] ?? '')),
        'specifications' => json_encode($body['specifications'] ?? [], JSON_UNESCAPED_UNICODE),
        'sku' => $sku,
        'price' => (float) $price,
        'compare_price' => $comparePrice,
        'stock' => (int) $stock,
        'attributes' => json_encode(['Phiên bản' => trim((string) ($body['variantAttr'] ?? 'Tiêu chuẩn'))], JSON_UNESCAPED_UNICODE),
        'image' => $image,
    ];
}

function slugify_product(string $name): string
{
    $slug = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
    $slug = strtolower(trim((string) preg_replace('/[^a-zA-Z0-9]+/', '-', (string) $slug), '-'));
    return ($slug ?: 'product') . '-' . bin2hex(random_bytes(3));
}

function seller_load_order(PDO $pdo, int $sellerId, int $orderId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT o.id, o.user_id, o.order_code, o.total_amount, o.shipping_fee, o.final_amount,
                o.payment_status, o.order_status, o.shipping_address_snapshot, o.created_at, o.updated_at,
                COALESCE(sos.status, o.order_status) AS seller_status,
                u.full_name, u.phone
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = :seller_id
         WHERE o.id = :order_id
           AND EXISTS (SELECT 1 FROM order_items own_items
                       WHERE own_items.order_id = o.id AND own_items.seller_id = :seller_id_items)'
    );
    $stmt->execute([
        'seller_id' => $sellerId,
        'seller_id_items' => $sellerId,
        'order_id' => $orderId,
    ]);
    $order = $stmt->fetch();
    return $order ?: null;
}

if ($action === 'products' && $method === 'GET') {
    seller_json(['status' => 'success', 'data' => seller_product_rows($pdo, $seller['id'])]);
}

if ($action === 'products' && $method === 'POST') {
    $body = validate_product_body(seller_body());
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO products (name, slug, brand_id, category_id, seller_id, description, specifications, status)
         VALUES (:name, :slug, :brand_id, :category_id, :seller_id, :description, :specifications, "published")'
    );
    $stmt->execute([
        'name' => $body['name'],
        'slug' => slugify_product($body['name']),
        'brand_id' => $body['brand_id'],
        'category_id' => $body['category_id'],
        'seller_id' => $seller['id'],
        'description' => $body['description'],
        'specifications' => $body['specifications'],
    ]);
    $productId = (int) $pdo->lastInsertId();
    $variant = $pdo->prepare(
        'INSERT INTO product_variants (product_id, sku, price, compare_at_price, stock_quantity, attributes, image)
         VALUES (:product_id, :sku, :price, :compare_price, :stock, :attributes, :image)'
    );
    $variant->execute([
        'product_id' => $productId,
        'sku' => $body['sku'],
        'price' => $body['price'],
        'compare_price' => $body['compare_price'],
        'stock' => $body['stock'],
        'attributes' => $body['attributes'],
        'image' => $body['image'],
    ]);
    $variantId = (int) $pdo->lastInsertId();
    $pdo->prepare(
        'INSERT INTO inventory_logs (variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by)
         VALUES (:variant_id, "import", :quantity, 0, :quantity, :reference_id, :created_by)'
    )->execute([
        'variant_id' => $variantId,
        'quantity' => $body['stock'],
        'reference_id' => 'PRODUCT-' . $productId,
        'created_by' => $seller['id'],
    ]);
    $pdo->commit();
    seller_json(['status' => 'success', 'data' => seller_product_rows($pdo, $seller['id'])[0] ?? null], 201);
}

if ($action === 'products' && $method === 'PUT') {
    $productId = require_postive_int($_GET['id'] ?? null, 'Sản phẩm');
    $body = validate_product_body(seller_body());
    $pdo->beginTransaction();
    $owner = $pdo->prepare('SELECT id FROM products WHERE id = :id AND seller_id = :seller_id FOR UPDATE');
    $owner->execute(['id' => $productId, 'seller_id' => $seller['id']]);
    if (!$owner->fetch()) {
        $pdo->rollBack();
        seller_json(['status' => 'error', 'message' => 'Không tìm thấy sản phẩm thuộc gian hàng của bạn.'], 404);
    }
    $update = $pdo->prepare(
        'UPDATE products SET name = :name, brand_id = :brand_id, category_id = :category_id,
         description = :description, specifications = :specifications WHERE id = :id AND seller_id = :seller_id'
    );
    $update->execute([
        'name' => $body['name'],
        'brand_id' => $body['brand_id'],
        'category_id' => $body['category_id'],
        'description' => $body['description'],
        'specifications' => $body['specifications'],
        'id' => $productId,
        'seller_id' => $seller['id'],
    ]);
    $variantStmt = $pdo->prepare(
        'SELECT id, stock_quantity FROM product_variants
         WHERE product_id = :product_id AND id = :variant_id FOR UPDATE'
    );
    $variantStmt->execute([
        'product_id' => $productId,
        'variant_id' => require_postive_int($body['variantId'] ?? null, 'Biến thể'),
    ]);
    $variant = $variantStmt->fetch();
    if (!$variant) {
        $pdo->rollBack();
        seller_json(['status' => 'error', 'message' => 'Sản phẩm chưa có biến thể để cập nhật.'], 409);
    }
    $updateVariant = $pdo->prepare(
        'UPDATE product_variants SET sku = :sku, price = :price, compare_at_price = :compare_price,
         stock_quantity = :stock, attributes = :attributes, image = :image WHERE id = :id'
    );
    $updateVariant->execute([
        'sku' => $body['sku'],
        'price' => $body['price'],
        'compare_price' => $body['compare_price'],
        'stock' => $body['stock'],
        'attributes' => $body['attributes'],
        'image' => $body['image'],
        'id' => (int) $variant['id'],
    ]);
    if ((int) $variant['stock_quantity'] !== $body['stock']) {
        $pdo->prepare(
            'INSERT INTO inventory_logs (variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by)
             VALUES (:variant_id, "manual_adjust", :quantity, :previous_stock, :new_stock, :reference_id, :created_by)'
        )->execute([
            'variant_id' => (int) $variant['id'],
            'quantity' => $body['stock'] - (int) $variant['stock_quantity'],
            'previous_stock' => (int) $variant['stock_quantity'],
            'new_stock' => $body['stock'],
            'reference_id' => 'PRODUCT-' . $productId,
            'created_by' => $seller['id'],
        ]);
    }
    $pdo->commit();
    $product = array_values(array_filter(
        seller_product_rows($pdo, $seller['id']),
        static fn(array $item): bool => $item['id'] === $productId
    ))[0] ?? null;
    seller_json(['status' => 'success', 'data' => $product]);
}

if ($action === 'variants' && $method === 'POST') {
    $body = validate_product_body(seller_body());
    $productId = require_postive_int($_GET['productId'] ?? null, 'Sản phẩm');
    $owner = $pdo->prepare('SELECT id FROM products WHERE id = :id AND seller_id = :seller_id');
    $owner->execute(['id' => $productId, 'seller_id' => $seller['id']]);
    if (!$owner->fetch()) {
        seller_json(['status' => 'error', 'message' => 'Không tìm thấy sản phẩm thuộc gian hàng của bạn.'], 404);
    }

    $pdo->beginTransaction();
    $variant = $pdo->prepare(
        'INSERT INTO product_variants (product_id, sku, price, compare_at_price, stock_quantity, attributes, image)
         VALUES (:product_id, :sku, :price, :compare_price, :stock, :attributes, :image)'
    );
    $variant->execute([
        'product_id' => $productId,
        'sku' => $body['sku'],
        'price' => $body['price'],
        'compare_price' => $body['compare_price'],
        'stock' => $body['stock'],
        'attributes' => $body['attributes'],
        'image' => $body['image'],
    ]);
    $variantId = (int) $pdo->lastInsertId();
    $pdo->prepare(
        'INSERT INTO inventory_logs (variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by)
         VALUES (:variant_id, "import", :quantity, 0, :quantity, :reference_id, :created_by)'
    )->execute([
        'variant_id' => $variantId,
        'quantity' => $body['stock'],
        'reference_id' => 'PRODUCT-' . $productId,
        'created_by' => $seller['id'],
    ]);
    $pdo->commit();
    $product = array_values(array_filter(
        seller_product_rows($pdo, $seller['id']),
        static fn(array $item): bool => $item['id'] === $productId
    ))[0] ?? null;
    seller_json(['status' => 'success', 'data' => $product], 201);
}

if ($action === 'products' && $method === 'DELETE') {
    $productId = require_postive_int($_GET['id'] ?? null, 'Sản phẩm');
    $stmt = $pdo->prepare('UPDATE products SET status = "archived" WHERE id = :id AND seller_id = :seller_id');
    $stmt->execute(['id' => $productId, 'seller_id' => $seller['id']]);
    if ($stmt->rowCount() === 0) {
        seller_json(['status' => 'error', 'message' => 'Không tìm thấy sản phẩm thuộc gian hàng của bạn.'], 404);
    }
    seller_json(['status' => 'success']);
}

if ($action === 'flash-sale' && $method === 'POST') {
    $body = seller_body();
    $productId = require_postive_int($body['productId'] ?? null, 'Sản phẩm');
    $owner = $pdo->prepare(
        'SELECT v.id AS variant_id, v.price, v.stock_quantity FROM product_variants v
         JOIN products p ON p.id = v.product_id
         WHERE p.id = :product_id AND p.seller_id = :seller_id ORDER BY v.id ASC LIMIT 1'
    );
    $owner->execute(['product_id' => $productId, 'seller_id' => $seller['id']]);
    $variant = $owner->fetch();
    if (!$variant) {
        seller_json(['status' => 'error', 'message' => 'Không tìm thấy sản phẩm thuộc gian hàng của bạn.'], 404);
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
            seller_json(['status' => 'error', 'message' => 'Giá Flash Sale phải thấp hơn giá bán; số lượng phải trong tồn kho; thời gian hợp lệ.'], 422);
        }
        $sale = $pdo->prepare(
            'INSERT INTO flash_sales (title, start_time, end_time, status) VALUES (:title, :start_time, :end_time, "upcoming")'
        );
        $sale->execute([
            'title' => trim((string) ($body['title'] ?? 'Flash Sale')),
            'start_time' => date('Y-m-d H:i:s', $start),
            'end_time' => date('Y-m-d H:i:s', $end),
        ]);
        $pdo->prepare(
            'INSERT INTO flash_sale_items (flash_sale_id, variant_id, flash_sale_price, stock_limit, sold_count)
             VALUES (:sale_id, :variant_id, :price, :stock_limit, 0)'
        )->execute([
            'sale_id' => (int) $pdo->lastInsertId(),
            'variant_id' => $variantId,
            'price' => $price,
            'stock_limit' => $limit,
        ]);
    }
    $pdo->commit();
    seller_json(['status' => 'success']);
}

if ($action === 'orders' && $method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT o.id, o.user_id, o.order_code, o.total_amount, o.shipping_fee, o.final_amount,
                o.payment_status, o.order_status, o.shipping_address_snapshot, o.created_at, o.updated_at,
                COALESCE(sos.status, o.order_status) AS seller_status,
                sos.tracking_number,
                u.full_name, u.phone,
               (SELECT SUM(oi.total_price) FROM order_items oi
                WHERE oi.order_id = o.id AND oi.seller_id = :seller_id_total) AS seller_total,
               pay.payment_method
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = :seller_id
         LEFT JOIN (SELECT order_id, MAX(payment_method) AS payment_method FROM payments GROUP BY order_id) pay
           ON pay.order_id = o.id
         WHERE EXISTS (SELECT 1 FROM order_items own_items
                       WHERE own_items.order_id = o.id AND own_items.seller_id = :seller_id_orders)
         ORDER BY o.created_at DESC'
    );
    $stmt->execute([
        'seller_id' => $seller['id'],
        'seller_id_total' => $seller['id'],
        'seller_id_orders' => $seller['id'],
    ]);
    $orders = [];
    foreach ($stmt->fetchAll() as $row) {
        $itemsStmt = $pdo->prepare(
            'SELECT oi.id, oi.variant_id, oi.product_name_snapshot, oi.variant_attributes_snapshot,
                    oi.price, oi.quantity, oi.total_price, pv.image
             FROM order_items oi JOIN product_variants pv ON pv.id = oi.variant_id
             WHERE oi.order_id = :order_id AND oi.seller_id = :seller_id'
        );
        $itemsStmt->execute(['order_id' => (int) $row['id'], 'seller_id' => $seller['id']]);
        $address = json_decode((string) $row['shipping_address_snapshot'], true);
        $orders[] = [
            'id' => (int) $row['id'],
            'userId' => (int) $row['user_id'],
            'orderCode' => $row['order_code'],
            'totalAmount' => (float) $row['seller_total'],
            'shippingFee' => (float) $row['shipping_fee'],
            'finalAmount' => (float) $row['seller_total'],
            'paymentStatus' => $row['payment_status'],
            'orderStatus' => $row['seller_status'],
            'sellerTrackingNumber' => $row['tracking_number'],
            'paymentMethod' => $row['payment_method'] ?? 'COD',
            'shippingAddressSnapshot' => is_array($address) ? $address : [
                'recipientName' => $row['full_name'],
                'phone' => $row['phone'] ?? '',
                'addressLine' => (string) $row['shipping_address_snapshot'],
                'city' => '',
            ],
            'items' => array_map(static function (array $item) use ($row): array {
                $attributes = json_decode((string) $item['variant_attributes_snapshot'], true);
                return [
                    'id' => (int) $item['id'],
                    'orderId' => (int) $row['id'],
                    'variantId' => (int) $item['variant_id'],
                    'productNameSnapshot' => $item['product_name_snapshot'],
                    'variantAttributesSnapshot' => is_array($attributes) ? $attributes : [],
                    'price' => (float) $item['price'],
                    'quantity' => (int) $item['quantity'],
                    'totalPrice' => (float) $item['total_price'],
                    'image' => $item['image'] ?? '',
                ];
            }, $itemsStmt->fetchAll()),
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }
    seller_json(['status' => 'success', 'data' => $orders]);
}

if ($action === 'orders' && $method === 'PATCH') {
    $orderId = require_postive_int($_GET['id'] ?? null, 'Đơn hàng');
    $body = seller_body();
    $nextStatus = (string) ($body['status'] ?? '');
    if (!in_array($nextStatus, ['confirmed', 'shipping', 'delivered', 'cancelled'], true)) {
        seller_json(['status' => 'error', 'message' => 'Trạng thái đơn hàng không hợp lệ.'], 422);
    }
    $pdo->beginTransaction();
    $order = seller_load_order($pdo, $seller['id'], $orderId);
    if (!$order) {
        $pdo->rollBack();
        seller_json(['status' => 'error', 'message' => 'Không tìm thấy đơn hàng của gian hàng.'], 404);
    }
    $currentStatus = $order['seller_status'];
    $transitions = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['shipping', 'cancelled'],
        'shipping' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];
    if (!in_array($nextStatus, $transitions[$currentStatus] ?? [], true)) {
        $pdo->rollBack();
        seller_json(['status' => 'error', 'message' => 'Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này.'], 409);
    }
    $pdo->prepare(
        'INSERT INTO seller_order_status (seller_id, order_id, status, tracking_number)
         VALUES (:seller_id, :order_id, :status, :tracking_number)
         ON DUPLICATE KEY UPDATE status = VALUES(status), tracking_number = VALUES(tracking_number)'
    )->execute([
        'seller_id' => $seller['id'],
        'order_id' => $orderId,
        'status' => $nextStatus,
        'tracking_number' => trim((string) ($body['trackingNumber'] ?? '')) ?: null,
    ]);
    if ($nextStatus === 'cancelled') {
        $ownedItems = $pdo->prepare(
            'SELECT oi.variant_id, oi.quantity, v.stock_quantity
             FROM order_items oi JOIN product_variants v ON v.id = oi.variant_id
             WHERE oi.order_id = :order_id AND oi.seller_id = :seller_id FOR UPDATE'
        );
        $ownedItems->execute(['order_id' => $orderId, 'seller_id' => $seller['id']]);
        foreach ($ownedItems->fetchAll() as $item) {
            $previousStock = (int) $item['stock_quantity'];
            $restoredStock = $previousStock + (int) $item['quantity'];
            $pdo->prepare('UPDATE product_variants SET stock_quantity = :stock WHERE id = :variant_id')
                ->execute(['stock' => $restoredStock, 'variant_id' => (int) $item['variant_id']]);
            $pdo->prepare(
                'INSERT INTO inventory_logs (variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by)
                 VALUES (:variant_id, "return", :quantity, :previous_stock, :new_stock, :reference_id, :created_by)'
            )->execute([
                'variant_id' => (int) $item['variant_id'],
                'quantity' => (int) $item['quantity'],
                'previous_stock' => $previousStock,
                'new_stock' => $restoredStock,
                'reference_id' => $order['order_code'],
                'created_by' => $seller['id'],
            ]);
        }
    }
    $pdo->commit();
    seller_json(['status' => 'success']);
}

if (($action === 'dashboard' || $action === 'analytics') && $method === 'GET') {
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
    $summary->bindValue(':seller_id', $seller['id'], PDO::PARAM_INT);
    $summary->bindValue(':seller_id_stock', $seller['id'], PDO::PARAM_INT);
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
    $top->bindValue(':seller_id', $seller['id'], PDO::PARAM_INT);
    $top->bindValue(':seller_id_status', $seller['id'], PDO::PARAM_INT);
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
    seller_json(['status' => 'success', 'data' => $metrics]);
}

seller_json(['status' => 'error', 'message' => 'Hành động không hợp lệ.'], 404);
