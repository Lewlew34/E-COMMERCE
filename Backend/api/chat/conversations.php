<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';
require_once dirname(__DIR__, 2) . '/core/auth_guard.php';

$auth = require_auth();
$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($auth['role'] === 'customer') {
    require_customer();
    $customerId = $auth['id'];
    $status = $pdo->prepare('SELECT status FROM users WHERE id = :id');
    $status->execute(['id' => $customerId]);
    if ($status->fetchColumn() !== 'active') {
        json_error('Tài khoản khách hàng không hoạt động.', 403);
    }

    if ($method === 'POST') {
        $sellerId = require_positive_int(get_json_body()['seller_id'] ?? null, 'ID shop');
        $seller = $pdo->prepare(
            'SELECT id FROM users
             WHERE id = :id AND role IN ("staff", "seller") AND status = "active"
             LIMIT 1'
        );
        $seller->execute(['id' => $sellerId]);
        if (!$seller->fetchColumn()) {
            json_error('Không tìm thấy shop đang hoạt động.', 404);
        }

        $create = $pdo->prepare(
            'INSERT INTO chat_conversations (customer_id, seller_id)
             VALUES (:customer_id, :seller_id)
             ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)'
        );
        $create->execute(['customer_id' => $customerId, 'seller_id' => $sellerId]);
        $conversationId = (int) $pdo->lastInsertId();
        if ($conversationId < 1) {
            $find = $pdo->prepare(
                'SELECT id FROM chat_conversations WHERE customer_id = :customer_id AND seller_id = :seller_id'
            );
            $find->execute(['customer_id' => $customerId, 'seller_id' => $sellerId]);
            $conversationId = (int) $find->fetchColumn();
        }
        json_success(['id' => $conversationId]);
    }

    if ($method === 'GET') {
        $stmt = $pdo->prepare(
            "SELECT c.id, c.seller_id, seller.shop_name, seller.full_name AS seller_name,
                    c.updated_at,
                    CASE WHEN last_message.deleted_at IS NOT NULL THEN 'Tin nhắn đã bị xóa'
                         WHEN last_message.message IS NOT NULL AND last_message.message <> ''
                         THEN last_message.message
                         WHEN last_message.message_type = 'image' THEN 'Đã gửi hình ảnh'
                         WHEN last_message.message_type = 'product' THEN 'Đã chia sẻ sản phẩm'
                         WHEN last_message.message_type = 'order' THEN 'Đã chia sẻ đơn hàng'
                         ELSE NULL END AS last_message,
                    last_message.created_at AS last_message_at
             FROM chat_conversations c
             JOIN users seller ON seller.id = c.seller_id
             LEFT JOIN (
               SELECT m.conversation_id, m.message, m.message_type, m.deleted_at, m.created_at
               FROM chat_messages m
               JOIN (
                 SELECT conversation_id, MAX(id) AS last_id
                 FROM chat_messages GROUP BY conversation_id
               ) latest ON latest.last_id = m.id
             ) last_message ON last_message.conversation_id = c.id
             WHERE c.customer_id = :customer_id
             ORDER BY COALESCE(last_message.created_at, c.updated_at) DESC"
        );
        $stmt->execute(['customer_id' => $customerId]);
        $conversations = array_map(static function (array $row): array {
            $row['id'] = (int) $row['id'];
            $row['seller_id'] = (int) $row['seller_id'];
            return $row;
        }, $stmt->fetchAll());
        json_success($conversations);
    }
} elseif (in_array($auth['role'], ['staff', 'seller'], true)) {
    $seller = require_seller();
    if ($method !== 'GET') {
        json_error('Phương thức yêu cầu không hợp lệ.', 405);
    }

    $stmt = $pdo->prepare(
        "SELECT c.id, c.customer_id, customer.full_name AS customer_name,
                c.updated_at,
                CASE WHEN last_message.deleted_at IS NOT NULL THEN 'Tin nhắn đã bị xóa'
                     WHEN last_message.message IS NOT NULL AND last_message.message <> ''
                     THEN last_message.message
                     WHEN last_message.message_type = 'image' THEN 'Đã gửi hình ảnh'
                     WHEN last_message.message_type = 'product' THEN 'Đã chia sẻ sản phẩm'
                     WHEN last_message.message_type = 'order' THEN 'Đã chia sẻ đơn hàng'
                     ELSE NULL END AS last_message,
                last_message.created_at AS last_message_at
         FROM chat_conversations c
         JOIN users customer ON customer.id = c.customer_id
         LEFT JOIN (
           SELECT m.conversation_id, m.message, m.message_type, m.deleted_at, m.created_at
           FROM chat_messages m
           JOIN (
             SELECT conversation_id, MAX(id) AS last_id
             FROM chat_messages GROUP BY conversation_id
           ) latest ON latest.last_id = m.id
         ) last_message ON last_message.conversation_id = c.id
         WHERE c.seller_id = :seller_id
         ORDER BY COALESCE(last_message.created_at, c.updated_at) DESC"
    );
    $stmt->execute(['seller_id' => $seller['id']]);
    $conversations = array_map(static function (array $row): array {
        $row['id'] = (int) $row['id'];
        $row['customer_id'] = (int) $row['customer_id'];
        return $row;
    }, $stmt->fetchAll());
    json_success($conversations);
} else {
    json_error('Chức năng tin nhắn chỉ dành cho khách hàng và Seller.', 403);
}

json_error('Phương thức yêu cầu không hợp lệ.', 405);
