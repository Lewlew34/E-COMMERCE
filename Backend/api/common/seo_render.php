<?php
declare(strict_types=1);

/**
 * LHK Tech - SEO & Social Sharing Prerender Endpoint (Dynamic Meta Injector)
 * Dùng cho Facebook Crawler, Zalo, Twitter, Googlebot và SEOquake.
 */

require_once dirname(__DIR__, 2) . '/config/env.php';
require_once dirname(__DIR__, 2) . '/config/database.php';

load_root_env();

// Nhận id hoặc slug từ URL
$id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;
$slug = isset($_GET['slug']) ? trim((string)$_GET['slug']) : '';

// Nếu slug là số nguyên thì map sang id
if (!$id && ctype_digit($slug)) {
    $id = (int) $slug;
    $slug = '';
}

if (!$id && $slug === '') {
    http_response_code(400);
    echo "<h1>LHK Tech - Thiếu mã nhận diện sản phẩm</h1>";
    exit;
}

// Xác định base URL của Frontend
$frontendUrl = rtrim($_ENV['FRONTEND_URL'] ?? 'http://localhost:3000', '/');

try {
    $conn = get_db_connection();

    $sql = "
        SELECT 
            p.id, p.name, p.slug, p.description, p.specifications, p.status,
            b.name AS brand_name,
            c.name AS category_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE " . ($id ? "p.id = :id" : "p.slug = :slug") . "
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
        http_response_code(404);
        echo "<!DOCTYPE html><html><head><title>Không tìm thấy sản phẩm - LHK Tech</title></head><body><h1>404 - Sản phẩm không tồn tại hoặc đã ngừng kinh doanh</h1></body></html>";
        exit;
    }

    // Lấy biến thể đầu tiên để trích xuất giá và hình ảnh
    $varStmt = $conn->prepare("
        SELECT price, compare_at_price, image, stock_quantity 
        FROM product_variants 
        WHERE product_id = :product_id 
        ORDER BY id ASC LIMIT 1
    ");
    $varStmt->execute(['product_id' => (int) $product['id']]);
    $variant = $varStmt->fetch();

    $productName = (string) $product['name'];
    $productSlug = (string) ($product['slug'] ?: $product['id']);
    $canonicalUrl = "$frontendUrl/product/$productSlug";

    // Chuẩn hóa mô tả sạch (loại bỏ HTML tags, cắt độ dài tối ưu 160 ký tự cho SEO)
    $rawDesc = trim(strip_tags((string) ($product['description'] ?? '')));
    if ($rawDesc === '') {
        $rawDesc = "Mua ngay $productName chính hãng tại LHK Tech với giá tốt nhất, hỗ trợ trả góp 0%, giao hàng nhanh chóng toàn quốc.";
    }
    $metaDesc = mb_substr($rawDesc, 0, 160, 'UTF-8');

    // Chuẩn hóa đường dẫn hình ảnh tuyệt đối
    $image = (string) ($variant['image'] ?? '');
    if ($image === '') {
        $imageUrl = "$frontendUrl/logo-lhk-tech.png";
    } elseif (str_starts_with($image, 'http://') || str_starts_with($image, 'https://')) {
        $imageUrl = $image;
    } else {
        $imageUrl = "$frontendUrl/" . ltrim($image, '/');
    }

    $price = (float) ($variant['price'] ?? 0);
    $inStock = ((int) ($variant['stock_quantity'] ?? 0)) > 0;

    // Kiểm tra User-Agent: Nếu là người dùng thật truy cập trực tiếp file này (không phải Bot và không có ?bot=1), chuyển hướng sang SPA
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $isCrawler = (bool) preg_match('/(facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Pinterest|Slackbot|TelegramBot|WhatsApp|ZaloPlatform|Zalo|Googlebot|bingbot|Baiduspider|YandexBot)/i', $userAgent);
    $isTestBot = isset($_GET['bot']) && $_GET['bot'] === '1';

    if (!$isCrawler && !$isTestBot) {
        header("Location: $canonicalUrl", true, 302);
        exit;
    }

    // Thiết lập Header HTML UTF-8
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: public, max-age=3600');

    // Tạo Schema.org JSON-LD
    $schemaData = [
        '@context' => 'https://schema.org/',
        '@type' => 'Product',
        'name' => $productName,
        'image' => [$imageUrl],
        'description' => $metaDesc,
        'brand' => [
            '@type' => 'Brand',
            'name' => $product['brand_name'] ?: 'LHK Tech'
        ],
        'category' => $product['category_name'] ?: 'Thiết bị công nghệ',
        'offers' => [
            '@type' => 'Offer',
            'url' => $canonicalUrl,
            'priceCurrency' => 'VND',
            'price' => $price,
            'availability' => $inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            'itemCondition' => 'https://schema.org/NewCondition'
        ]
    ];
    $jsonLd = json_encode($schemaData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo "Lỗi truy vấn CSDL: " . htmlspecialchars($e->getMessage());
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi" prefix="og: https://ogp.me/ns# fb: https://ogp.me/ns/fb# product: https://ogp.me/ns/product#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Title & SEO Metadata Cơ Bản -->
    <title><?= htmlspecialchars($productName, ENT_QUOTES, 'UTF-8') ?> - Chính Hãng Giá Tốt | LHK Tech</title>
    <meta name="description" content="<?= htmlspecialchars($metaDesc, ENT_QUOTES, 'UTF-8') ?>">
    <link rel="canonical" href="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Open Graph (Facebook, Zalo, LinkedIn, Messenger) -->
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="LHK Tech">
    <meta property="og:url" content="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:title" content="<?= htmlspecialchars($productName, ENT_QUOTES, 'UTF-8') ?> | LHK Tech">
    <meta property="og:description" content="<?= htmlspecialchars($metaDesc, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:secure_url" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:alt" content="<?= htmlspecialchars($productName, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="product:price:amount" content="<?= $price ?>">
    <meta property="product:price:currency" content="VND">
    <meta property="product:availability" content="<?= $inStock ? 'in stock' : 'out of stock' ?>">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlspecialchars($productName, ENT_QUOTES, 'UTF-8') ?> | LHK Tech">
    <meta name="twitter:description" content="<?= htmlspecialchars($metaDesc, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Dữ liệu có cấu trúc Schema.org JSON-LD -->
    <script type="application/ld+json">
<?= $jsonLd ?>
    </script>

    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 20px; }
        .product-card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .product-img { max-width: 100%; height: auto; border-radius: 12px; margin-bottom: 20px; }
        .price { color: #dc2626; font-size: 24px; font-weight: 800; }
        .cta-btn { display: inline-block; background-color: #2563eb; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="product-card">
        <img class="product-img" src="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>" alt="<?= htmlspecialchars($productName, ENT_QUOTES, 'UTF-8') ?>">
        <h1><?= htmlspecialchars($productName, ENT_QUOTES, 'UTF-8') ?></h1>
        <div class="price"><?= number_format($price, 0, ',', '.') ?> ₫</div>
        <p><?= nl2br(htmlspecialchars($rawDesc, ENT_QUOTES, 'UTF-8')) ?></p>
        <p><strong>Thương hiệu:</strong> <?= htmlspecialchars($product['brand_name'] ?: 'Chính hãng', ENT_QUOTES, 'UTF-8') ?></p>
        <p><strong>Danh mục:</strong> <?= htmlspecialchars($product['category_name'] ?: 'Thiết bị công nghệ', ENT_QUOTES, 'UTF-8') ?></p>
        <p><strong>Trạng thái:</strong> <?= $inStock ? 'Còn hàng' : 'Tạm hết hàng' ?></p>
        <a class="cta-btn" href="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">Xem sản phẩm trên ứng dụng LHK Tech</a>
    </div>
</body>
</html>
