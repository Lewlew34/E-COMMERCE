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

// 1. GET: Danh sách đơn hàng có chứa sản phẩm của shop
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT o.id, o.user_id, o.order_code, o.total_amount, o.shipping_fee, o.final_amount,
                o.payment_status, o.order_status, o.shipping_address_snapshot, o.created_at, o.updated_at,
                COALESCE(sos.status, o.order_status) AS seller_status,
                sos.tracking_number,
                u.full_name, u.phone,
               (SELECT SUM(oi.total_price) FROM order_items oi
                WHERE oi.order_id = o.id AND oi.seller_id = :seller_id_total) AS seller_total,
               pay.payment_method
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = :seller_id
         LEFT JOIN (SELECT order_id, MAX(payment_method) AS payment_method FROM payments GROUP BY order_id) pay
           ON pay.order_id = o.id
         WHERE EXISTS (SELECT 1 FROM order_items own_items
                       WHERE own_items.order_id = o.id AND own_items.seller_id = :seller_id_orders)
         ORDER BY o.created_at DESC'
    );
    $stmt->execute([
        'seller_id' => $sellerId,
        'seller_id_total' => $sellerId,
        'seller_id_orders' => $sellerId,
    ]);

    $itemsStmt = $pdo->prepare(
        'SELECT oi.id, oi.variant_id, oi.product_name_snapshot, oi.variant_attributes_snapshot,
                oi.price, oi.quantity, oi.total_price, pv.image
         FROM order_items oi JOIN product_variants pv ON pv.id = oi.variant_id
         WHERE oi.order_id = :order_id AND oi.seller_id = :seller_id'
    );

    $orders = [];
    foreach ($stmt->fetchAll() as $row) {
        $itemsStmt->execute(['order_id' => (int) $row['id'], 'seller_id' => $sellerId]);
        $address = json_decode((string) $row['shipping_address_snapshot'], true);

        $orders[] = [
            'id' => (int) $row['id'],
            'userId' => (int) $row['user_id'],
            'orderCode' => $row['order_code'],
            'totalAmount' => (float) $row['seller_total'],
            'shippingFee' => (float) $row['shipping_fee'],
            'finalAmount' => (float) $row['seller_total'],
            'paymentStatus' => $row['payment_status'],
            'orderStatus' => $row['seller_status'],
            'sellerTrackingNumber' => $row['tracking_number'],
            'paymentMethod' => $row['payment_method'] ?? 'COD',
            'shippingAddressSnapshot' => is_array($address) ? $address : [
                'recipientName' => $row['full_name'],
                'phone' => $row['phone'] ?? '',
                'addressLine' => (string) $row['shipping_address_snapshot'],
                'city' => '',
            ],
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
            }, $itemsStmt->fetchAll()),
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    json_success($orders);
}

// 2. PATCH: Cập nhật trạng thái đơn hàng của shop
if ($method === 'PATCH') {
    $orderId = require_positive_int($_GET['id'] ?? null, 'ID đơn hàng');
    $body = get_json_body();
    $nextStatus = (string) ($body['status'] ?? '');

    if (!in_array($nextStatus, ['confirmed', 'shipping', 'delivered', 'cancelled'], true)) {
        json_error('Trạng thái đơn hàng không hợp lệ.', 422);
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'SELECT o.id, o.order_code, COALESCE(sos.status, o.order_status) AS seller_status
         FROM orders o
         LEFT JOIN seller_order_status sos ON sos.order_id = o.id AND sos.seller_id = :seller_id
         WHERE o.id = :order_id
           AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.seller_id = :seller_id_items)'
    );
    $stmt->execute([
        'seller_id' => $sellerId,
        'order_id' => $orderId,
        'seller_id_items' => $sellerId,
    ]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        json_error('Không tìm thấy đơn hàng của gian hàng.', 404);
    }

    $currentStatus = $order['seller_status'];
    $transitions = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['shipping', 'cancelled'],
        'shipping' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    if (!in_array($nextStatus, $transitions[$currentStatus] ?? [], true)) {
        $pdo->rollBack();
        json_error("Không thể chuyển đơn từ trạng thái '$currentStatus' sang '$nextStatus'.", 409);
    }

    $pdo->prepare(
        'INSERT INTO seller_order_status (seller_id, order_id, status, tracking_number)
         VALUES (:seller_id, :order_id, :status, :tracking_number)
         ON DUPLICATE KEY UPDATE status = VALUES(status), tracking_number = VALUES(tracking_number)'
    )->execute([
        'seller_id' => $sellerId,
        'order_id' => $orderId,
        'status' => $nextStatus,
        'tracking_number' => trim((string) ($body['trackingNumber'] ?? '')) ?: null,
    ]);

    if ($nextStatus === 'cancelled') {
        $ownedItems = $pdo->prepare(
            'SELECT oi.variant_id, oi.quantity, v.stock_quantity
             FROM order_items oi JOIN product_variants v ON v.id = oi.variant_id
             WHERE oi.order_id = :order_id AND oi.seller_id = :seller_id FOR UPDATE'
        );
        $ownedItems->execute(['order_id' => $orderId, 'seller_id' => $sellerId]);

        foreach ($ownedItems->fetchAll() as $item) {
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
                'created_by' => $sellerId,
            ]);
        }
    }

    $pdo->commit();
    json_success(null, "Đã cập nhật trạng thái đơn hàng sang '$nextStatus'.");
}

json_error('Phương thức không hỗ trợ.', 405);
