<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$customer = require_customer();
$userId = $customer['id'];
$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$body = get_json_body();

function get_customer_cart_id(PDO $pdo, int $userId, bool $create = false): ?int
{
    if (!$create) {
        $stmt = $pdo->prepare('SELECT id FROM carts WHERE user_id = :user_id LIMIT 1');
        $stmt->execute(['user_id' => $userId]);
        $cartId = $stmt->fetchColumn();
        return $cartId === false ? null : (int) $cartId;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO carts (user_id) VALUES (:user_id)
         ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)'
    );
    $stmt->execute(['user_id' => $userId]);
    return (int) $pdo->lastInsertId();
}

function get_customer_cart_items(PDO $pdo, int $cartId): array
{
    $stmt = $pdo->prepare(
        'SELECT ci.id, ci.cart_id, ci.variant_id, ci.quantity,
                v.sku, v.price, v.compare_at_price, v.stock_quantity, v.attributes, v.image,
                p.id AS product_id, p.seller_id, p.name AS product_name, p.slug, p.brand_id,
                p.category_id, p.description, p.specifications, p.status AS product_status,
                seller.shop_name
         FROM cart_items ci
         JOIN product_variants v ON v.id = ci.variant_id
         JOIN products p ON p.id = v.product_id
         LEFT JOIN users seller ON seller.id = p.seller_id
         WHERE ci.cart_id = :cart_id
         ORDER BY ci.id'
    );
    $stmt->execute(['cart_id' => $cartId]);

    return array_map(static function (array $row): array {
        $attributes = json_decode((string) $row['attributes'], true);
        $specifications = json_decode((string) $row['specifications'], true);
        $variant = [
            'id' => (int) $row['variant_id'],
            'productId' => (int) $row['product_id'],
            'sku' => (string) $row['sku'],
            'price' => (float) $row['price'],
            'compareAtPrice' => $row['compare_at_price'] === null ? null : (float) $row['compare_at_price'],
            'stockQuantity' => (int) $row['stock_quantity'],
            'attributes' => is_array($attributes) ? $attributes : [],
            'image' => (string) ($row['image'] ?? ''),
        ];

        return [
            'id' => (int) $row['id'],
            'cartId' => (int) $row['cart_id'],
            'variantId' => (int) $row['variant_id'],
            'quantity' => (int) $row['quantity'],
            'variant' => $variant,
            'product' => [
                'id' => (int) $row['product_id'],
                'sellerId' => $row['seller_id'] === null ? null : (int) $row['seller_id'],
                'shopName' => $row['shop_name'],
                'name' => (string) $row['product_name'],
                'slug' => (string) $row['slug'],
                'brandId' => (int) $row['brand_id'],
                'categoryId' => (int) $row['category_id'],
                'description' => (string) ($row['description'] ?? ''),
                'specifications' => is_array($specifications) ? $specifications : [],
                'status' => (string) $row['product_status'],
                'variants' => [$variant],
            ],
        ];
    }, $stmt->fetchAll());
}

if ($method === 'GET' && $action === 'list') {
    $cartId = get_customer_cart_id($pdo, $userId);
    json_success($cartId === null ? [] : get_customer_cart_items($pdo, $cartId));
}

