<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$seller = require_seller();
$sellerId = $seller['id'];
$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

function fetch_seller_products(PDO $pdo, int $sellerId): array
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
            $specifications = json_decode((string) ($row['specifications'] ?? '{}'), true);
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
            $attributes = json_decode((string) ($row['attributes'] ?? '{}'), true);
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

function parse_product_input(array $body): array
{
    $name = trim((string) ($body['name'] ?? ''));
    $sku = trim((string) ($body['sku'] ?? ''));
    $image = trim((string) ($body['image'] ?? ''));
    $brandId = require_positive_int($body['brandId'] ?? null, 'Thương hiệu');
    $categoryId = require_positive_int($body['categoryId'] ?? null, 'Danh mục');
    $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_FLOAT);
    $stock = filter_var($body['stock'] ?? null, FILTER_VALIDATE_INT);
    $comparePriceRaw = $body['comparePrice'] ?? null;
    $comparePrice = ($comparePriceRaw === '' || $comparePriceRaw === null)
        ? null
        : filter_var($comparePriceRaw, FILTER_VALIDATE_FLOAT);

    if ($name === '' || $sku === '' || $price === false || $price <= 0 || $stock === false || $stock < 0
        || ($comparePriceRaw !== '' && $comparePriceRaw !== null && ($comparePrice === false || $comparePrice <= 0))
        || ($comparePrice !== null && $comparePrice < $price)
        || ($image !== '' && !filter_var($image, FILTER_VALIDATE_URL))) {
        json_error('Thông tin sản phẩm, SKU, giá, tồn kho hoặc ảnh URL không hợp lệ.', 422);
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

function generate_product_slug(string $name): string
{
    $slug = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
    $slug = strtolower(trim((string) preg_replace('/[^a-zA-Z0-9]+/', '-', (string) $slug), '-'));
    return ($slug ?: 'product') . '-' . bin2hex(random_bytes(3));
}

// 1. GET: Lấy danh sách sản phẩm thuộc shop
if ($method === 'GET') {
    json_success(fetch_seller_products($pdo, $sellerId));
}

// 2. POST: Thêm sản phẩm mới vào shop
if ($method === 'POST') {
    $body = parse_product_input(get_json_body());
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'INSERT INTO products (name, slug, brand_id, category_id, seller_id, description, specifications, status)
         VALUES (:name, :slug, :brand_id, :category_id, :seller_id, :description, :specifications, "published")'
    );
    $stmt->execute([
        'name' => $body['name'],
        'slug' => generate_product_slug($body['name']),
        'brand_id' => $body['brand_id'],
        'category_id' => $body['category_id'],
        'seller_id' => $sellerId,
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
        'created_by' => $sellerId,
    ]);

    $pdo->commit();
    json_success(fetch_seller_products($pdo, $sellerId)[0] ?? null, 'Thêm sản phẩm thành công.', 201);
}

// 3. PUT: Cập nhật thông tin sản phẩm và biến thể
if ($method === 'PUT') {
    $productId = require_positive_int($_GET['id'] ?? null, 'ID sản phẩm');
    $body = parse_product_input(get_json_body());
    $pdo->beginTransaction();

    $owner = $pdo->prepare('SELECT id FROM products WHERE id = :id AND seller_id = :seller_id FOR UPDATE');
    $owner->execute(['id' => $productId, 'seller_id' => $sellerId]);
    if (!$owner->fetch()) {
        $pdo->rollBack();
        json_error('Không tìm thấy sản phẩm thuộc gian hàng của bạn.', 404);
    }

    $pdo->prepare(
        'UPDATE products SET name = :name, brand_id = :brand_id, category_id = :category_id,
         description = :description, specifications = :specifications WHERE id = :id AND seller_id = :seller_id'
    )->execute([
        'name' => $body['name'],
        'brand_id' => $body['brand_id'],
        'category_id' => $body['category_id'],
        'description' => $body['description'],
        'specifications' => $body['specifications'],
        'id' => $productId,
        'seller_id' => $sellerId,
    ]);

    $variantId = require_positive_int($body['variantId'] ?? $_GET['variantId'] ?? null, 'ID biến thể');
    $variantStmt = $pdo->prepare(
        'SELECT id, stock_quantity FROM product_variants WHERE product_id = :product_id AND id = :variant_id FOR UPDATE'
    );
    $variantStmt->execute(['product_id' => $productId, 'variant_id' => $variantId]);
    $variant = $variantStmt->fetch();

    if (!$variant) {
        $pdo->rollBack();
        json_error('Sản phẩm chưa có biến thể để cập nhật.', 409);
    }

    $pdo->prepare(
        'UPDATE product_variants SET sku = :sku, price = :price, compare_at_price = :compare_price,
         stock_quantity = :stock, attributes = :attributes, image = :image WHERE id = :id'
    )->execute([
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
            'created_by' => $sellerId,
        ]);
    }

    $pdo->commit();
    $updated = array_values(array_filter(
        fetch_seller_products($pdo, $sellerId),
        static fn(array $item): bool => $item['id'] === $productId
    ))[0] ?? null;

    json_success($updated, 'Cập nhật sản phẩm thành công.');
}

// 4. DELETE: Ẩn sản phẩm (soft delete)
if ($method === 'DELETE') {
    $productId = require_positive_int($_GET['id'] ?? null, 'ID sản phẩm');
    $stmt = $pdo->prepare('UPDATE products SET status = "archived" WHERE id = :id AND seller_id = :seller_id');
    $stmt->execute(['id' => $productId, 'seller_id' => $sellerId]);

    if ($stmt->rowCount() === 0) {
        json_error('Không tìm thấy sản phẩm thuộc gian hàng của bạn.', 404);
    }
    json_success(null, 'Đã ẩn sản phẩm khỏi gian hàng.');
}

json_error('Phương thức không hỗ trợ.', 405);
