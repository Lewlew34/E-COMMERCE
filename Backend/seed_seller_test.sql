-- Seller Center test seed. Run after importing migrations/20261108_seller_center.sql.
-- Register one Seller account and one Customer account in the app first.
-- Edit the emails and product slug below to match your accounts/data.
USE techecommercedb;

SET @seller_email = 'seller@example.com';
SET @customer_email = 'customer@example.com';
SET @product_slug = 'asus-rog-strix-scar-16';
SET @order_code = CONCAT('TEST-SELLER-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
SET @seller_id = (
  SELECT id FROM users
  WHERE email = @seller_email AND role IN ('staff', 'seller') AND status = 'active'
  LIMIT 1
);
SET @customer_id = (
  SELECT id FROM users
  WHERE email = @customer_email AND role = 'customer' AND status = 'active'
  LIMIT 1
);
SET @product_id = (
  SELECT id FROM products WHERE slug = @product_slug LIMIT 1
);

START TRANSACTION;

-- Assign only this selected product; do not claim other unassigned products.
UPDATE products
SET seller_id = @seller_id
WHERE id = @product_id
  AND @seller_id IS NOT NULL
  AND seller_id IS NULL;

-- Backfill old order lines only for products already assigned to this Seller.
UPDATE order_items oi
JOIN product_variants v ON v.id = oi.variant_id
JOIN products p ON p.id = v.product_id
SET oi.seller_id = p.seller_id
WHERE p.seller_id = @seller_id
  AND @seller_id IS NOT NULL
  AND oi.seller_id IS NULL;

SET @variant_id = (
  SELECT v.id
  FROM product_variants v
  JOIN products p ON p.id = v.product_id
  WHERE p.id = @product_id AND p.seller_id = @seller_id
  ORDER BY v.id
  LIMIT 1
);

-- Create a pending order only when the Seller, Customer and assigned product exist.
INSERT INTO orders (
  user_id, order_code, total_amount, shipping_fee, final_amount,
  payment_status, order_status, shipping_address_snapshot
)
SELECT
  @customer_id,
  @order_code,
  v.price,
  IF(v.price >= 500000, 0, 30000),
  v.price + IF(v.price >= 500000, 0, 30000),
  'pending',
  'pending',
  JSON_OBJECT(
    'recipientName', c.full_name,
    'phone', COALESCE(c.phone, '0900000000'),
    'addressLine', 'Địa chỉ thử nghiệm',
    'ward', 'Phường 1',
    'district', 'Quận 1',
    'city', 'TP. Hồ Chí Minh'
  )
FROM product_variants v
JOIN products p ON p.id = v.product_id
JOIN users c ON c.id = @customer_id
WHERE v.id = @variant_id
  AND p.seller_id = @seller_id
  AND @seller_id IS NOT NULL
  AND @customer_id IS NOT NULL
  AND v.stock_quantity > 0;

SET @order_id = (SELECT id FROM orders WHERE order_code = @order_code LIMIT 1);

INSERT INTO order_items (
  order_id, variant_id, seller_id, product_name_snapshot,
  variant_attributes_snapshot, price, quantity, total_price
)
SELECT @order_id, v.id, @seller_id, p.name, v.attributes, v.price, 1, v.price
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE v.id = @variant_id
  AND p.seller_id = @seller_id
  AND @order_id IS NOT NULL;

INSERT INTO payments (order_id, payment_method, amount, status)
SELECT @order_id, 'COD', o.final_amount, 'pending'
FROM orders o
WHERE o.id = @order_id;

INSERT INTO seller_order_status (seller_id, order_id, status)
SELECT @seller_id, @order_id, 'pending'
WHERE @seller_id IS NOT NULL AND @order_id IS NOT NULL;

-- Keep inventory consistent with a real checkout and make the adjustment visible in logs.
SET @previous_stock = (
  SELECT stock_quantity FROM product_variants WHERE id = @variant_id LIMIT 1
);
UPDATE product_variants
SET stock_quantity = stock_quantity - 1
WHERE id = @variant_id
  AND @order_id IS NOT NULL
  AND stock_quantity > 0;
SET @new_stock = (
  SELECT stock_quantity FROM product_variants WHERE id = @variant_id LIMIT 1
);

INSERT INTO inventory_logs (
  variant_id, type, quantity_changed, previous_stock, new_stock, reference_id, created_by
)
SELECT @variant_id, 'order_deduct', -1, @previous_stock, @new_stock, @order_code, @customer_id
WHERE @order_id IS NOT NULL;

COMMIT;

SELECT
  @seller_email AS seller_email,
  @customer_email AS customer_email,
  @product_slug AS product_slug,
  @order_code AS test_order_code,
  IF(@seller_id IS NULL, 'Seller not found; register/check the email', 'Seller found') AS seller_check,
  IF(@customer_id IS NULL, 'Customer not found; register/check the email', 'Customer found') AS customer_check,
  IF(@order_id IS NULL, 'Order not created; check account, product ownership and stock', 'Test order created') AS order_result;
