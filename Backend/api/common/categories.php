<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';

try {
    $conn = get_db_connection();
    $stmt = $conn->prepare("SELECT id, name, slug, parent_id, description FROM categories ORDER BY id ASC");
    $stmt->execute();
    $categories = $stmt->fetchAll();

    json_success($categories);
} catch (PDOException $e) {
    json_error("Lỗi khi tải danh mục: " . $e->getMessage(), 500);
}
