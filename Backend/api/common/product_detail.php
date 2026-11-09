<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';

$id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;
$slug = isset($_GET['slug']) ? trim((string) $_GET['slug']) : '';

if (!$id && $slug === '') {
    json_error('Vui lòng cung cấp id hoặc slug sản phẩm.', 400);
}

try {
    $conn = get_db_connection();

    $sql = "
        SELECT 
            p.id, p.name, p.slug, p.description, p.specifications, p.status, p.seller_id,
            b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug, b.logo AS brand_logo,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
            u.shop_name, u.shop_address
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE " . ($id ? "p.id = :id" : "p.slug = :slug") . " AND p.status = 'published'
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    if ($id) {
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    } else {
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
    }
    $stmt->execute();
    $product = $stmt->fetch();

    if (!$product) {
        json_error('Không tìm thấy sản phẩm.', 404);
    }

    $product['specifications'] = json_decode((string) ($product['specifications'] ?? '{}'), true);

    // Lấy toàn bộ biến thể kèm trạng thái flash sale
    $varStmt = $conn->prepare("
        SELECT 
            v.id, v.product_id, v.sku, v.price, v.compare_at_price, v.stock_quantity,
            v.attributes, v.image,
            fsi.flash_sale_price, fsi.stock_limit, fsi.sold_count,
            fs.title AS flash_sale_title, fs.start_time AS flash_sale_start, fs.end_time AS flash_sale_end,
            (CASE WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time AND fsi.sold_count < fsi.stock_limit THEN 1 ELSE 0 END) AS is_flash_sale
        FROM product_variants v
        LEFT JOIN flash_sale_items fsi ON fsi.variant_id = v.id
        LEFT JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
        WHERE v.product_id = :product_id
        ORDER BY v.id ASC
    ");
    $varStmt->execute(['product_id' => (int) $product['id']]);
    $variants = [];
    $isFlashSaleOverall = false;

    while ($v = $varStmt->fetch()) {
        $attributes = json_decode((string) ($v['attributes'] ?? '{}'), true);
        $isFs = (int) $v['is_flash_sale'] === 1;
        if ($isFs) {
            $isFlashSaleOverall = true;
        }

        $variants[] = [
            'id' => (int) $v['id'],
            'productId' => (int) $v['product_id'],
            'sku' => $v['sku'],
            'price' => $isFs ? (float) $v['flash_sale_price'] : (float) $v['price'],
            'compareAtPrice' => $isFs ? (float) $v['price'] : ($v['compare_at_price'] !== null ? (float) $v['compare_at_price'] : null),
            'stockQuantity' => (int) $v['stock_quantity'],
            'attributes' => is_array($attributes) ? $attributes : [],
            'image' => $v['image'] ?? '',
            'isFlashSale' => $isFs,
            'flashSalePrice' => $isFs ? (float) $v['flash_sale_price'] : null,
            'flashSaleStartTime' => $v['flash_sale_start'],
            'flashSaleEndTime' => $v['flash_sale_end'],
        ];
    }

    $product['variants'] = $variants;
    $product['isFlashSale'] = $isFlashSaleOverall;

    json_success($product);
} catch (PDOException $e) {
    json_error("Lỗi khi tải chi tiết sản phẩm: " . $e->getMessage(), 500);
}
