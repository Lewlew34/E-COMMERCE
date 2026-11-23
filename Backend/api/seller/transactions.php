<?php
declare(strict_types=1);

session_start();

$candidateDbPaths = [
    dirname(__DIR__, 2) . '/config/database.php',
    dirname(__DIR__, 2) . '/config/db.php',
    dirname(__DIR__) . '/config/database.php',
    dirname(__DIR__) . '/config/db.php',
    dirname(__DIR__, 3) . '/config/database.php',
    dirname(__DIR__, 2) . '/Backend/config/database.php',
];

foreach ($candidateDbPaths as $path) {
    if (is_file($path)) {
        require_once $path;
        break;
    }
}

function get_seller_pdo(): PDO
{
    foreach (['get_db_connection', 'getPDO', 'getConnection', 'db'] as $fn) {
        if (function_exists($fn)) {
            $conn = $fn();
            if ($conn instanceof PDO) {
                return $conn;
            }
        }
    }
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
        return $GLOBALS['pdo'];
    }
    throw new \RuntimeException('Không tìm thấy kết nối PDO hợp lệ.');
}

function get_table_columns(PDO $pdo, string $table): array
{
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `{$table}`");
        $cols = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            if (!empty($row['Field'])) {
                $cols[(string) $row['Field']] = true;
            }
        }
        return $cols;
    } catch (\Throwable $e) {
        return [];
    }
}

function format_payment_method(?string $raw): string
{
    $key = strtoupper(trim((string) $raw));
    if ($key === '') {
        return 'COD';
    }
    if (str_contains($key, 'PAYPAL')) {
        return 'PayPal Sandbox';
    }
    if (str_contains($key, 'VNPAY')) {
        return 'VNPay QR Sandbox';
    }
    if (str_contains($key, 'COD')) {
        return 'COD';
    }
    return trim((string) $raw);
}

function format_payment_status(?string $raw): array
{
    $key = strtolower(trim((string) $raw));
    if (in_array($key, ['paid', 'completed', 'success', 'succeeded', 'captured', 'da_thanh_toan'], true)) {
        return ['label' => 'Đã thanh toán', 'badge' => 'success', 'is_paid' => true];
    }
    if (in_array($key, ['failed', 'cancelled', 'canceled', 'refunded', 'error'], true)) {
        return ['label' => 'Thất bại / Đã hủy', 'badge' => 'danger', 'is_paid' => false];
    }
    return ['label' => 'Chờ thanh toán', 'badge' => 'warning text-dark', 'is_paid' => false];
}

$hasExplicitSellerParam = isset($_GET['seller_id']) && $_GET['seller_id'] !== '';
$showAll = isset($_GET['all']) && $_GET['all'] === '1';
$sellerId = (int) ($_GET['seller_id'] ?? $_SESSION['seller_id'] ?? $_SESSION['user_id'] ?? 1);
$transactions = [];
$errorMessage = null;
$filterModeLabel = $showAll ? 'Tất cả gian hàng' : "Seller ID: #{$sellerId}";
$sellerDashboardUrl = 'http://localhost:3000/seller/dashboard';

