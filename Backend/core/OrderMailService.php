<?php

class OrderMailService
{
    private array $config;

    public function __construct(?array $config = null)
    {
        if ($config !== null) {
            $this->config = $config;
        } else {
            $configPath = __DIR__ . '/../config/mail.php';
            $this->config = file_exists($configPath) ? require $configPath : [];
        }
    }

    public function sendOrderStatusMail(string $toEmail, string $orderCode, string $statusText, int $totalAmount): bool
    {
        if (empty($toEmail) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $fromAddress = $this->config['from_address'] ?? 'no-reply@lhktech.local';
        $fromName = $this->config['from_name'] ?? 'LHK Tech';
        $formattedMoney = number_format($totalAmount, 0, ',', '.') . ' d';

        $subject = "[{$fromName}] Don hang #{$orderCode} - {$statusText}";
        $message = "Xin chao,\n\n"
            . "Don hang #{$orderCode} hien tai: {$statusText}.\n"
            . "Tong tien: {$formattedMoney}.\n\n"
            . "Cam on ban da mua sam tai {$fromName}.";

        $headers = [
            "From: {$fromName} <{$fromAddress}>",
            'Content-Type: text/plain; charset=UTF-8',
        ];

        return @mail($toEmail, $subject, $message, implode("\r\n", $headers));
    }
}