CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `gateway` varchar(50) NOT NULL,
  `transaction_id` varchar(100) NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL,
  `payer_email` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transactions_gateway_transaction` (`gateway`, `transaction_id`),
  KEY `idx_transactions_order_created` (`order_id`, `created_at`),
  CONSTRAINT `transactions_order_fk`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
