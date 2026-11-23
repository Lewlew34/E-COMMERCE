<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Ho_Chi_Minh');

// THÔNG TIN VNPay SANDBOX
$vnp_TmnCode = trim("FAGW2HS7");
$vnp_HashSecret = trim("EQVNKVTAUDQMFTLDLNMPZWIIMZGVTDKW");
$vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

// Trỏ về callback backend để verify chữ ký & cập nhật DB trước khi chuyển về frontend
$vnp_Returnurl = "http://localhost/TechMart/Backend/api/vnpay_callback.php";
$vnp_FrontendUrl = "http://localhost:3000";
?>