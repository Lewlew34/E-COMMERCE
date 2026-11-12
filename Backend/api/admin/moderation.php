<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

require_admin();
$pdo = get_db_connection();
$resource = (string) ($_GET['resource'] ?? '');
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && $resource === 'sellers') {
    $status = (string) ($_GET['status'] ?? 'pending');
    $where = match ($status) {
        'pending' => 'AND status = "inactive"',
        'approved' => 'AND status = "active"',
        'rejected' => 'AND status = "rejected"',
        'all' => '',
        default => json_error('Bộ lọc Seller không hợp lệ.', 422),
    };
    $stmt = $pdo->query(
        'SELECT id, full_name, email, phone, role, status, shop_name, shop_address,
                business_category, created_at
         FROM users
         WHERE role IN ("staff", "seller") ' . $where . '
         ORDER BY created_at DESC'
    );
    json_success(array_map('format_public_user', $stmt->fetchAll()));
}

if ($method === 'PATCH' && $resource === 'sellers') {
    $id = require_positive_int($_GET['id'] ?? null, 'ID Seller');
    $decision = (string) (get_json_body()['decision'] ?? '');
    $newStatus = match ($decision) {
        'approve' => 'active',
        'reject' => 'rejected',
        default => json_error('Quyết định duyệt không hợp lệ.', 422),
    };
    $stmt = $pdo->prepare(
        'UPDATE users SET status = :status
         WHERE id = :id AND role IN ("staff", "seller") AND status = "inactive"'
    );
    $stmt->execute(['status' => $newStatus, 'id' => $id]);
    if ($stmt->rowCount() !== 1) {
        json_error('Không tìm thấy hồ sơ Seller đang chờ duyệt.', 404);
    }
    json_success(null, $decision === 'approve' ? 'Đã phê duyệt gian hàng.' : 'Đã từ chối hồ sơ gian hàng.');
}

if ($method === 'GET' && $resource === 'products') {
    $status = (string) ($_GET['status'] ?? 'pending_review');
    if (!in_array($status, ['pending_review', 'published', 'rejected', 'all'], true)) {
        json_error('Bộ lọc sản phẩm không hợp lệ.', 422);
    }
    $filter = $status === 'all' ? '' : 'AND p.status = :status';
    $stmt = $pdo->prepare(
        'SELECT p.id, p.name, p.slug, p.description, p.specifications, p.status,
                b.name AS brand_name, c.name AS category_name,
                u.shop_name, u.full_name AS seller_name,
                MIN(v.sku) AS sku, MIN(v.price) AS price, SUM(v.stock_quantity) AS stock_quantity,
                MIN(v.image) AS image
         FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN users u ON u.id = p.seller_id
         LEFT JOIN product_variants v ON v.product_id = p.id
         WHERE p.seller_id IS NOT NULL ' . $filter . '
         GROUP BY p.id, p.name, p.slug, p.description, p.specifications, p.status,
                  b.name, c.name, u.shop_name, u.full_name
         ORDER BY p.id DESC'
    );
    if ($status !== 'all') {
        $stmt->execute(['status' => $status]);
    } else {
        $stmt->execute();
    }
    $products = array_map(static function (array $product): array {
        $product['id'] = (int) $product['id'];
        $product['price'] = $product['price'] === null ? null : (float) $product['price'];
        $product['stock_quantity'] = (int) $product['stock_quantity'];
        $product['specifications'] = json_decode((string) ($product['specifications'] ?? '{}'), true) ?: [];
        return $product;
    }, $stmt->fetchAll());
    json_success($products);
}

if ($method === 'PATCH' && $resource === 'products') {
    $id = require_positive_int($_GET['id'] ?? null, 'ID sản phẩm');
    $decision = (string) (get_json_body()['decision'] ?? '');
    $newStatus = match ($decision) {
        'approve' => 'published',
        'reject' => 'rejected',
        default => json_error('Quyết định duyệt sản phẩm không hợp lệ.', 422),
    };
    $stmt = $pdo->prepare(
        'UPDATE products SET status = :status WHERE id = :id AND status = "pending_review"'
    );
    $stmt->execute(['status' => $newStatus, 'id' => $id]);
    if ($stmt->rowCount() !== 1) {
        json_error('Không tìm thấy sản phẩm đang chờ duyệt.', 404);
    }
    json_success(null, $decision === 'approve' ? 'Đã duyệt sản phẩm và đăng lên sàn.' : 'Đã từ chối sản phẩm.');
}

json_error('Tài nguyên hoặc phương thức không hợp lệ.', 404);
