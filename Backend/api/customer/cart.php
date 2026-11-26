<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$pdo = get_db_connection();
$customer = require_customer();
$userId = (int) $customer['id'];
$status = $pdo->prepare('SELECT role, status FROM users WHERE id = :id LIMIT 1');
$status->execute(['id' => $userId]);
$user = $status->fetch();
if (!$user || $user['role'] !== 'customer' || $user['status'] !== 'active') {
    json_error('Tài khoản khách hàng hiện không hoạt động.', 403);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? 'list';
$body = get_json_body();

function cart_get_or_create(PDO $pdo, int $userId, bool $lock = false): int
{
    $stmt = $pdo->prepare('SELECT id FROM carts WHERE user_id = :user_id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''));
    $stmt->execute(['user_id' => $userId]);
    $id = $stmt->fetchColumn();
    if ($id !== false) return (int) $id;

    try {
        $insert = $pdo->prepare('INSERT INTO carts (user_id) VALUES (:user_id)');
        $insert->execute(['user_id' => $userId]);
        return (int) $pdo->lastInsertId();
    } catch (PDOException $e) {
        // A concurrent request may have created the user's unique cart.
        $stmt->execute(['user_id' => $userId]);
        $id = $stmt->fetchColumn();
        if ($id !== false) return (int) $id;
        throw $e;
    }
}

function cart_read(PDO $pdo, int $cartId): array
{
    $stmt = $pdo->prepare(
        'SELECT ci.id, ci.cart_id, ci.variant_id, ci.quantity,
                v.product_id, v.sku, v.price, v.compare_at_price, v.stock_quantity,
                v.attributes, v.image, p.name, p.slug, p.brand_id, p.category_id,
                p.seller_id, p.description, p.specifications, p.status,
                b.name AS brand_name, b.slug AS brand_slug, b.logo AS brand_logo,
                c.name AS category_name, c.slug AS category_slug, c.parent_id, c.description AS category_description
         FROM cart_items ci
         JOIN product_variants v ON v.id = ci.variant_id
         JOIN products p ON p.id = v.product_id
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE ci.cart_id = :cart_id ORDER BY ci.id'
    );
    $stmt->execute(['cart_id' => $cartId]);
    $items = [];
    foreach ($stmt->fetchAll() as $row) {
        $attributes = json_decode((string) ($row['attributes'] ?? ''), true);
        $specifications = json_decode((string) ($row['specifications'] ?? ''), true);
        $items[] = [
            'id' => (int) $row['id'], 'cartId' => (int) $row['cart_id'],
            'variantId' => (int) $row['variant_id'], 'quantity' => (int) $row['quantity'],
            'variant' => [
                'id' => (int) $row['variant_id'], 'productId' => (int) $row['product_id'],
                'sku' => (string) $row['sku'], 'price' => (float) $row['price'],
                'compareAtPrice' => $row['compare_at_price'] === null ? null : (float) $row['compare_at_price'],
                'stockQuantity' => (int) $row['stock_quantity'],
                'attributes' => is_array($attributes) ? $attributes : [], 'image' => (string) ($row['image'] ?? ''),
            ],
            'product' => [
                'id' => (int) $row['product_id'], 'sellerId' => $row['seller_id'] === null ? null : (int) $row['seller_id'],
                'name' => (string) $row['name'], 'slug' => (string) $row['slug'],
                'brandId' => (int) $row['brand_id'], 'categoryId' => (int) $row['category_id'],
                'description' => (string) ($row['description'] ?? ''),
                'specifications' => is_array($specifications) ? $specifications : [],
                'status' => (string) $row['status'],
                'brand' => $row['brand_name'] === null ? null : [
                    'id' => (int) $row['brand_id'], 'name' => $row['brand_name'], 'slug' => $row['brand_slug'], 'logo' => $row['brand_logo'] ?? '',
                ],
                'category' => $row['category_name'] === null ? null : [
                    'id' => (int) $row['category_id'], 'name' => $row['category_name'], 'slug' => $row['category_slug'],
                    'parentId' => $row['parent_id'] === null ? null : (int) $row['parent_id'], 'description' => $row['category_description'] ?? '',
                ],
                'variants' => [],
            ],
        ];
    }
    return $items;
}

if ($action === 'list' && $method === 'GET') {
    $cartId = cart_get_or_create($pdo, $userId);
    json_success(cart_read($pdo, $cartId));
}

if ($method !== 'POST') json_error('Phương thức không hỗ trợ.', 405);

$pdo->beginTransaction();
try {
    $cartId = cart_get_or_create($pdo, $userId, true);
    if ($action === 'clear') {
        $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cart_id')->execute(['cart_id' => $cartId]);
    } elseif ($action === 'remove') {
        $variantId = require_positive_int($body['variantId'] ?? null, 'variantId');
        $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cart_id AND variant_id = :variant_id')
            ->execute(['cart_id' => $cartId, 'variant_id' => $variantId]);
    } elseif ($action === 'remove-selected') {
        $ids = $body['variantIds'] ?? [];
        if (!is_array($ids)) json_error('Danh sách sản phẩm không hợp lệ.', 422);
        $ids = array_values(array_unique(array_filter(array_map('intval', $ids), static fn(int $id): bool => $id > 0)));
        if ($ids) {
            $marks = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM cart_items WHERE cart_id = ? AND variant_id IN ($marks)");
            $stmt->execute([$cartId, ...$ids]);
        }
    } elseif ($action === 'add' || $action === 'update' || $action === 'merge') {
        $inputItems = $action === 'merge' ? ($body['items'] ?? null) : [[
            'variantId' => $body['variantId'] ?? null,
            'quantity' => $body['quantity'] ?? null,
        ]];
        if (!is_array($inputItems) || ($action !== 'merge' && count($inputItems) !== 1)) {
            json_error('Danh sách sản phẩm không hợp lệ.', 422);
        }
        $variantStmt = $pdo->prepare(
            'SELECT v.id, v.stock_quantity, p.status, seller.status AS seller_status, p.seller_id
             FROM product_variants v JOIN products p ON p.id = v.product_id
             LEFT JOIN users seller ON seller.id = p.seller_id
             WHERE v.id = :id FOR UPDATE'
        );
        foreach ($inputItems as $input) {
            if (!is_array($input)) continue;
            $variantId = filter_var($input['variantId'] ?? null, FILTER_VALIDATE_INT);
            $quantity = filter_var($input['quantity'] ?? null, FILTER_VALIDATE_INT);
            if ($variantId === false || $variantId < 1 || $quantity === false || $quantity < 1) {
                if ($action === 'merge') continue;
                json_error('Sản phẩm hoặc số lượng không hợp lệ.', 422);
            }
            $variantStmt->execute(['id' => $variantId]);
            $variant = $variantStmt->fetch();
            if (!$variant || $variant['status'] !== 'published'
                || ($variant['seller_id'] !== null && $variant['seller_status'] !== 'active')) {
                if ($action === 'merge') continue;
                json_error('Sản phẩm không còn khả dụng.', 409);
            }

            $rowsStmt = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :cart_id AND variant_id = :variant_id ORDER BY id FOR UPDATE');
            $rowsStmt->execute(['cart_id' => $cartId, 'variant_id' => $variantId]);
            $rows = $rowsStmt->fetchAll();
            $current = array_sum(array_map(static fn(array $row): int => (int) $row['quantity'], $rows));
            $desired = $action === 'update' ? $quantity : $current + $quantity;
            $desired = min($desired, (int) $variant['stock_quantity']);
            if ($desired < 1) {
                if ($action === 'merge') continue;
                json_error('Sản phẩm hiện đã hết hàng.', 409);
            }
            if ($rows) {
                $pdo->prepare('UPDATE cart_items SET quantity = :quantity WHERE id = :id')
                    ->execute(['quantity' => $desired, 'id' => (int) $rows[0]['id']]);
                if (count($rows) > 1) {
                    $duplicateIds = array_map(static fn(array $row): int => (int) $row['id'], array_slice($rows, 1));
                    $marks = implode(',', array_fill(0, count($duplicateIds), '?'));
                    $pdo->prepare("DELETE FROM cart_items WHERE id IN ($marks)")->execute($duplicateIds);
                }
            } else {
                $pdo->prepare('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (:cart_id, :variant_id, :quantity)')
                    ->execute(['cart_id' => $cartId, 'variant_id' => $variantId, 'quantity' => $desired]);
            }
        }
    } else {
        json_error('Hành động giỏ hàng không hợp lệ.', 404);
    }
    $items = cart_read($pdo, $cartId);
    $pdo->commit();
    json_success($items);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $e;
}
