<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$auth = require_auth();
if ($auth['role'] === 'customer') {
    require_customer();
    $role = 'customer';
    $customerStatus = get_db_connection()->prepare('SELECT status FROM users WHERE id = :id');
    $customerStatus->execute(['id' => $auth['id']]);
    if ($customerStatus->fetchColumn() !== 'active') {
        json_error('Tài khoản khách hàng không hoạt động.', 403);
    }
} elseif (in_array($auth['role'], ['staff', 'seller'], true)) {
    require_seller();
    $role = 'seller';
} else {
    json_error('Chức năng tin nhắn chỉ dành cho khách hàng và Seller.', 403);
}

$conversationId = require_positive_int($_GET['conversation_id'] ?? null, 'ID hội thoại');
$pdo = get_db_connection();
$participantColumn = $role === 'customer' ? 'customer_id' : 'seller_id';
$conversationStmt = $pdo->prepare(
    "SELECT c.id, c.customer_id, c.seller_id,
            customer.full_name AS customer_name, seller.shop_name, seller.full_name AS seller_name
     FROM chat_conversations c
     JOIN users customer ON customer.id = c.customer_id
     JOIN users seller ON seller.id = c.seller_id
     WHERE c.id = :conversation_id AND c.$participantColumn = :user_id
     LIMIT 1"
);
$conversationStmt->execute(['conversation_id' => $conversationId, 'user_id' => $auth['id']]);
$conversation = $conversationStmt->fetch();
if (!$conversation) {
    json_error('Không tìm thấy hội thoại hoặc bạn không có quyền truy cập.', 404);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT m.id, m.sender_id, u.full_name AS sender_name, m.message, m.message_type,
                m.shared_product_id, p.name AS product_name, p.slug AS product_slug,
                m.shared_order_id, o.order_code, o.order_status,
                m.attachment_path, m.reply_to_id, m.deleted_at, m.created_at,
                reply.sender_id AS reply_sender_id, reply_user.full_name AS reply_sender_name,
                reply.message AS reply_message, reply.message_type AS reply_message_type,
                reply.deleted_at AS reply_deleted_at
         FROM chat_messages m JOIN users u ON u.id = m.sender_id
         LEFT JOIN products p ON p.id = m.shared_product_id
         LEFT JOIN orders o ON o.id = m.shared_order_id
         LEFT JOIN chat_messages reply ON reply.id = m.reply_to_id
         LEFT JOIN users reply_user ON reply_user.id = reply.sender_id
         WHERE m.conversation_id = :conversation_id
         ORDER BY m.id ASC'
    );
    $stmt->execute(['conversation_id' => $conversationId]);
    $messages = array_map(static function (array $row): array {
        $row['id'] = (int) $row['id'];
        $row['sender_id'] = (int) $row['sender_id'];
        $row['shared_product_id'] = $row['shared_product_id'] === null ? null : (int) $row['shared_product_id'];
        $row['shared_order_id'] = $row['shared_order_id'] === null ? null : (int) $row['shared_order_id'];
        $row['order_status'] = $row['order_status'] ?? null;
        if ($row['deleted_at'] !== null) {
            $row['message'] = '';
            $row['message_type'] = 'deleted';
            $row['shared_product_id'] = null;
            $row['shared_order_id'] = null;
            $row['reply_to_id'] = null;
            $row['reply'] = null;
        } else {
            $row['reply_to_id'] = $row['reply_to_id'] === null ? null : (int) $row['reply_to_id'];
            $row['reply'] = $row['reply_to_id'] === null ? null : [
                'id' => $row['reply_to_id'],
                'sender_id' => (int) $row['reply_sender_id'],
                'sender_name' => $row['reply_sender_name'],
                'message' => $row['reply_deleted_at'] !== null
                    ? 'Tin nhắn đã bị xóa'
                    : ($row['reply_message'] ?: match ($row['reply_message_type']) {
                        'image' => 'Hình ảnh',
                        'product' => 'Sản phẩm',
                        'order' => 'Đơn hàng',
                        default => '',
                    }),
                'message_type' => $row['reply_deleted_at'] !== null ? 'deleted' : $row['reply_message_type'],
            ];
        }
        $row['attachment_url'] = $row['message_type'] === 'image' && $row['deleted_at'] === null
            ? 'chat/attachment.php?message_id=' . $row['id']
            : null;
        unset($row['attachment_path']);
        unset($row['reply_sender_id'], $row['reply_sender_name'], $row['reply_message'],
            $row['reply_message_type'], $row['reply_deleted_at']);
        return $row;
    }, $stmt->fetchAll());

    if ($messages !== []) {
        $readColumn = $role === 'customer' ? 'customer_last_read_message_id' : 'seller_last_read_message_id';
        $lastReadMessageId = $messages[array_key_last($messages)]['id'];
        $pdo->prepare(
            "UPDATE chat_conversations SET $readColumn = :last_read WHERE id = :id"
        )->execute(['last_read' => $lastReadMessageId, 'id' => $conversationId]);
    }

    $conversation['id'] = (int) $conversation['id'];
    json_success(['conversation' => $conversation, 'messages' => $messages]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $messageId = require_positive_int($_GET['message_id'] ?? null, 'ID tin nhắn');
    $delete = $pdo->prepare(
        'UPDATE chat_messages
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = :message_id AND conversation_id = :conversation_id
           AND sender_id = :sender_id AND deleted_at IS NULL'
    );
    $delete->execute([
        'message_id' => $messageId,
        'conversation_id' => $conversationId,
        'sender_id' => $auth['id'],
    ]);
    if ($delete->rowCount() !== 1) {
        json_error('Chỉ có thể xóa tin nhắn của bạn trong hội thoại này.', 404);
    }
    json_success(null, 'Đã xóa tin nhắn.');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $isMultipart = str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');
    $body = $isMultipart ? $_POST : get_json_body();
    $message = trim((string) ($body['message'] ?? ''));
    $messageType = $isMultipart ? 'image' : (string) ($body['type'] ?? 'text');
    if (!in_array($messageType, ['text', 'image', 'product', 'order'], true)) {
        json_error('Loại tin nhắn không hợp lệ.', 422);
    }

    if ($messageType === 'text' && ($message === '' || mb_strlen($message, 'UTF-8') > 2000)) {
        json_error('Tin nhắn không được để trống và tối đa 2.000 ký tự.', 422);
    }
    if ($messageType === 'image' && mb_strlen($message, 'UTF-8') > 2000) {
        json_error('Mô tả ảnh tối đa 2.000 ký tự.', 422);
    }
    $replyToId = isset($body['reply_to_id'])
        ? require_positive_int($body['reply_to_id'], 'ID tin nhắn trả lời')
        : null;
    if ($replyToId !== null) {
        $replyStmt = $pdo->prepare(
            'SELECT id FROM chat_messages
             WHERE id = :message_id AND conversation_id = :conversation_id AND deleted_at IS NULL'
        );
        $replyStmt->execute(['message_id' => $replyToId, 'conversation_id' => $conversationId]);
        if (!$replyStmt->fetchColumn()) {
            json_error('Không thể trả lời tin nhắn không tồn tại hoặc đã bị xóa.', 422);
        }
    }

    $sharedProductId = null;
    $sharedOrderId = null;
    if ($messageType === 'product') {
        $sharedProductId = require_positive_int($body['product_id'] ?? null, 'ID sản phẩm');
        $productStmt = $pdo->prepare(
            'SELECT p.id FROM products p
             JOIN users seller ON seller.id = p.seller_id
             WHERE p.id = :product_id AND p.seller_id = :seller_id
               AND p.status = "published" AND seller.status = "active"
             LIMIT 1'
        );
        $productStmt->execute(['product_id' => $sharedProductId, 'seller_id' => (int) $conversation['seller_id']]);
        if (!$productStmt->fetchColumn()) {
            json_error('Sản phẩm không thuộc shop này hoặc hiện không được đăng bán.', 422);
        }
        $message = 'Sản phẩm của shop';
    } elseif ($messageType === 'order') {
        $sharedOrderId = require_positive_int($body['order_id'] ?? null, 'ID đơn hàng');
        $orderOwner = $role === 'customer'
            ? 'o.user_id = :participant_id'
            : 'o.user_id = :conversation_customer_id';
        $orderStmt = $pdo->prepare(
            'SELECT o.id FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.id = :order_id AND oi.seller_id = :seller_id AND ' . $orderOwner . '
             LIMIT 1'
        );
        $orderParams = [
            'order_id' => $sharedOrderId,
            'seller_id' => (int) $conversation['seller_id'],
        ];
        if ($role === 'customer') {
            $orderParams['participant_id'] = $auth['id'];
        } else {
            $orderParams['conversation_customer_id'] = (int) $conversation['customer_id'];
        }
        $orderStmt->execute($orderParams);
        if (!$orderStmt->fetchColumn()) {
            json_error('Đơn hàng không liên quan đến hội thoại này hoặc bạn không có quyền chia sẻ.', 422);
        }
        $message = 'Thông tin đơn hàng';
    }

    $storedPath = null;
    $attachmentMime = null;
    if ($messageType === 'image') {
        $file = $_FILES['image'] ?? null;
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            json_error('Vui lòng chọn ảnh hợp lệ để gửi.', 422);
        }
        if (!is_uploaded_file((string) $file['tmp_name']) || (int) $file['size'] < 1 || (int) $file['size'] > 5 * 1024 * 1024) {
            json_error('Ảnh phải có kích thước tối đa 5 MB.', 422);
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $attachmentMime = $finfo->file((string) $file['tmp_name']);
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];
        if (!isset($extensions[$attachmentMime])) {
            json_error('Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.', 422);
        }

        $uploadDirectory = dirname(__DIR__, 2) . '/storage/chat';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true) && !is_dir($uploadDirectory)) {
            json_error('Không thể tạo thư mục lưu ảnh chat.', 500);
        }
        $storedPath = bin2hex(random_bytes(24)) . '.' . $extensions[$attachmentMime];
        if (!move_uploaded_file((string) $file['tmp_name'], $uploadDirectory . '/' . $storedPath)) {
            json_error('Không thể lưu ảnh đính kèm.', 500);
        }
        $message = $message !== '' ? $message : 'Đã gửi hình ảnh';
    }

    try {
        $pdo->beginTransaction();
        $readColumn = $role === 'customer' ? 'customer_last_read_message_id' : 'seller_last_read_message_id';
        $insert = $pdo->prepare(
            "INSERT INTO chat_messages
             (conversation_id, sender_id, message, message_type, attachment_path, attachment_mime,
               shared_product_id, shared_order_id, reply_to_id)
             VALUES (:conversation_id, :sender_id, :message, :message_type, :attachment_path,
                      :attachment_mime, :shared_product_id, :shared_order_id, :reply_to_id)"
        );
        $insert->execute([
            'conversation_id' => $conversationId,
            'sender_id' => $auth['id'],
            'message' => $message,
            'message_type' => $messageType,
            'attachment_path' => $storedPath,
            'attachment_mime' => $attachmentMime,
            'shared_product_id' => $sharedProductId,
            'shared_order_id' => $sharedOrderId,
            'reply_to_id' => $replyToId,
        ]);
        $messageId = (int) $pdo->lastInsertId();
        $pdo->prepare(
            "UPDATE chat_conversations
             SET updated_at = CURRENT_TIMESTAMP, $readColumn = :last_read
             WHERE id = :id"
        )->execute(['last_read' => $messageId, 'id' => $conversationId]);
        $createdAtStmt = $pdo->prepare('SELECT created_at FROM chat_messages WHERE id = :id');
        $createdAtStmt->execute(['id' => $messageId]);
        $createdAt = $createdAtStmt->fetchColumn();
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($storedPath !== null) {
            $storedFile = dirname(__DIR__, 2) . '/storage/chat/' . $storedPath;
            if (is_file($storedFile)) {
                unlink($storedFile);
            }
        }
        throw $error;
    }

    json_success([
        'id' => $messageId,
        'sender_id' => $auth['id'],
        'sender_name' => $role === 'customer'
            ? $conversation['customer_name']
            : ($conversation['shop_name'] ?: $conversation['seller_name']),
        'message' => $message,
        'message_type' => $messageType,
        'attachment_url' => $messageType === 'image' ? 'chat/attachment.php?message_id=' . $messageId : null,
        'shared_product_id' => $sharedProductId,
        'shared_order_id' => $sharedOrderId,
        'reply_to_id' => $replyToId,
        'created_at' => $createdAt,
    ], 'Đã gửi tin nhắn.', 201);
}

json_error('Phương thức yêu cầu không hợp lệ.', 405);
