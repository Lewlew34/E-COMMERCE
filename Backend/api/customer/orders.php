<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$customer = require_customer();
$userId = $customer['id'];
$pdo = get_db_connection();
$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

// 1. TẠO ĐƠN HÀNG (CHECKOUT)
if ($action === 'create' && $method === 'POST') {
    $body = get_json_body();
    $items = $body['items'] ?? null;
    $address = $body['shippingAddress'] ?? null;
    $paymentMethod = (string) ($body['paymentMethod'] ?? '');

    if (!is_array($items) || count($items) === 0 || !is_array($address)
        || !in_array($paymentMethod, ['COD', 'BANK_TRANSFER', 'CREDIT_CARD'], true)) {
        json_error('Thông tin giỏ hàng, địa chỉ nhận hàng hoặc phương thức thanh toán không hợp lệ.', 422);
    }

    foreach (['recipientName', 'phone', 'addressLine', 'city'] as $requiredField) {
        if (trim((string) ($address[$requiredField] ?? '')) === '') {
            json_error('Địa chỉ nhận hàng chưa đầy đủ các thông tin bắt buộc.', 422);
        }
    }

    $pdo->beginTransaction();
    $lines = [];
    $subtotal = 0.0;

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
            json_error('Sản phẩm hoặc số lượng đặt mua không hợp lệ.', 422);
        }

        $select->execute(['variant_id' => $variantId]);
        $variant = $select->fetch();
        if (!$variant || $variant['status'] !== 'published') {
            $pdo->rollBack();
            json_error('Một sản phẩm trong đơn không còn khả dụng.', 409);
        }

        if ((int) $variant['stock_quantity'] < $quantity) {
            $pdo->rollBack();
            json_error('Tồn kho không đủ cho sản phẩm "' . $variant['name'] . '".', 409);
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

    json_response([
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
}

// 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA KHÁCH HÀNG (MY ORDERS)
if ($action === 'list' && $method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT o.id, o.user_id, o.order_code, o.total_amount, o.shipping_fee, o.final_amount,
                o.payment_status, o.order_status, o.shipping_address_snapshot, o.created_at, o.updated_at,
                pay.payment_method
         FROM orders o
         LEFT JOIN (SELECT order_id, MAX(payment_method) AS payment_method FROM payments GROUP BY order_id) pay
           ON pay.order_id = o.id
         WHERE o.user_id = :user_id
         ORDER BY o.created_at DESC'
    );
    $stmt->execute(['user_id' => $userId]);
    $orders = [];

    $itemStmt = $pdo->prepare(
        'SELECT oi.id, oi.variant_id, oi.product_name_snapshot, oi.variant_attributes_snapshot,
                oi.price, oi.quantity, oi.total_price, pv.image
         FROM order_items oi
         LEFT JOIN product_variants pv ON pv.id = oi.variant_id
         WHERE oi.order_id = :order_id'
    );

    foreach ($stmt->fetchAll() as $row) {
        $itemStmt->execute(['order_id' => (int) $row['id']]);
        $address = json_decode((string) $row['shipping_address_snapshot'], true);

        $orders[] = [
            'id' => (int) $row['id'],
            'userId' => (int) $row['user_id'],
            'orderCode' => $row['order_code'],
            'totalAmount' => (float) $row['total_amount'],
            'shippingFee' => (float) $row['shipping_fee'],
            'finalAmount' => (float) $row['final_amount'],
            'paymentStatus' => $row['payment_status'],
            'orderStatus' => $row['order_status'],
            'paymentMethod' => $row['payment_method'] ?? 'COD',
            'shippingAddressSnapshot' => is_array($address) ? $address : [],
            'items' => array_map(static function (array $item) use ($row): array {
                $attr = json_decode((string) $item['variant_attributes_snapshot'], true);
                return [
                    'id' => (int) $item['id'],
                    'orderId' => (int) $row['id'],
                    'variantId' => (int) $item['variant_id'],
                    'productNameSnapshot' => $item['product_name_snapshot'],
                    'variantAttributesSnapshot' => is_array($attr) ? $attr : [],
                    'price' => (float) $item['price'],
                    'quantity' => (int) $item['quantity'],
                    'totalPrice' => (float) $item['total_price'],
                    'image' => $item['image'] ?? '',
                ];
            }, $itemStmt->fetchAll()),
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    json_success($orders);
}

// 3. KHÁCH HÀNG TỰ HỦY ĐƠN HÀNG (CANCEL ORDER)
if ($action === 'cancel' && $method === 'POST') {
    $orderId = require_positive_int($_GET['id'] ?? null, 'ID đơn hàng');

    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'SELECT id, order_code, order_status FROM orders WHERE id = :id AND user_id = :user_id FOR UPDATE'
    );
    $stmt->execute(['id' => $orderId, 'user_id' => $userId]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        json_error('Không tìm thấy đơn hàng của bạn.', 404);
    }

    if ($order['order_status'] !== 'pending') {
        $pdo->rollBack();
        json_error('Đơn hàng đã được xác nhận hoặc đang vận chuyển nên không thể tự hủy.', 409);
    }

    // Cập nhật trạng thái hủy
    $pdo->prepare('UPDATE orders SET order_status = "cancelled" WHERE id = :id')
        ->execute(['id' => $orderId]);

    // Cập nhật seller_order_status
    $pdo->prepare('UPDATE seller_order_status SET status = "cancelled" WHERE order_id = :order_id')
        ->execute(['order_id' => $orderId]);

    // Hoàn lại tồn kho
    $itemsStmt = $pdo->prepare(
        'SELECT oi.variant_id, oi.quantity, pv.stock_quantity
         FROM order_items oi
         JOIN product_variants pv ON pv.id = oi.variant_id
         WHERE oi.order_id = :order_id FOR UPDATE'
    );
    $itemsStmt->execute(['order_id' => $orderId]);

    foreach ($itemsStmt->fetchAll() as $item) {
        $prevStock = (int) $item['stock_quantity'];
        $restoredStock = $prevStock + (int) $item['quantity'];

        $pdo->prepare('UPDATE product_variants SET stock_quantity = :stock WHERE id = :variant_id')
            ->execute(['stock' => $restoredStock, 'variant_id' => (int) $item['variant_id']]);

        $pdo->prepare(
            'INSERT INTO inventory_logs (variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by)
             VALUES (:variant_id, "return", :quantity, :previous_stock, :new_stock, :reference_id, :created_by)'
        )->execute([
            'variant_id' => (int) $item['variant_id'],
            'quantity' => (int) $item['quantity'],
            'previous_stock' => $prevStock,
            'new_stock' => $restoredStock,
            'reference_id' => $order['order_code'],
            'created_by' => $userId,
        ]);
    }

    $pdo->commit();
    json_success(null, 'Hủy đơn hàng thành công và đã hoàn lại tồn kho.');
}

json_error('Hành động không hợp lệ.', 404);
