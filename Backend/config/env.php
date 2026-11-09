<?php
declare(strict_types=1);

/**
 * Đọc và nạp các biến môi trường từ file .env ở thư mục gốc E-COMMERCE
 */
function load_root_env(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }

    $envPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env';
    if (!file_exists($envPath)) {
        // Fallback kiểm tra thêm 1 cấp nếu cấu trúc thư mục thay đổi
        $envPathAlt = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
        if (file_exists($envPathAlt)) {
            $envPath = $envPathAlt;
        } else {
            return;
        }
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (str_contains($line, '=')) {
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value, " \t\n\r\0\x0B\"'");

            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }

    $loaded = true;
}

load_root_env();
