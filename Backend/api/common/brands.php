<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';

try {
    $conn = get_db_connection();
    $stmt = $conn->prepare("SELECT id, name, slug, logo FROM brands ORDER BY id ASC");
    $stmt->execute();
    $brands = $stmt->fetchAll();

    json_success($brands);
} catch (PDOException $e) {
    json_error("Lỗi khi tải thương hiệu: " . $e->getMessage(), 500);
}
