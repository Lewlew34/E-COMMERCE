<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__) . '/config/database.php';

$email = filter_var(trim((string) ($argv[1] ?? '')), FILTER_VALIDATE_EMAIL);
$name = trim((string) ($argv[2] ?? ''));
if (!$email || $name === '') {
    fwrite(STDERR, "Usage: php create_admin.php admin@example.com \"Admin name\"\n");
    exit(2);
}

fwrite(STDOUT, "Admin password (at least 12 characters; input is visible): ");
$password = trim((string) fgets(STDIN));
if (strlen($password) < 12) {
    fwrite(STDERR, "Password must be at least 12 characters.\n");
    exit(2);
}

$pdo = get_db_connection();
$existing = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
$existing->execute(['email' => $email]);
if ($existing->fetchColumn()) {
    fwrite(STDERR, "That email already exists. No account was changed.\n");
    exit(1);
}

$insert = $pdo->prepare(
    'INSERT INTO users (email, password_hash, full_name, role, status)
     VALUES (:email, :password_hash, :full_name, "admin", "active")'
);
$insert->execute([
    'email' => $email,
    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    'full_name' => $name,
]);

fwrite(STDOUT, "Active admin account created for $email.\n");
