<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$pdo = get_db_connection();
$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];
$rawBody = get_json_body();
if (!is_array($rawBody)) {
    $rawBody = [];
}

/**
 * Chuẩn hóa trạng thái đơn hàng về các giá trị chuẩn của hệ thống:
 * 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
 */
function normalize_order_status_value(?string $rawStatus, string $fallback = 'pending'): string
{
    $val = strtolower(trim((string) $rawStatus));
    if ($val === '') {
        return $fallback;
    }

    if (
        str_contains($val, 'cancel') ||
        str_contains($val, 'hủy') ||
        str_contains($val, 'fail') ||
        str_contains($val, 'reject') ||
        str_contains($val, 'từ chối')
    ) {
        return 'cancelled';
    }

    if (
        str_contains($val, 'deliver') ||
        str_contains($val, 'hoàn tất') ||
        str_contains($val, 'giao thành công') ||
        str_contains($val, 'completed')
    ) {
        return 'delivered';
    }

    if (
        str_contains($val, 'ship') ||
        str_contains($val, 'giao') ||
        str_contains($val, 'vận chuyển') ||
        str_contains($val, 'bưu tá') ||
        str_contains($val, 'out_for_delivery')
    ) {
        return 'shipping';
    }

    if (
        str_contains($val, 'confirm') ||
        str_contains($val, 'approv') ||
        str_contains($val, 'accept') ||
        str_contains($val, 'duyệt') ||
        str_contains($val, 'xác nhận')
    ) {
        if (!str_contains($val, 'chờ') && !str_contains($val, 'pending') && !str_contains($val, 'unconfirmed')) {
            return 'confirmed';
        }
    }

    return $fallback;
}

/**
 * Lấy trạng thái mới nhất từ bảng seller_order_status cho một order_id nếu bảng tồn tại.
 */
function resolve_effective_order_status(PDO $pdo, int $orderId, ?string $baseOrderStatus): string
{
    $baseNormalized = normalize_order_status_value($baseOrderStatus, 'pending');
    if ($baseNormalized === 'cancelled') {
        return 'cancelled';
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT status FROM seller_order_status WHERE order_id = :order_id ORDER BY id DESC LIMIT 1'
        );
        $stmt->execute(['order_id' => $orderId]);
        $row = $stmt->fetch();
        if ($row && !empty($row['status'])) {
            $sellerNormalized = normalize_order_status_value((string) $row['status'], $baseNormalized);
            if ($sellerNormalized !== 'pending') {
                return $sellerNormalized;
            }
        }
    } catch (\Throwable $e) {
        // Bỏ qua nếu cấu trúc bảng seller_order_status khác hoặc không tồn tại
    }

    return $baseNormalized;
}

$customer = require_customer();
$userId = $customer['id'];
$customerStatus = $pdo->prepare('SELECT role, status FROM users WHERE id = :id LIMIT 1');
$customerStatus->execute(['id' => $userId]);
$customerRecord = $customerStatus->fetch();
if (!$customerRecord || $customerRecord['role'] !== 'customer' || $customerRecord['status'] !== 'active') {
    json_error('Tài khoản khách hàng hiện không hoạt động.', 403);
}

