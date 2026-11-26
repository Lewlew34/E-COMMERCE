<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/cors.php';
require_once dirname(__DIR__) . '/core/auth_guard.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);

function send_paypal_json(array $payload, int $statusCode = 200): void
{
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    send_paypal_json([
        'success' => false,
        'message' => "Lỗi PHP ($file:$line): $message",
    ], 500);
});

set_exception_handler(static function (\Throwable $e): void {
    send_paypal_json([
        'success' => false,
        'message' => 'Lỗi hệ thống khi xác thực PayPal: ' . $e->getMessage(),
    ], 500);
});

$candidateDbPaths = [
    dirname(__DIR__, 2) . '/config/database.php',
    dirname(__DIR__) . '/config/database.php',
    dirname(__DIR__, 3) . '/config/database.php',
    dirname(__DIR__, 2) . '/Backend/config/database.php',
];

$loadedDbPath = null;
foreach ($candidateDbPaths as $path) {
    if (is_file($path)) {
        require_once $path;
        $loadedDbPath = $path;
        break;
    }
}

if ($loadedDbPath === null) {
    send_paypal_json([
        'success' => false,
        'message' => 'Không tìm thấy file database.php tại các đường dẫn dự kiến.',
    ], 500);
}

function resolve_paypal_pdo(): PDO
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
    throw new \RuntimeException('Không tìm thấy kết nối PDO hợp lệ từ file database.php.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    send_paypal_json(['success' => false, 'message' => 'Phương thức không hỗ trợ.'], 405);
}

$customer = require_customer();

$rawBody = file_get_contents('php://input');
$input = json_decode((string) $rawBody, true);
if (!is_array($input)) {
    $input = $_POST;
}

$paypalOrderId = trim((string) ($input['orderID'] ?? $input['paypalOrderId'] ?? ''));
$internalOrderRef = $input['internalOrderId'] ?? ($input['orderId'] ?? ($input['orderCode'] ?? null));

if ($paypalOrderId === '') {
    send_paypal_json(['success' => false, 'message' => 'Thiếu mã giao dịch PayPal (orderID).'], 422);
}

if ($internalOrderRef === null || trim((string) $internalOrderRef) === '') {
    send_paypal_json(['success' => false, 'message' => 'Thiếu mã đơn hàng cần xác thực.'], 422);
}

$pdo = resolve_paypal_pdo();
$customerStatus = $pdo->prepare('SELECT role, status FROM users WHERE id = :id LIMIT 1');
$customerStatus->execute(['id' => $customer['id']]);
$customerRecord = $customerStatus->fetch();
if (!$customerRecord || $customerRecord['role'] !== 'customer' || $customerRecord['status'] !== 'active') {
    send_paypal_json(['success' => false, 'message' => 'Tài khoản khách hàng hiện không hoạt động.'], 403);
}

$orderStmt = ctype_digit((string) $internalOrderRef)
    ? $pdo->prepare('SELECT id, order_code, final_amount, payment_status, order_status FROM orders WHERE id = :ref AND user_id = :user_id LIMIT 1')
    : $pdo->prepare('SELECT id, order_code, final_amount, payment_status, order_status FROM orders WHERE order_code = :ref AND user_id = :user_id LIMIT 1');
$orderStmt->execute(['ref' => (string) $internalOrderRef, 'user_id' => $customer['id']]);
$ownedOrder = $orderStmt->fetch();
if (!$ownedOrder) {
    send_paypal_json(['success' => false, 'message' => 'Không tìm thấy đơn hàng của bạn.'], 404);
}
if ($ownedOrder['payment_status'] !== 'pending' || $ownedOrder['order_status'] !== 'pending') {
    send_paypal_json(['success' => false, 'message' => 'Đơn hàng không còn đủ điều kiện thanh toán.'], 409);
}

$clientId = trim((string) ($_ENV['PAYPAL_CLIENT_ID'] ?? getenv('PAYPAL_CLIENT_ID') ?: ''));
$secret = trim((string) ($_ENV['PAYPAL_SECRET'] ?? getenv('PAYPAL_SECRET') ?: ''));
$paypalEnv = strtolower(trim((string) ($_ENV['PAYPAL_ENV'] ?? getenv('PAYPAL_ENV') ?: 'sandbox')));
$paypalBaseUrl = $paypalEnv === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

