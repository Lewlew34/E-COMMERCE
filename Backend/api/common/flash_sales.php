<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';

try {
    $conn = get_db_connection();
    $stmt = $conn->prepare("
        SELECT 
            fs.id AS flash_sale_id, fs.title, fs.start_time, fs.end_time,
            fsi.variant_id, fsi.flash_sale_price, fsi.stock_limit, fsi.sold_count,
            v.sku, v.price AS original_price, v.image, v.attributes,
            p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
            b.name AS brand_name, c.name AS category_name
        FROM flash_sales fs
        JOIN flash_sale_items fsi ON fsi.flash_sale_id = fs.id
        JOIN product_variants v ON v.id = fsi.variant_id
        JOIN products p ON p.id = v.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE NOW() BETWEEN fs.start_time AND fs.end_time
          AND fsi.sold_count < fsi.stock_limit
          AND p.status = 'published'
        ORDER BY fs.end_time ASC
    ");
    $stmt->execute();
    $items = $stmt->fetchAll();

    foreach ($items as &$item) {
        $item['attributes'] = json_decode((string) ($item['attributes'] ?? '{}'), true);
        $item['discount_percent'] = (int) round((1 - ((float)$item['flash_sale_price'] / (float)$item['original_price'])) * 100);
    }
    unset($item);

    json_success($items);
} catch (PDOException $e) {
    json_error("Lỗi khi tải Flash Sale: " . $e->getMessage(), 500);
}
