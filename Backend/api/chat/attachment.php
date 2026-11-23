<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$auth = require_auth();
if ($auth['role'] === 'customer') {
    require_customer();
    $ownerColumn = 'customer_id';
} elseif (in_array($auth['role'], ['staff', 'seller'], true)) {
    require_seller();
    $ownerColumn = 'seller_id';
} else {
    json_error('Tệp đính kèm chỉ dành cho người tham gia hội thoại.', 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Phương thức yêu cầu không hợp lệ.', 405);
}

$messageId = require_positive_int($_GET['message_id'] ?? null, 'ID tin nhắn');
$stmt = get_db_connection()->prepare(
    "SELECT m.attachment_path, m.attachment_mime
     FROM chat_messages m
     JOIN chat_conversations c ON c.id = m.conversation_id
     WHERE m.id = :message_id AND m.message_type = 'image' AND m.deleted_at IS NULL
       AND c.$ownerColumn = :user_id
     LIMIT 1"
);
$stmt->execute(['message_id' => $messageId, 'user_id' => $auth['id']]);
$attachment = $stmt->fetch();
if (!$attachment || !in_array($attachment['attachment_mime'], ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
    json_error('Không tìm thấy ảnh hoặc bạn không có quyền xem.', 404);
}

$path = dirname(__DIR__, 2) . '/storage/chat/' . basename((string) $attachment['attachment_path']);
if (!is_file($path) || !is_readable($path)) {
    json_error('Tệp ảnh không còn khả dụng.', 404);
}

header('Content-Type: ' . $attachment['attachment_mime']);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=3600');
header('Content-Length: ' . (string) filesize($path));
readfile($path);
exit;