$isLocalSandboxSim = str_starts_with($paypalOrderId, 'PAYPAL-SBX-');
$appEnv = strtolower(trim((string) ($_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production')));
$localSimulationEnabled = filter_var(
    $_ENV['PAYPAL_LOCAL_SIMULATION'] ?? getenv('PAYPAL_LOCAL_SIMULATION') ?: 'false',
    FILTER_VALIDATE_BOOLEAN
);
$allowLocalSandboxSimulation = $isLocalSandboxSim
    && $paypalEnv === 'sandbox'
    && $appEnv !== 'production'
    && $localSimulationEnabled;

$payerEmail = 'sandbox-buyer@example.com';
$grossAmount = 0.0;
$currency = 'USD';
$captureId = $paypalOrderId;
$customRef = null;

if ($allowLocalSandboxSimulation && ($clientId === '' || $secret === '')) {
    $currency = 'VND';
} else {
    if ($clientId === '' || $secret === '') {
        send_paypal_json([
            'success' => false,
            'message' => 'Chưa cấu hình PAYPAL_CLIENT_ID và PAYPAL_SECRET trên backend.',
        ], 500);
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "$paypalBaseUrl/v1/oauth2/token",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_USERPWD => "$clientId:$secret",
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Accept-Language: en_US',
        ],
        CURLOPT_TIMEOUT => 20,
    ]);
    $tokenRaw = curl_exec($ch);
    $curlErr = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($tokenRaw === false || $curlErr !== '' || $httpCode >= 400) {
        send_paypal_json([
            'success' => false,
            'message' => 'Không thể kết nối tới cổng thanh toán PayPal.',
        ], 502);
    }

    $tokenData = json_decode((string) $tokenRaw, true);
    $accessToken = $tokenData['access_token'] ?? null;
    if (!is_string($accessToken) || $accessToken === '') {
        send_paypal_json([
            'success' => false,
            'message' => 'Không nhận được access token từ PayPal.',
        ], 502);
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "$paypalBaseUrl/v2/checkout/orders/" . rawurlencode($paypalOrderId),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer $accessToken",
        ],
        CURLOPT_TIMEOUT => 20,
    ]);
    $orderRaw = curl_exec($ch);
    $orderCurlErr = curl_error($ch);
    $orderHttpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($orderRaw === false || $orderCurlErr !== '' || $orderHttpCode >= 400) {
        send_paypal_json([
            'success' => false,
            'message' => 'Không thể xác thực chi tiết giao dịch với PayPal.',
        ], 502);
    }

    $orderDetails = json_decode((string) $orderRaw, true);
    $paypalStatus = strtoupper((string) ($orderDetails['status'] ?? ''));

    if ($paypalStatus !== 'COMPLETED') {
        send_paypal_json([
            'success' => false,
            'status' => $paypalStatus ?: 'UNKNOWN',
            'message' => 'Giao dịch chưa hoàn tất hoặc chưa được xác nhận thành công trên PayPal.',
        ], 400);
    }

    $payerEmail = (string) ($orderDetails['payer']['email_address'] ?? '');
    $purchaseUnit = $orderDetails['purchase_units'][0] ?? [];
    $grossAmount = (float) ($purchaseUnit['amount']['value'] ?? 0);
    $currency = strtoupper((string) ($purchaseUnit['amount']['currency_code'] ?? 'USD'));
    $captureId = (string) ($purchaseUnit['payments']['captures'][0]['id'] ?? $paypalOrderId);
    $customRef = $purchaseUnit['custom_id']
        ?? ($purchaseUnit['invoice_id'] ?? ($purchaseUnit['reference_id'] ?? null));
}

if ($isLocalSandboxSim && !$allowLocalSandboxSimulation) {
    send_paypal_json(['success' => false, 'message' => 'Thanh toán mô phỏng PayPal chưa được bật cho môi trường này.'], 403);
}

if (!$allowLocalSandboxSimulation
    && ($customRef === null || !in_array((string) $customRef, [(string) $ownedOrder['id'], (string) $ownedOrder['order_code']], true))) {
    send_paypal_json(['success' => false, 'message' => 'Giao dịch PayPal không khớp với đơn hàng cần thanh toán.'], 409);
}

