<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';

try {
    $conn = get_db_connection();
    $limit = isset($_GET['limit']) ? max(1, min(100, (int) $_GET['limit'])) : 50;

    $query = "
        SELECT 
            p.id, p.name, p.slug, p.description, p.specifications,
            b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug, b.logo AS brand_logo,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
            MIN(CASE
                WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     AND fsi.sold_count < fsi.stock_limit THEN fsi.flash_sale_price
                ELSE v.price
            END) AS price,
            MIN(CASE
                WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     AND fsi.sold_count < fsi.stock_limit THEN v.price
                ELSE v.compare_at_price
            END) AS compare_price,
            MAX(CASE
                WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     AND fsi.sold_count < fsi.stock_limit THEN 1
                ELSE 0
            END) AS is_flash_sale,
            MIN(CASE WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     THEN fs.start_time ELSE NULL END) AS flash_sale_start_time,
            MIN(CASE WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     THEN fs.end_time ELSE NULL END) AS flash_sale_end_time,
            SUM(v.stock_quantity) AS total_stock,
            MIN(v.image) AS thumbnail,
            MIN(v.id) AS variant_id
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users seller ON seller.id = p.seller_id
        LEFT JOIN product_variants v ON p.id = v.product_id
        LEFT JOIN flash_sale_items fsi ON fsi.variant_id = v.id
        LEFT JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
        WHERE p.status = 'published'
          AND (p.seller_id IS NULL OR seller.status = 'active')
        GROUP BY p.id, p.name, p.slug, p.description, p.specifications,
                 b.id, b.name, b.slug, b.logo, c.id, c.name, c.slug
        ORDER BY p.id DESC
        LIMIT :limit
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $products = [];
    while ($row = $stmt->fetch()) {
        $row['specifications'] = json_decode((string) ($row['specifications'] ?? '{}'), true);
        $products[] = $row;
    }

    json_success($products);
} catch (PDOException $exception) {
    json_error("Lỗi khi tải danh sách sản phẩm: " . $exception->getMessage(), 500);
}