// 1. TẠO ĐƠN HÀNG (CHECKOUT)
if ($action === 'create' && $method === 'POST') {
    $items = $rawBody['items'] ?? null;
    $address = $rawBody['shippingAddress'] ?? null;
    $paymentMethod = strtoupper(trim((string) ($rawBody['paymentMethod'] ?? '')));

    if ($paymentMethod === 'VNPAY') {
        $paymentMethod = 'BANK_TRANSFER';
    } elseif ($paymentMethod === 'PAYPAL' || $paymentMethod === 'PAYPAL_SANDBOX') {
        $paymentMethod = 'CREDIT_CARD';
    }

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
                p.id AS product_id, p.name, p.status, p.seller_id, seller.status AS seller_status,
                COALESCE((
                  SELECT fsi.flash_sale_price FROM flash_sale_items fsi
                  JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
                  WHERE fsi.variant_id = v.id AND NOW() BETWEEN fs.start_time AND fs.end_time
                    AND fsi.sold_count < fsi.stock_limit
                  ORDER BY fs.start_time DESC LIMIT 1
                ), v.price) AS effective_price
         FROM product_variants v JOIN products p ON p.id = v.product_id
         LEFT JOIN users seller ON seller.id = p.seller_id
         WHERE v.id = :variant_id FOR UPDATE'
    );

    foreach ($items as $item) {
        $rawVariantId = $item['variantId'] ?? ($item['variant_id'] ?? null);
        $variantId = filter_var($rawVariantId, FILTER_VALIDATE_INT);
        $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
        if ($variantId === false || $variantId < 1 || $quantity === false || $quantity < 1) {
            $pdo->rollBack();
            json_error('Sản phẩm hoặc số lượng đặt mua không hợp lệ.', 422);
        }

        $select->execute(['variant_id' => $variantId]);
        $variant = $select->fetch();
        if (!$variant || $variant['status'] !== 'published'
            || ($variant['seller_id'] !== null && $variant['seller_status'] !== 'active')) {
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

    // COD is confirmed as an order immediately; online payment carts are cleared only after gateway confirmation.
    if ($paymentMethod === 'COD') {
        $cartStmt = $pdo->prepare('SELECT id FROM carts WHERE user_id = :user_id LIMIT 1 FOR UPDATE');
        $cartStmt->execute(['user_id' => $userId]);
        $cartId = $cartStmt->fetchColumn();
        if ($cartId !== false) {
            $variantIds = array_values(array_unique(array_column($lines, 'variant_id')));
            $marks = implode(',', array_fill(0, count($variantIds), '?'));
            $deleteCartItems = $pdo->prepare("DELETE FROM cart_items WHERE cart_id = ? AND variant_id IN ($marks)");
            $deleteCartItems->execute([(int) $cartId, ...$variantIds]);
        }
    }

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
                COALESCE(NULLIF(pay.status, ""), o.payment_status) AS payment_status,
                o.payment_status AS order_payment_status,
                o.order_status, o.shipping_address_snapshot, o.created_at, o.updated_at,
                pay.payment_method, pay.transaction_id, pay.paid_at
         FROM orders o
         LEFT JOIN payments pay ON pay.id = (
             SELECT p2.id FROM payments p2 WHERE p2.order_id = o.id ORDER BY p2.id DESC LIMIT 1
         )
         WHERE o.user_id = :user_id
         ORDER BY o.id DESC, o.created_at DESC'
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
        $orderRowId = (int) $row['id'];
        $itemStmt->execute(['order_id' => $orderRowId]);
        $address = json_decode((string) $row['shipping_address_snapshot'], true);
        $effectivePaymentStatus = ($row['order_payment_status'] === 'paid' || $row['payment_status'] === 'paid')
            ? 'paid'
            : ($row['payment_status'] ?: 'pending');
        $effectiveOrderStatus = resolve_effective_order_status($pdo, $orderRowId, (string) ($row['order_status'] ?? 'pending'));

        $orders[] = [
            'id' => $orderRowId,
            'userId' => (int) $row['user_id'],
            'orderCode' => $row['order_code'],
            'totalAmount' => (float) $row['total_amount'],
            'shippingFee' => (float) $row['shipping_fee'],
            'finalAmount' => (float) $row['final_amount'],
            'paymentStatus' => $effectivePaymentStatus,
            'orderStatus' => $effectiveOrderStatus,
            'paymentMethod' => $row['payment_method'] ?? 'COD',
            'transactionId' => $row['transaction_id'] ?? null,
            'paidAt' => $row['paid_at'] ?? null,
            'shippingAddressSnapshot' => is_array($address) ? $address : [],
            'items' => array_map(static function (array $item) use ($orderRowId): array {
                $attr = json_decode((string) $item['variant_attributes_snapshot'], true);
                return [
                    'id' => (int) $item['id'],
                    'orderId' => $orderRowId,
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
        'SELECT id, order_code, order_status, payment_status FROM orders WHERE id = :id AND user_id = :user_id FOR UPDATE'
    );
    $stmt->execute(['id' => $orderId, 'user_id' => $userId]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        json_error('Không tìm thấy đơn hàng của bạn.', 404);
    }

    $currentEffectiveStatus = resolve_effective_order_status($pdo, $orderId, (string) ($order['order_status'] ?? 'pending'));
    if ($currentEffectiveStatus !== 'pending') {
        $pdo->rollBack();
        json_error('Đơn hàng đã được xác nhận hoặc đang vận chuyển nên không thể tự hủy.', 409);
    }
    if ($order['payment_status'] === 'paid') {
        $pdo->rollBack();
        json_error('Đơn hàng đã thanh toán; vui lòng liên hệ hỗ trợ để xử lý hủy và hoàn tiền.', 409);
    }

    $pdo->prepare('UPDATE orders SET order_status = "cancelled", updated_at = NOW() WHERE id = :id')
        ->execute(['id' => $orderId]);

    try {
        $pdo->prepare('UPDATE seller_order_status SET status = "cancelled" WHERE order_id = :order_id')
            ->execute(['order_id' => $orderId]);
    } catch (\Throwable $e) {
        // Bỏ qua nếu bảng seller_order_status không có cột/bản ghi tương ứng
    }

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
