<?php
require_once __DIR__ . '/_seller_common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ($_GET['action'] ?? '') !== 'create') {
    seller_json(['status' => 'error', 'message' => 'Hành động không hợp lệ.'], 404);
}
if (empty($_SESSION['auth_user_id']) || ($_SESSION['auth_role'] ?? '') !== 'customer') {
    seller_json(['status' => 'error', 'message' => 'Hãy đăng nhập bằng tài khoản khách hàng đã đăng ký trong database để đặt hàng.'], 401);
}

$body = seller_body();
$items = $body['items'] ?? null;
$address = $body['shippingAddress'] ?? null;
$paymentMethod = (string) ($body['paymentMethod'] ?? '');
if (!is_array($items) || count($items) === 0 || !is_array($address)
    || !in_array($paymentMethod, ['COD', 'BANK_TRANSFER', 'CREDIT_CARD'], true)) {
    seller_json(['status' => 'error', 'message' => 'Thông tin giỏ hàng, địa chỉ hoặc thanh toán không hợp lệ.'], 422);
}

foreach (['recipientName', 'phone', 'addressLine', 'city'] as $requiredField) {
    if (trim((string) ($address[$requiredField] ?? '')) === '') {
        seller_json(['status' => 'error', 'message' => 'Địa chỉ giao hàng chưa đầy đủ.'], 422);
    }
}

$pdo = seller_db();
$pdo->beginTransaction();
$lines = [];
$subtotal = 0.0;
$userId = (int) $_SESSION['auth_user_id'];
$select = $pdo->prepare(
    'SELECT v.id AS variant_id, v.price, v.stock_quantity, v.attributes,
            p.id AS product_id, p.name, p.status, p.seller_id,
            COALESCE((
              SELECT fsi.flash_sale_price FROM flash_sale_items fsi
              JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
              WHERE fsi.variant_id = v.id AND NOW() BETWEEN fs.start_time AND fs.end_time
                AND fsi.sold_count < fsi.stock_limit
              ORDER BY fs.start_time DESC LIMIT 1
            ), v.price) AS effective_price
     FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE v.id = :variant_id FOR UPDATE'
);

foreach ($items as $item) {
    $variantId = filter_var($item['variantId'] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
    if ($variantId === false || $variantId < 1 || $quantity === false || $quantity < 1) {
        $pdo->rollBack();
        seller_json(['status' => 'error', 'message' => 'Sản phẩm hoặc số lượng đặt mua không hợp lệ.'], 422);
    }
    $select->execute(['variant_id' => $variantId]);
    $variant = $select->fetch();
    if (!$variant || $variant['status'] !== 'published') {
        $pdo->rollBack();
        seller_json(['status' => 'error', 'message' => 'Một sản phẩm không còn được bán. Vui lòng tải lại giỏ hàng.'], 409);
    }
    if ((int) $variant['stock_quantity'] < $quantity) {
        $pdo->rollBack();
        seller_json(['status' => 'error', 'message' => 'Tồn kho không đủ cho sản phẩm ' . $variant['name'] . '.'], 409);
    }
    $unitPrice = (float) $variant['effective_price'];
    $lineTotal = $unitPrice * $quantity;
    $subtotal += $lineTotal;
    $attributes = json_decode((string) $variant['attributes'], true);
    $lines[] = [
        'variant_id' => (int) $variant['variant_id'],
        'seller_id' => $variant['seller_id'] === null ? null : (int) $variant['seller_id'],
        'name' => $variant['name'],
        'attributes' => json_encode(is_array($attributes) ? $attributes : [], JSON_UNESCAPED_UNICODE),
        'price' => $unitPrice,
        'quantity' => $quantity,
        'total' => $lineTotal,
        'previous_stock' => (int) $variant['stock_quantity'],
        'new_stock' => (int) $variant['stock_quantity'] - $quantity,
    ];
}

$shippingFee = $subtotal >= 500000 ? 0 : 30000;
$orderCode = 'ORD-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
$addressSnapshot = [
    'recipientName' => trim((string) $address['recipientName']),
    'phone' => trim((string) $address['phone']),
    'addressLine' => trim((string) $address['addressLine']),
    'ward' => trim((string) ($address['ward'] ?? '')),
    'district' => trim((string) ($address['district'] ?? '')),
    'city' => trim((string) $address['city']),
];

$insertOrder = $pdo->prepare(
    'INSERT INTO orders (user_id, order_code, total_amount, shipping_fee, final_amount,
                         payment_status, order_status, shipping_address_snapshot)
     VALUES (:user_id, :order_code, :total_amount, :shipping_fee, :final_amount, "pending", "pending", :address)'
);
$insertOrder->execute([
    'user_id' => $userId,
    'order_code' => $orderCode,
    'total_amount' => $subtotal,
    'shipping_fee' => $shippingFee,
    'final_amount' => $subtotal + $shippingFee,
    'address' => json_encode($addressSnapshot, JSON_UNESCAPED_UNICODE),
]);
$orderId = (int) $pdo->lastInsertId();

