<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');

$vnp_TmnCode = "2QXUI4J4"; 
$vnp_HashSecret = "ANVSRVBSJFHQJZLQXWWIQWLRXDRXWW"; // Khóa chuẩn băm HMAC-SHA512
$vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
$vnp_Returnurl = "http://localhost/E-Commerce/Backend/config/vnpay_return.php";

$amount = 100000;
if (isset($_POST['amount']) && is_numeric($_POST['amount'])) {
    $amount = (int) $_POST['amount'];
} elseif (empty($_POST) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = json_decode(file_get_contents('php://input'), true);
    if (isset($json['amount']) && is_numeric($json['amount'])) {
        $amount = (int) $json['amount'];
    }
}

$vnp_TxnRef = date('YmdHis') . random_int(1000, 9999);
$vnp_OrderInfo = 'Thanh toan don hang E-Commerce';
$vnp_IpAddr = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

$inputData = array(
    "vnp_Version" => "2.1.0",
    "vnp_TmnCode" => $vnp_TmnCode,
    "vnp_Amount" => $amount * 100,
    "vnp_Command" => "pay",
    "vnp_CreateDate" => date('YmdHis'),
    "vnp_CurrCode" => "VND",
    "vnp_IpAddr" => $vnp_IpAddr,
    "vnp_Locale" => "vn",
    "vnp_OrderInfo" => $vnp_OrderInfo,
    "vnp_OrderType" => "billpayment",
    "vnp_ReturnUrl" => $vnp_Returnurl,
    "vnp_TxnRef" => $vnp_TxnRef
);

ksort($inputData);
$query = "";
$i = 0;
$hashdata = "";
foreach ($inputData as $key => $value) {
    if ($i == 1) {
        $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
    } else {
        $hashdata .= urlencode($key) . "=" . urlencode($value);
        $i = 1;
    }
    $query .= urlencode($key) . "=" . urlencode($value) . '&';
}

$vnp_Url = $vnp_Url . "?" . $query;
if (isset($vnp_HashSecret)) {
    $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
    $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
}

header('Location: ' . $vnp_Url);
exit();
?>