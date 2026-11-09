<?php
declare(strict_types=1);

/**
 * Trả về response JSON và dừng script
 */
function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Phản hồi thành công chuẩn
 */
function json_success(mixed $data = null, string $message = '', int $status = 200): never
{
    $payload = ['status' => 'success'];
    if ($message !== '') {
        $payload['message'] = $message;
    }
    if ($data !== null) {
        $payload['data'] = $data;
    }
    json_response($payload, $status);
}

/**
 * Phản hồi lỗi chuẩn
 */
function json_error(string $message, int $status = 400, mixed $errors = null): never
{
    $payload = [
        'status' => 'error',
        'message' => $message,
    ];
    if ($errors !== null) {
        $payload['errors'] = $errors;
    }
    json_response($payload, $status);
}

/**
 * Đọc và parse dữ liệu JSON từ request body
 */
function get_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_error('Dữ liệu JSON gửi lên không hợp lệ.', 400);
    }
    return $decoded;
}

/**
 * Lấy tham số số nguyên dương từ request
 */
function require_positive_int(mixed $value, string $fieldName): int
{
    $val = filter_var($value, FILTER_VALIDATE_INT);
    if ($val === false || $val < 1) {
        json_error("$fieldName phải là một số nguyên dương hợp lệ.", 422);
    }
    return $val;
}

set_exception_handler(static function (Throwable $error): void {
    error_log($error->__toString());
    json_error('Lỗi máy chủ nội bộ: ' . $error->getMessage(), 500);
});