if ($method === 'POST' && $action === 'add') {
    $variantId = require_positive_int($body['variantId'] ?? null, 'Mã biến thể');
    $quantity = require_positive_int($body['quantity'] ?? 1, 'Số lượng');
    $pdo->beginTransaction();

    $variantStmt = $pdo->prepare(
        'SELECT v.stock_quantity, p.status
         FROM product_variants v JOIN products p ON p.id = v.product_id
         WHERE v.id = :variant_id FOR UPDATE'
    );
    $variantStmt->execute(['variant_id' => $variantId]);
    $variant = $variantStmt->fetch();
    if (!$variant || $variant['status'] !== 'published') {
        $pdo->rollBack();
        json_error('Sản phẩm không còn khả dụng.', 404);
    }
    if ((int) $variant['stock_quantity'] < 1) {
        $pdo->rollBack();
        json_error('Sản phẩm đã hết hàng.', 409);
    }

    $cartId = get_customer_cart_id($pdo, $userId, true);
    $itemStmt = $pdo->prepare(
        'SELECT id, quantity FROM cart_items
         WHERE cart_id = :cart_id AND variant_id = :variant_id
         ORDER BY id FOR UPDATE'
    );
    $itemStmt->execute(['cart_id' => $cartId, 'variant_id' => $variantId]);
    $existingItems = $itemStmt->fetchAll();
    $existingQuantity = array_sum(array_map(
        static fn(array $item): int => (int) $item['quantity'],
        $existingItems
    ));
    $updatedQuantity = min(
        (int) $variant['stock_quantity'],
        $quantity + $existingQuantity
    );

    if ($existingItems !== []) {
        $existing = array_shift($existingItems);
        $pdo->prepare('UPDATE cart_items SET quantity = :quantity WHERE id = :id')
            ->execute(['quantity' => $updatedQuantity, 'id' => (int) $existing['id']]);
        if ($existingItems !== []) {
            $deleteDuplicate = $pdo->prepare('DELETE FROM cart_items WHERE id = :id');
            foreach ($existingItems as $duplicate) {
                $deleteDuplicate->execute(['id' => (int) $duplicate['id']]);
            }
        }
    } else {
        $pdo->prepare(
            'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (:cart_id, :variant_id, :quantity)'
        )->execute(['cart_id' => $cartId, 'variant_id' => $variantId, 'quantity' => $updatedQuantity]);
    }

    $pdo->commit();
    json_success(get_customer_cart_items($pdo, $cartId));
}

if ($method === 'PUT' && $action === 'quantity') {
    $variantId = require_positive_int($body['variantId'] ?? null, 'Mã biến thể');
    $quantity = require_positive_int($body['quantity'] ?? null, 'Số lượng');
    $cartId = get_customer_cart_id($pdo, $userId);
    if ($cartId === null) {
        json_error('Sản phẩm không có trong giỏ hàng.', 404);
    }

    $pdo->beginTransaction();
    $stockStmt = $pdo->prepare('SELECT stock_quantity FROM product_variants WHERE id = :variant_id FOR UPDATE');
    $stockStmt->execute(['variant_id' => $variantId]);
    $stock = $stockStmt->fetchColumn();
    if ($stock === false) {
        $pdo->rollBack();
        json_error('Sản phẩm không còn khả dụng.', 404);
    }
    if ($quantity > (int) $stock) {
        $pdo->rollBack();
        json_error('Số lượng vượt quá tồn kho hiện tại.', 409);
    }

    $itemsStmt = $pdo->prepare(
        'SELECT id FROM cart_items WHERE cart_id = :cart_id AND variant_id = :variant_id ORDER BY id FOR UPDATE'
    );
    $itemsStmt->execute(['cart_id' => $cartId, 'variant_id' => $variantId]);
    $items = $itemsStmt->fetchAll();
    if ($items === []) {
        $pdo->rollBack();
        json_error('Sản phẩm không có trong giỏ hàng.', 404);
    }

    $firstItem = array_shift($items);
    $pdo->prepare('UPDATE cart_items SET quantity = :quantity WHERE id = :id')
        ->execute(['quantity' => $quantity, 'id' => (int) $firstItem['id']]);
    if ($items !== []) {
        $deleteDuplicate = $pdo->prepare('DELETE FROM cart_items WHERE id = :id');
        foreach ($items as $duplicate) {
            $deleteDuplicate->execute(['id' => (int) $duplicate['id']]);
        }
    }
    $pdo->commit();
    json_success(get_customer_cart_items($pdo, $cartId));
}

if ($method === 'DELETE' && $action === 'remove') {
    $variantId = require_positive_int($_GET['variantId'] ?? null, 'Mã biến thể');
    $cartId = get_customer_cart_id($pdo, $userId);
    if ($cartId !== null) {
        $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cart_id AND variant_id = :variant_id')
            ->execute(['cart_id' => $cartId, 'variant_id' => $variantId]);
    }
    json_success($cartId === null ? [] : get_customer_cart_items($pdo, $cartId));
}

if ($method === 'DELETE' && $action === 'clear') {
    $cartId = get_customer_cart_id($pdo, $userId);
    if ($cartId !== null) {
        $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cart_id')->execute(['cart_id' => $cartId]);
    }
    json_success([]);
}

json_error('Hành động giỏ hàng không hợp lệ.', 404);
