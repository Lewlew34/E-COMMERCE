ALTER TABLE chat_messages
  ADD COLUMN reply_to_id BIGINT(20) NULL AFTER sender_id,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
  ADD KEY idx_chat_reply_to (reply_to_id),
  ADD CONSTRAINT chat_messages_reply_fk
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages (id) ON DELETE SET NULL;
