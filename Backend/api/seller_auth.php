<?php
require_once __DIR__ . '/_seller_common.php';

$action = $_GET['action'] ?? '';

if ($action === 'me' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (empty($_SESSION['auth_user_id'])) {
        seller_json(['status' => 'success', 'user' => null]);
    }

    $stmt = seller_db()->prepare(
        'SELECT id, full_name, email, phone, role, status, shop_name, created_at
         FROM users WHERE id = :id AND status = "active"'
    );
    $stmt->execute(['id' => (int) $_SESSION['auth_user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        $_SESSION = [];
        session_destroy();
        seller_json(['status' => 'success', 'user' => null]);
    }
    seller_json(['status' => 'success', 'user' => seller_public_user($user)]);
}

if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    seller_json(['status' => 'success']);
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = seller_body();
    $email = filter_var(trim((string) ($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    $password = (string) ($body['password'] ?? '');
    if (!$email || $password === '') {
        seller_json(['status' => 'error', 'message' => 'Email hoặc mật khẩu không hợp lệ.'], 422);
    }

    $stmt = seller_db()->prepare(
        'SELECT id, full_name, email, phone, password_hash, role, status, shop_name, created_at
         FROM users WHERE email = :email LIMIT 1'
    );
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        seller_json(['status' => 'error', 'message' => 'Email hoặc mật khẩu không đúng.'], 401);
    }
    if ($user['status'] !== 'active') {
        seller_json(['status' => 'error', 'message' => 'Tài khoản chưa được kích hoạt.'], 403);
    }

    session_regenerate_id(true);
    $_SESSION['auth_user_id'] = (int) $user['id'];
    $_SESSION['auth_role'] = $user['role'];
    if (in_array($user['role'], ['staff', 'seller'], true)) {
        $_SESSION['seller_user_id'] = (int) $user['id'];
        $_SESSION['seller_role'] = $user['role'];
    } else {
        unset($_SESSION['seller_user_id'], $_SESSION['seller_role']);
    }
    seller_json(['status' => 'success', 'user' => seller_public_user($user)]);
}

if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = seller_body();
    $name = trim((string) ($body['name'] ?? ''));
    $shopName = trim((string) ($body['shopName'] ?? ''));
    $email = filter_var(trim((string) ($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    $phone = trim((string) ($body['phone'] ?? ''));
    $address = trim((string) ($body['address'] ?? ''));
    $category = trim((string) ($body['category'] ?? ''));
    $password = (string) ($body['password'] ?? '');

    if ($name === '' || $shopName === '' || !$email || $phone === '' || $address === '' || $category === '' || strlen($password) < 8) {
        seller_json(['status' => 'error', 'message' => 'Vui lòng điền đủ thông tin; mật khẩu cần tối thiểu 8 ký tự.'], 422);
    }

    $pdo = seller_db();
    $stmt = $pdo->prepare(
        'INSERT INTO users (email, password_hash, full_name, phone, role, status, shop_name, shop_address, business_category)
         VALUES (:email, :password_hash, :full_name, :phone, "staff", "active", :shop_name, :shop_address, :business_category)'
    );
    try {
        $stmt->execute([
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'full_name' => $name,
            'phone' => $phone,
            'shop_name' => $shopName,
            'shop_address' => $address,
            'business_category' => $category,
        ]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') {
            seller_json(['status' => 'error', 'message' => 'Email này đã được đăng ký.'], 409);
        }
        throw $error;
    }

    $userId = (int) $pdo->lastInsertId();
    session_regenerate_id(true);
    $_SESSION['auth_user_id'] = $userId;
    $_SESSION['auth_role'] = 'staff';
    $_SESSION['seller_user_id'] = $userId;
    $_SESSION['seller_role'] = 'staff';
    seller_json(['status' => 'success', 'user' => [
        'id' => $userId,
        'name' => $name,
        'full_name' => $name,
        'email' => $email,
        'phone' => $phone,
        'role' => 'staff',
        'status' => 'active',
        'shopName' => $shopName,
        'createdAt' => date('Y-m-d H:i:s'),
    ]], 201);
}

if ($action === 'register-customer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = seller_body();
    $name = trim((string) ($body['name'] ?? ''));
    $email = filter_var(trim((string) ($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    $phone = trim((string) ($body['phone'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    if ($name === '' || !$email || $phone === '' || strlen($password) < 8) {
        seller_json(['status' => 'error', 'message' => 'Vui lòng điền đủ thông tin; mật khẩu cần tối thiểu 8 ký tự.'], 422);
    }

    $pdo = seller_db();
    $stmt = $pdo->prepare(
        'INSERT INTO users (email, password_hash, full_name, phone, role, status)
         VALUES (:email, :password_hash, :full_name, :phone, "customer", "active")'
    );
    try {
        $stmt->execute([
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'full_name' => $name,
            'phone' => $phone,
        ]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') {
            seller_json(['status' => 'error', 'message' => 'Email này đã được đăng ký.'], 409);
        }
        throw $error;
    }

    $userId = (int) $pdo->lastInsertId();
    session_regenerate_id(true);
    $_SESSION['auth_user_id'] = $userId;
    $_SESSION['auth_role'] = 'customer';
    unset($_SESSION['seller_user_id'], $_SESSION['seller_role']);
    seller_json(['status' => 'success', 'user' => [
        'id' => $userId,
        'name' => $name,
        'full_name' => $name,
        'email' => $email,
        'phone' => $phone,
        'role' => 'customer',
        'status' => 'active',
        'shopName' => null,
        'createdAt' => date('Y-m-d H:i:s'),
    ]], 201);
}

seller_json(['status' => 'error', 'message' => 'Hành động không hợp lệ.'], 404);