$insertItem = $pdo->prepare(
    'INSERT INTO order_items (order_id, variant_id, seller_id, product_name_snapshot,
                              variant_attributes_snapshot, price, quantity, total_price)
     VALUES (:order_id, :variant_id, :seller_id, :name, :attributes, :price, :quantity, :total)'
);
$updateStock = $pdo->prepare('UPDATE product_variants SET stock_quantity = :stock WHERE id = :variant_id');
$insertLog = $pdo->prepare(
    'INSERT INTO inventory_logs (variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by)
     VALUES (:variant_id, "order_deduct", :quantity_changed, :previous_stock, :new_stock, :reference_id, :created_by)'
);
$insertPayment = $pdo->prepare(
    'INSERT INTO payments (order_id, payment_method, amount, status) VALUES (:order_id, :method, :amount, "pending")'
);

foreach ($lines as $line) {
    $insertItem->execute([
        'order_id' => $orderId,
        'variant_id' => $line['variant_id'],
        'seller_id' => $line['seller_id'],
        'name' => $line['name'],
        'attributes' => $line['attributes'],
        'price' => $line['price'],
        'quantity' => $line['quantity'],
        'total' => $line['total'],
    ]);
    $updateStock->execute(['stock' => $line['new_stock'], 'variant_id' => $line['variant_id']]);
    $insertLog->execute([
        'variant_id' => $line['variant_id'],
        'quantity_changed' => -$line['quantity'],
        'previous_stock' => $line['previous_stock'],
        'new_stock' => $line['new_stock'],
        'reference_id' => $orderCode,
        'created_by' => $userId,
    ]);
}
$insertPayment->execute([
    'order_id' => $orderId,
    'method' => $paymentMethod,
    'amount' => $subtotal + $shippingFee,
]);

$pdo->commit();
seller_json([
    'status' => 'success',
    'data' => [
        'id' => $orderId,
        'orderCode' => $orderCode,
        'totalAmount' => $subtotal,
        'shippingFee' => $shippingFee,
        'finalAmount' => $subtotal + $shippingFee,
        'paymentStatus' => 'pending',
        'orderStatus' => 'pending',
        'paymentMethod' => $paymentMethod,
        'shippingAddressSnapshot' => $addressSnapshot,
        'items' => array_map(static fn(array $line, int $index): array => [
            'id' => $index + 1,
            'orderId' => $orderId,
            'variantId' => $line['variant_id'],
            'productNameSnapshot' => $line['name'],
            'variantAttributesSnapshot' => json_decode($line['attributes'], true),
            'price' => $line['price'],
            'quantity' => $line['quantity'],
            'totalPrice' => $line['total'],
        ], $lines, array_keys($lines)),
    ],
], 201);