try {
    $pdo = get_seller_pdo();

    $orderCols = get_table_columns($pdo, 'orders');
    $orderItemCols = get_table_columns($pdo, 'order_items');
    $productCols = get_table_columns($pdo, 'products');
    $variantCols = get_table_columns($pdo, 'product_variants');
    $paymentCols = get_table_columns($pdo, 'payments');
    $txCols = get_table_columns($pdo, 'transactions');

    $orderCodeExpr = isset($orderCols['order_code']) ? 'MAX(o.order_code)' : 'CAST(o.id AS CHAR)';
    $customerExpr = isset($orderCols['customer_name'])
        ? 'MAX(o.customer_name)'
        : (isset($orderCols['receiver_name'])
            ? 'MAX(o.receiver_name)'
            : (isset($orderCols['full_name']) ? 'MAX(o.full_name)' : "'Khách lẻ'"));

    $orderAmountExpr = isset($orderCols['final_amount']) && isset($orderCols['total_amount'])
        ? 'MAX(COALESCE(NULLIF(o.final_amount, 0), o.total_amount))'
        : (isset($orderCols['final_amount'])
            ? 'MAX(o.final_amount)'
            : (isset($orderCols['total_amount']) ? 'MAX(o.total_amount)' : '0'));

    $sellerSubtotalExpr = '0';
    if (!empty($orderItemCols)) {
        $qtyCol = isset($orderItemCols['quantity']) ? 'oi.quantity' : '1';
        $priceCol = isset($orderItemCols['price'])
            ? 'oi.price'
            : (isset($orderItemCols['unit_price'])
                ? 'oi.unit_price'
                : (isset($orderItemCols['total_price']) ? 'oi.total_price' : '0'));
        $sellerSubtotalExpr = ($priceCol === 'oi.total_price')
            ? "COALESCE(SUM({$priceCol}), 0)"
            : "COALESCE(SUM({$qtyCol} * {$priceCol}), 0)";
    }

    $joinOrderItems = '';
    $joinVariants = '';
    $joinProducts = '';
    $sellerColRef = null;

    if (!empty($orderItemCols) && isset($orderItemCols['order_id'])) {
        $joinOrderItems = 'LEFT JOIN order_items oi ON o.id = oi.order_id';

        if (isset($orderItemCols['product_id']) && !empty($productCols)) {
            $joinProducts = 'LEFT JOIN products p ON oi.product_id = p.id';
            if (isset($productCols['seller_id'])) {
                $sellerColRef = 'p.seller_id';
            }
        } elseif (isset($orderItemCols['variant_id']) && !empty($variantCols) && !empty($productCols)) {
            $joinVariants = 'LEFT JOIN product_variants pv ON oi.variant_id = pv.id';
            if (isset($variantCols['product_id'])) {
                $joinProducts = 'LEFT JOIN products p ON pv.product_id = p.id';
                if (isset($productCols['seller_id'])) {
                    $sellerColRef = 'p.seller_id';
                }
            }
        } elseif (isset($orderItemCols['product_variant_id']) && !empty($variantCols) && !empty($productCols)) {
            $joinVariants = 'LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id';
            if (isset($variantCols['product_id'])) {
                $joinProducts = 'LEFT JOIN products p ON pv.product_id = p.id';
                if (isset($productCols['seller_id'])) {
                    $sellerColRef = 'p.seller_id';
                }
            }
        } elseif (isset($orderItemCols['seller_id'])) {
            $sellerColRef = 'oi.seller_id';
        }
    } elseif (isset($orderCols['seller_id'])) {
        $sellerColRef = 'o.seller_id';
    }

    $joinPayments = '';
    $payMethodExpr = 'NULL';
    $payTxnExpr = 'NULL';
    $payStatusExpr = 'NULL';
    $payTimeExpr = 'NULL';

    if (!empty($paymentCols)) {
        $joinPayments = 'LEFT JOIN payments pay ON pay.id = (SELECT p2.id FROM payments p2 WHERE p2.order_id = o.id ORDER BY p2.id DESC LIMIT 1)';
        if (isset($paymentCols['payment_method'])) {
            $payMethodExpr = 'pay.payment_method';
        }
        if (isset($paymentCols['transaction_id'])) {
            $payTxnExpr = 'pay.transaction_id';
        } elseif (isset($paymentCols['txn_id'])) {
            $payTxnExpr = 'pay.txn_id';
        }
        if (isset($paymentCols['status'])) {
            $payStatusExpr = 'pay.status';
        }
        if (isset($paymentCols['paid_at'])) {
            $payTimeExpr = 'pay.paid_at';
        } elseif (isset($paymentCols['created_at'])) {
            $payTimeExpr = 'pay.created_at';
        }
    }

    $joinTx = '';
    $txGatewayExpr = 'NULL';
    $txIdExpr = 'NULL';
    $txStatusExpr = 'NULL';
    $txTimeExpr = 'NULL';

    if (!empty($txCols)) {
        $joinTx = 'LEFT JOIN transactions tx ON tx.id = (SELECT t2.id FROM transactions t2 WHERE t2.order_id = o.id ORDER BY t2.id DESC LIMIT 1)';
        if (isset($txCols['gateway'])) {
            $txGatewayExpr = 'tx.gateway';
        }
        if (isset($txCols['transaction_id'])) {
            $txIdExpr = 'tx.transaction_id';
        } elseif (isset($txCols['txn_id'])) {
            $txIdExpr = 'tx.txn_id';
        }
        if (isset($txCols['status'])) {
            $txStatusExpr = 'tx.status';
        }
        if (isset($txCols['created_at'])) {
            $txTimeExpr = 'tx.created_at';
        }
    }

    $orderPayMethodCol = isset($orderCols['payment_method']) ? 'o.payment_method' : 'NULL';
    $orderTxnCol = isset($orderCols['transaction_id'])
        ? 'o.transaction_id'
        : (isset($orderCols['txn_id']) ? 'o.txn_id' : 'NULL');
    $orderPayStatusCol = isset($orderCols['payment_status']) ? 'o.payment_status' : 'NULL';
    $orderCreatedCol = isset($orderCols['created_at']) ? 'o.created_at' : 'NOW()';
    $orderUpdatedCol = isset($orderCols['updated_at']) ? 'o.updated_at' : $orderCreatedCol;

    $rawMethodExpr = "MAX(COALESCE(NULLIF({$payMethodExpr}, ''), NULLIF({$txGatewayExpr}, ''), NULLIF({$orderPayMethodCol}, ''), 'COD'))";
    $txnIdExpr = "MAX(COALESCE(NULLIF({$txIdExpr}, ''), NULLIF({$payTxnExpr}, ''), NULLIF({$orderTxnCol}, '')))";
    $rawStatusExpr = "MAX(COALESCE(NULLIF({$orderPayStatusCol}, ''), NULLIF({$payStatusExpr}, ''), NULLIF({$txStatusExpr}, ''), 'pending'))";
    $timeExpr = "MAX(COALESCE({$payTimeExpr}, {$txTimeExpr}, {$orderUpdatedCol}, {$orderCreatedCol}))";
    $createdExpr = "MAX({$orderCreatedCol})";

    $runQuery = static function (string $whereSql, array $params) use (
        $pdo,
        $orderCodeExpr,
        $customerExpr,
        $rawMethodExpr,
        $orderAmountExpr,
        $sellerSubtotalExpr,
        $txnIdExpr,
        $rawStatusExpr,
        $timeExpr,
        $createdExpr,
        $joinOrderItems,
        $joinVariants,
        $joinProducts,
        $joinPayments,
        $joinTx
    ): array {
        $sql = "
            SELECT
                o.id,
                {$orderCodeExpr} AS order_code,
                {$customerExpr} AS customer_name,
                {$rawMethodExpr} AS raw_payment_method,
                {$orderAmountExpr} AS total_amount,
                {$sellerSubtotalExpr} AS seller_amount,
                {$txnIdExpr} AS transaction_id,
                {$rawStatusExpr} AS raw_payment_status,
                {$timeExpr} AS transaction_time,
                {$createdExpr} AS created_at
            FROM orders o
            {$joinOrderItems}
            {$joinVariants}
            {$joinProducts}
            {$joinPayments}
            {$joinTx}
            WHERE {$whereSql}
            GROUP BY o.id
            ORDER BY transaction_time DESC, o.id DESC
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    };

    $rows = [];
    if (!$showAll && $sellerColRef !== null) {
        $rows = $runQuery("{$sellerColRef} = :seller_id", ['seller_id' => $sellerId]);
        if (empty($rows) && !$hasExplicitSellerParam) {
            $rows = $runQuery('1=1', []);
            $filterModeLabel = "Tất cả gian hàng (Seller #{$sellerId} chưa có đơn)";
        }
    } else {
        $rows = $runQuery('1=1', []);
        $filterModeLabel = 'Tất cả gian hàng';
    }

    foreach ($rows as $row) {
        $methodLabel = format_payment_method($row['raw_payment_method'] ?? null);
        $statusInfo = format_payment_status($row['raw_payment_status'] ?? null);
        $sellerAmt = (float) ($row['seller_amount'] ?? 0);
        $totalAmt = (float) ($row['total_amount'] ?? 0);

        $transactions[] = [
            'id' => (int) $row['id'],
            'order_code' => (string) ($row['order_code'] ?? ('#' . $row['id'])),
            'customer_name' => (string) ($row['customer_name'] ?? 'Khách lẻ'),
            'payment_method' => $methodLabel,
            'raw_payment_method' => (string) ($row['raw_payment_method'] ?? ''),
            'amount' => $sellerAmt > 0 ? $sellerAmt : $totalAmt,
            'seller_amount' => $sellerAmt,
            'total_amount' => $totalAmt,
            'transaction_id' => !empty($row['transaction_id']) ? (string) $row['transaction_id'] : null,
            'payment_status' => $statusInfo['label'],
            'raw_payment_status' => (string) ($row['raw_payment_status'] ?? ''),
            'is_paid' => $statusInfo['is_paid'],
            'badge_class' => $statusInfo['badge'],
            'transaction_time' => (string) ($row['transaction_time'] ?? $row['created_at'] ?? ''),
        ];
    }
} catch (\Throwable $e) {
    $errorMessage = $e->getMessage();
}

