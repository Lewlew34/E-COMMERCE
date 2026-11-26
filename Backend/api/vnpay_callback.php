<?php
declare(strict_types=1);

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
date_default_timezone_set('Asia/Ho_Chi_Minh');

require_once __DIR__ . '/vnpay_config.php';
require_once dirname(__DIR__) . '/config/database.php';

$frontendBase = (isset($vnp_FrontendUrl) && is_string($vnp_FrontendUrl) && trim($vnp_FrontendUrl) !== '')
    ? rtrim(trim($vnp_FrontendUrl), '/')
    : 'http://localhost:3000';

$vnpParams = [];
foreach ($_GET as $key => $value) {
    $strKey = (string) $key;
    if (str_starts_with($strKey, 'vnp_')) {
        $vnpParams[$strKey] = (string) $value;
    }
}

$receivedHash = trim((string) ($vnpParams['vnp_SecureHash'] ?? ''));
unset($vnpParams['vnp_SecureHash'], $vnpParams['vnp_SecureHashType']);

ksort($vnpParams);

$hashParts = [];
foreach ($vnpParams as $key => $value) {
    $hashParts[] = urlencode($key) . '=' . urlencode($value);
}
$hashData = implode('&', $hashParts);

$secret = trim((string) ($vnp_HashSecret ?? ''));
$calcHash = ($receivedHash !== '' && $secret !== '')
    ? hash_hmac('sha512', $hashData, $secret)
    : '';
$isValidSignature = $calcHash !== '' && hash_equals(strtolower($calcHash), strtolower($receivedHash));

$txnRef = trim((string) ($vnpParams['vnp_TxnRef'] ?? ''));
$responseCode = trim((string) ($vnpParams['vnp_ResponseCode'] ?? '99'));
$transactionStatus = trim((string) ($vnpParams['vnp_TransactionStatus'] ?? ''));
$transactionNo = trim((string) ($vnpParams['vnp_TransactionNo'] ?? ''));

$isSuccess = $isValidSignature
    && $responseCode === '00'
    && ($transactionStatus === '' || $transactionStatus === '00');

// Tách mã đơn gốc từ TxnRef (ví dụ ORD-20261122-C83C5A_869 -> ORD-20261122-C83C5A)
$orderCode = (string) preg_replace('/_[0-9]+$/', '', $txnRef);

if ($orderCode !== '') {
    try {
        $pdo = get_db_connection();
        $stmt = $pdo->prepare(
            'SELECT id, user_id, order_code, order_status, payment_status
             FROM orders
             WHERE order_code = :order_code
             LIMIT 1'
        );
        $stmt->execute(['order_code' => $orderCode]);
        $order = $stmt->fetch();

        if ($order) {
            $orderId = (int) $order['id'];
            $userId = (int) ($order['user_id'] ?? 0);
            $currentOrderStatus = (string) ($order['order_status'] ?? 'pending');
            $currentPaymentStatus = (string) ($order['payment_status'] ?? 'pending');

            $pdo->beginTransaction();

            if ($isSuccess) {
                $pdo->prepare(
                    'UPDATE orders
                     SET payment_status = :payment_status,
                         updated_at = NOW()
                     WHERE id = :id'
                )->execute([
                    'payment_status' => 'paid',
                    'id' => $orderId,
                ]);

                $pdo->prepare(
                    'UPDATE payments
                     SET status = :status,
                         transaction_id = COALESCE(NULLIF(:txn_id, ""), transaction_id),
                         paid_at = COALESCE(paid_at, NOW())
                     WHERE order_id = :order_id'
                )->execute([
                    'status' => 'paid',
                    'txn_id' => $transactionNo,
                    'order_id' => $orderId,
                ]);

                $cartStmt = $pdo->prepare('SELECT id FROM carts WHERE user_id = :user_id LIMIT 1 FOR UPDATE');
                $cartStmt->execute(['user_id' => $userId]);
                $cartId = $cartStmt->fetchColumn();
                if ($cartId !== false) {
                    $orderVariants = $pdo->prepare('SELECT DISTINCT variant_id FROM order_items WHERE order_id = :order_id');
                    $orderVariants->execute(['order_id' => $orderId]);
                    $variantIds = array_map('intval', $orderVariants->fetchAll(PDO::FETCH_COLUMN));
                    if ($variantIds) {
                        $marks = implode(',', array_fill(0, count($variantIds), '?'));
                        $pdo->prepare("DELETE FROM cart_items WHERE cart_id = ? AND variant_id IN ($marks)")
                            ->execute([(int) $cartId, ...$variantIds]);
                    }
                }
            } elseif ($responseCode !== '00') {
                $shouldRestoreStock = ($currentOrderStatus === 'pending' && $currentPaymentStatus !== 'failed');
                $nextOrderStatus = ($currentOrderStatus === 'pending') ? 'cancelled' : $currentOrderStatus;

                $pdo->prepare(
                    'UPDATE orders
                     SET payment_status = :payment_status,
                         order_status = :order_status,
                         updated_at = NOW()
                     WHERE id = :id'
                )->execute([
                    'payment_status' => 'failed',
                    'order_status' => $nextOrderStatus,
                    'id' => $orderId,
                ]);

                $pdo->prepare(
                    'UPDATE payments
                     SET status = :status,
                         transaction_id = COALESCE(NULLIF(:txn_id, ""), transaction_id)
                     WHERE order_id = :order_id'
                )->execute([
                    'status' => 'failed',
                    'txn_id' => $transactionNo,
                    'order_id' => $orderId,
                ]);

                if ($shouldRestoreStock) {
                    $itemsStmt = $pdo->prepare(
                        'SELECT oi.variant_id, oi.quantity, pv.stock_quantity
                         FROM order_items oi
                         JOIN product_variants pv ON pv.id = oi.variant_id
                         WHERE oi.order_id = :order_id
                         FOR UPDATE'
                    );
                    $itemsStmt->execute(['order_id' => $orderId]);

                    foreach ($itemsStmt->fetchAll() as $item) {
                        $variantId = (int) $item['variant_id'];
                        $qty = (int) $item['quantity'];
                        $prevStock = (int) $item['stock_quantity'];
                        $restoredStock = $prevStock + $qty;

                        $pdo->prepare('UPDATE product_variants SET stock_quantity = :stock WHERE id = :variant_id')
                            ->execute([
                                'stock' => $restoredStock,
                                'variant_id' => $variantId,
                            ]);

                        try {
                            $pdo->prepare(
                                'INSERT INTO inventory_logs (variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by)
                                 VALUES (:variant_id, "return", :quantity, :previous_stock, :new_stock, :reference_id, :created_by)'
                            )->execute([
                                'variant_id' => $variantId,
                                'quantity' => $qty,
                                'previous_stock' => $prevStock,
                                'new_stock' => $restoredStock,
                                'reference_id' => (string) $order['order_code'],
                                'created_by' => $userId > 0 ? $userId : null,
                            ]);
                        } catch (Throwable $e) {
                            // Bỏ qua nếu bảng inventory_logs không có
                        }
                    }
                }
            }

            $pdo->commit();
        }
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }
}

$queryString = http_build_query($_GET);
$targetPath = $isSuccess ? '/order-success' : '/order-failed';
$redirectUrl = $frontendBase . $targetPath . ($queryString !== '' ? '?' . $queryString : '');

header('Location: ' . $redirectUrl);
exit;
