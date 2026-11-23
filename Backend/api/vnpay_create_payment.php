<?php
declare(strict_types=1);

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
date_default_timezone_set('Asia/Ho_Chi_Minh');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/vnpay_config.php';
require_once dirname(__DIR__) . '/config/database.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput ?: '', true);
if (!is_array($data)) {
    $data = $_POST;
}

$orderCode = trim((string) ($data['orderCode'] ?? $data['order_code'] ?? ''));
$amount = isset($data['amount']) ? (int) round((float) $data['amount']) : 0;

if ($orderCode !== '') {
    try {
        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT id, final_amount FROM orders WHERE order_code = :order_code LIMIT 1');
        $stmt->execute(['order_code' => $orderCode]);
        $order = $stmt->fetch();
        if ($order && (float) $order['final_amount'] > 0) {
            $amount = (int) round((float) $order['final_amount']);
        }
    } catch (Throwable $e) {
        // Bỏ qua nếu chưa tìm thấy đơn trong DB
    }
}

if ($amount <= 0) {
    http_response_code(422);
    echo json_encode([
        'code' => '422',
        'message' => 'Số tiền thanh toán không hợp lệ.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$safeOrderCode = preg_replace('/[^A-Za-z0-9_-]/', '', $orderCode);
$vnp_TxnRef = $safeOrderCode !== ''
    ? $safeOrderCode . '_' . random_int(100, 999)
    : (string) random_int(100000, 999999);

$vnp_OrderInfo = $vnp_TxnRef !== '' ? 'ThanhToan_' . $vnp_TxnRef : 'ThanhToanTechMart';
$vnp_OrderType = 'billpayment';
$vnp_Amount = (string) ($amount * 100);
$vnp_Locale = 'vn';
$vnp_IpAddr = (string) ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');

$configuredReturnUrl = trim((string) ($vnp_Returnurl ?? $vnp_ReturnUrl ?? ''));
if ($configuredReturnUrl === '' || str_contains($configuredReturnUrl, 'localhost:3000')) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $scriptDir = rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/TechMart/Backend/api/vnpay_create_payment.php'))), '/');
    $configuredReturnUrl = $scheme . '://' . $host . $scriptDir . '/vnpay_callback.php';
}

$inputData = [
    'vnp_Version' => '2.1.0',
    'vnp_TmnCode' => (string) ($vnp_TmnCode ?? ''),
    'vnp_Amount' => $vnp_Amount,
    'vnp_Command' => 'pay',
    'vnp_CreateDate' => (string) date('YmdHis'),
    'vnp_CurrCode' => 'VND',
    'vnp_IpAddr' => $vnp_IpAddr,
    'vnp_Locale' => $vnp_Locale,
    'vnp_OrderInfo' => $vnp_OrderInfo,
    'vnp_OrderType' => $vnp_OrderType,
    'vnp_ReturnUrl' => $configuredReturnUrl,
    'vnp_TxnRef' => (string) $vnp_TxnRef,
];

ksort($inputData);
$query = '';
$hashdata = '';
$i = 0;

foreach ($inputData as $key => $value) {
    $encodedKey = urlencode((string) $key);
    $encodedVal = urlencode((string) $value);
    if ($i === 1) {
        $hashdata .= '&' . $encodedKey . '=' . $encodedVal;
    } else {
        $hashdata .= $encodedKey . '=' . $encodedVal;
        $i = 1;
    }
    $query .= $encodedKey . '=' . $encodedVal . '&';
}

$vnpSecureHash = hash_hmac('sha512', $hashdata, (string) ($vnp_HashSecret ?? ''));
$paymentUrl = (string) ($vnp_Url ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html')
    . '?' . $query . 'vnp_SecureHash=' . $vnpSecureHash;

echo json_encode([
    'code' => '00',
    'message' => 'success',
    'txnRef' => $vnp_TxnRef,
    'orderCode' => $safeOrderCode,
    'returnUrl' => $configuredReturnUrl,
    'data' => $paymentUrl,
], JSON_UNESCAPED_UNICODE);
exit;