if (($_GET['format'] ?? '') === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => $errorMessage === null,
        'seller_id' => $sellerId,
        'filter_mode' => $filterModeLabel,
        'data' => $transactions,
        'message' => $errorMessage,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Lịch Sử Thanh Toán - Seller Dashboard</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
    <div class="container mt-5">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div class="d-flex align-items-center gap-3">
                <a href="<?php echo htmlspecialchars($sellerDashboardUrl); ?>" class="btn btn-outline-secondary btn-sm">
                    &larr; Quay lại Seller Dashboard
                </a>
                <h2 class="text-primary m-0">Quản Lý Lịch Sử Thanh Toán (Seller Dashboard)</h2>
            </div>
            <span class="text-muted small"><?php echo htmlspecialchars($filterModeLabel); ?></span>
        </div>

        <?php if ($errorMessage !== null): ?>
            <div class="alert alert-danger">Lỗi tải dữ liệu: <?php echo htmlspecialchars($errorMessage); ?></div>
        <?php endif; ?>

        <div class="card shadow-sm">
            <div class="card-body">
                <table class="table table-bordered table-hover align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th>Mã Đơn</th>
                            <th>Khách Hàng</th>
                            <th>Phương Thức</th>
                            <th>Số Tiền</th>
                            <th>Mã Giao Dịch (Transaction ID)</th>
                            <th>Thời Gian</th>
                            <th>Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (count($transactions) > 0): ?>
                            <?php foreach ($transactions as $tx): ?>
                                <tr>
                                    <td><strong><?php echo htmlspecialchars($tx['order_code']); ?></strong></td>
                                    <td><?php echo htmlspecialchars($tx['customer_name']); ?></td>
                                    <td>
                                        <span class="badge bg-info text-dark">
                                            <?php echo htmlspecialchars($tx['payment_method']); ?>
                                        </span>
                                    </td>
                                    <td class="fw-bold text-danger">
                                        <?php echo number_format((float) $tx['amount'], 0, ',', '.'); ?> đ
                                    </td>
                                    <td>
                                        <code><?php echo htmlspecialchars($tx['transaction_id'] ?? 'Chưa có'); ?></code>
                                    </td>
                                    <td><?php echo htmlspecialchars($tx['transaction_time']); ?></td>
                                    <td>
                                        <span class="badge bg-<?php echo htmlspecialchars($tx['badge_class']); ?>">
                                            <?php echo htmlspecialchars($tx['payment_status']); ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="7" class="text-center text-muted">Chưa có giao dịch nào thuộc gian hàng này.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>