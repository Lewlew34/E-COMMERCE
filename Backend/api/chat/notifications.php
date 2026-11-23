<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$auth = require_auth();
if ($auth['role'] === 'customer') {
    require_customer();
    $participant = 'customer';
    $ownerColumn = 'customer_id';
    $readColumn = 'customer_last_read_message_id';
} elseif (in_array($auth['role'], ['staff', 'seller'], true)) {
    require_seller();
    $participant = 'seller';
    $ownerColumn = 'seller_id';
    $readColumn = 'seller_last_read_message_id';
} else {
    json_error('Thông báo tin nhắn chỉ dành cho khách hàng và Seller.', 403);
}

$pdo = get_db_connection();
$unreadStmt = $pdo->prepare(
    "SELECT COUNT(*)
     FROM chat_messages m
     JOIN chat_conversations c ON c.id = m.conversation_id
     WHERE c.$ownerColumn = :user_id
       AND m.sender_id <> :sender_id
       AND m.deleted_at IS NULL
       AND m.id > c.$readColumn"
);
$unreadStmt->execute(['user_id' => $auth['id'], 'sender_id' => $auth['id']]);

$latestStmt = $pdo->prepare(
    "SELECT c.id AS conversation_id, m.id AS message_id, m.message, m.message_type,
            sender.full_name AS sender_name,
            CASE WHEN :participant = 'customer' THEN seller.shop_name ELSE NULL END AS shop_name
     FROM chat_messages m
     JOIN chat_conversations c ON c.id = m.conversation_id
     JOIN users sender ON sender.id = m.sender_id
     JOIN users seller ON seller.id = c.seller_id
     WHERE c.$ownerColumn = :user_id
       AND m.sender_id <> :sender_id
       AND m.deleted_at IS NULL
       AND m.id > c.$readColumn
     ORDER BY m.id DESC
     LIMIT 1"
);
$latestStmt->execute([
    'participant' => $participant,
    'user_id' => $auth['id'],
    'sender_id' => $auth['id'],
]);
$latest = $latestStmt->fetch() ?: null;
if ($latest) {
    $latest['conversation_id'] = (int) $latest['conversation_id'];
    $latest['message_id'] = (int) $latest['message_id'];
    if ($latest['message'] === '') {
        $latest['message'] = match ($latest['message_type']) {
            'image' => 'Đã gửi hình ảnh',
            'product' => 'Đã chia sẻ sản phẩm',
            'order' => 'Đã chia sẻ đơn hàng',
            default => 'Tin nhắn mới',
        };
    }
    $latest['display_name'] = $participant === 'customer'
        ? ($latest['shop_name'] ?: $latest['sender_name'])
        : $latest['sender_name'];
}

json_success([
    'unread_count' => (int) $unreadStmt->fetchColumn(),
    'latest' => $latest,
]);
