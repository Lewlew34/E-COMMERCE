ALTER TABLE chat_conversations
  ADD COLUMN customer_last_read_message_id BIGINT(20) NOT NULL DEFAULT 0 AFTER seller_id,
  ADD COLUMN seller_last_read_message_id BIGINT(20) NOT NULL DEFAULT 0 AFTER customer_last_read_message_id;

UPDATE chat_conversations c
SET customer_last_read_message_id = COALESCE((SELECT MAX(id) FROM chat_messages WHERE conversation_id = c.id), 0),
    seller_last_read_message_id = COALESCE((SELECT MAX(id) FROM chat_messages WHERE conversation_id = c.id), 0);

ALTER TABLE chat_messages
  ADD COLUMN message_type VARCHAR(20) NOT NULL DEFAULT 'text' AFTER message,
  ADD COLUMN attachment_path VARCHAR(255) NULL AFTER message_type,
  ADD COLUMN attachment_mime VARCHAR(100) NULL AFTER attachment_path,
  ADD COLUMN shared_product_id INT(11) NULL AFTER attachment_mime,
  ADD COLUMN shared_order_id INT(11) NULL AFTER shared_product_id,
  ADD KEY idx_chat_shared_product (shared_product_id),
  ADD KEY idx_chat_shared_order (shared_order_id);