if (!$allowLocalSandboxSimulation) {
    $expectedUsd = max(1, round((float) $ownedOrder['final_amount'] / 25000, 2));
    if ($currency !== 'USD' || abs($grossAmount - $expectedUsd) > 0.01) {
        send_paypal_json(['success' => false, 'message' => 'Số tiền PayPal không khớp với tổng tiền đơn hàng.'], 409);
    }
}

$pdo->beginTransaction();

try {
    $lockOrder = $pdo->prepare(
        'SELECT id, order_code, final_amount, payment_status, order_status
         FROM orders WHERE id = :id AND user_id = :user_id LIMIT 1 FOR UPDATE'
    );
    $lockOrder->execute(['id' => (int) $ownedOrder['id'], 'user_id' => $customer['id']]);
    $orderRow = $lockOrder->fetch();
    if (!$orderRow || $orderRow['payment_status'] !== 'pending' || $orderRow['order_status'] !== 'pending') {
        throw new \RuntimeException('Đơn hàng đã thay đổi hoặc không còn đủ điều kiện thanh toán.');
    }

    $dbOrderId = (int) $orderRow['id'];
    $amountToSave = (float) $orderRow['final_amount'];
    $nextOrderStatus = ($orderRow['order_status'] === 'pending') ? 'confirmed' : (string) $orderRow['order_status'];
    $updOrder = $pdo->prepare(
        'UPDATE orders
         SET payment_status = :payment_status,
             order_status = :order_status,
             updated_at = NOW()
         WHERE id = :id AND user_id = :user_id'
    );
    $updOrder->execute([
        'payment_status' => 'paid',
        'order_status' => $nextOrderStatus,
        'id' => $dbOrderId,
        'user_id' => $customer['id'],
    ]);

    try {
        $payCheck = $pdo->prepare('SELECT id FROM payments WHERE order_id = :order_id ORDER BY id DESC LIMIT 1');
        $payCheck->execute(['order_id' => $dbOrderId]);
        $existingPay = $payCheck->fetch();

        if ($existingPay) {
            $pdo->prepare(
                'UPDATE payments
                 SET payment_method = :method,
                     status = :status,
                     transaction_id = :tx_id,
                     amount = :amount,
                     paid_at = NOW()
                 WHERE id = :id'
            )->execute([
                'method' => 'PAYPAL',
                'status' => 'paid',
                'tx_id' => $captureId,
                'amount' => $amountToSave,
                'id' => (int) $existingPay['id'],
            ]);
        } else {
            $pdo->prepare(
                'INSERT INTO payments (order_id, payment_method, amount, status, transaction_id, paid_at)
                 VALUES (:order_id, :method, :amount, :status, :tx_id, NOW())'
            )->execute([
                'order_id' => $dbOrderId,
                'method' => 'PAYPAL',
                'amount' => $amountToSave,
                'status' => 'paid',
                'tx_id' => $captureId,
            ]);
        }
    } catch (\Throwable $e) {
        // Bỏ qua nếu schema bảng payments khác
    }

    try {
        $transStmt = $pdo->prepare(
            'INSERT INTO transactions (order_id, gateway, transaction_id, amount, currency, payer_email, status, created_at)
             VALUES (:order_id, :gateway, :transaction_id, :amount, :currency, :payer_email, :status, NOW())'
        );
        $transStmt->execute([
            'order_id' => $dbOrderId,
            'gateway' => 'PayPal',
            'transaction_id' => $captureId,
            'amount' => $grossAmount > 0 ? $grossAmount : $amountToSave,
            'currency' => $currency,
            'payer_email' => $payerEmail,
            'status' => 'success',
        ]);
    } catch (\Throwable $e) {
        // Bỏ qua nếu bảng transactions không tồn tại
    }

    $pdo->commit();

    send_paypal_json([
        'success' => true,
        'message' => 'Xác thực thanh toán PayPal thành công từ Backend!',
        'orderID' => $paypalOrderId,
        'captureId' => $captureId,
        'orderId' => $dbOrderId,
        'orderCode' => $orderRow['order_code'],
        'paymentStatus' => 'paid',
    ]);
} catch (\Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    send_paypal_json([
        'success' => false,
        'message' => 'Lỗi lưu dữ liệu thanh toán PayPal vào hệ thống: ' . $e->getMessage(),
    ], 500);
}
