-- Run once in phpMyAdmin after selecting techecommercedb.
-- Existing products/orders remain unassigned until an admin assigns them to a seller.
ALTER TABLE users
  ADD COLUMN shop_name VARCHAR(255) NULL AFTER full_name,
  ADD COLUMN shop_address TEXT NULL AFTER shop_name,
  ADD COLUMN business_category VARCHAR(255) NULL AFTER shop_address;

ALTER TABLE products
  ADD COLUMN seller_id INT(11) NULL AFTER category_id,
  ADD KEY idx_products_seller_id (seller_id),
  ADD CONSTRAINT products_ibfk_seller
    FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD COLUMN seller_id INT(11) NULL AFTER variant_id,
  ADD KEY idx_order_items_seller_id (seller_id),
  ADD CONSTRAINT order_items_ibfk_seller
    FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE SET NULL;

UPDATE order_items oi
JOIN product_variants pv ON pv.id = oi.variant_id
JOIN products p ON p.id = pv.product_id
SET oi.seller_id = p.seller_id
WHERE oi.seller_id IS NULL;

CREATE TABLE seller_order_status (
  id INT(11) NOT NULL AUTO_INCREMENT,
  seller_id INT(11) NOT NULL,
  order_id INT(11) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  tracking_number VARCHAR(100) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_seller_order (seller_id, order_id),
  KEY idx_seller_order_status (seller_id, status),
  CONSTRAINT seller_order_status_user_fk FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT seller_order_status_order_fk FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
