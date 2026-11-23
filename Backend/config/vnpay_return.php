<?php

require_once __DIR__ . '/env.php';

$vnp_SecureHash = $_GET['vnp_SecureHash'] ?? '';
$inputData = array();

foreach ($_GET as $key => $value) {
    if ($key != "vnp_SecureHash" && $key != "vnp_SecureHashType") {
        $inputData[$key] = $value;
    }
}

ksort($inputData);
$hashData = "";
$i = 0;
foreach ($inputData as $key => $value) {
    if ($i == 1) {
        $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
    } else {
        $hashData .= urlencode($key) . "=" . urlencode($value);
        $i = 1;
    }
}

$secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

// Xác thực chữ ký và kiểm tra mã phản hồi ('00' là thành công)
if ($secureHash == $vnp_SecureHash) {
    if ($_GET['vnp_ResponseCode'] == '00') {
        $orderId = $_GET['vnp_TxnRef'];
        $amount = $_GET['vnp_Amount'] / 100;
        $transactionNo = $_GET['vnp_TransactionNo'];

        // Chuyển hướng về trang thành công trên React kèm thông tin đơn hàng
        header("Location: http://localhost:3000/order-success?status=success&orderId=$orderId&amount=$amount&transactionNo=$transactionNo");
        exit();
    } else {
        // Giao dịch không thành công hoặc bị hủy
        header("Location: http://localhost:3000/order-success?status=failed");
        exit();
    }
} else {
    echo "Lỗi xác thực chữ ký bảo mật (Invalid Signature)!";
}

?>