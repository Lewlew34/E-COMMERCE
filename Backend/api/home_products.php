<?php
// Backend/api/home_products.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = "localhost";
$db_name = "techecommercedb";
$username = "root";
$password = ""; 

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $query = "
        SELECT 
            p.id, p.name, p.slug, p.description, p.specifications,
            b.name AS brand_name,
            MIN(v.id) AS variant_id,
            MIN(v.price) AS price,
            MIN(v.compare_at_price) AS compare_price,
            MIN(v.image) AS variant_image
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_variants v ON p.id = v.product_id
        GROUP BY p.id, p.name, p.slug, p.description, p.specifications, b.name
        LIMIT 8
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $featured = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($featured as &$item) {
        $item['specifications'] = json_decode($item['specifications']);
    }

    echo json_encode([
        "status" => "success",
        "featured" => $featured
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
}
?>