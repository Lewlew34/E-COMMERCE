<?php
// Backend/api/products.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Cấu hình kết nối Database
$host = "localhost";
$db_name = "techecommercedb";
$username = "root";
$password = ""; 

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;

    // Sửa lại tên cột khớp với cấu trúc bảng MySQL thực tế của bạn
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
        LEFT JOIN product_variants v ON p.id = v.product_id
        LEFT JOIN flash_sale_items fsi ON fsi.variant_id = v.id
        LEFT JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
        WHERE p.status = 'published'
        GROUP BY p.id, p.name, p.slug, p.description, p.specifications,
                 b.id, b.name, b.slug, b.logo, c.id, c.name, c.slug
        LIMIT :limit
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $products = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Giải mã JSON thông số kỹ thuật nếu có
        $row['specifications'] = json_decode($row['specifications']);
        $products[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data" => $products
    ]);

} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $exception->getMessage()
    ]);
}
?>