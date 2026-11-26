<?php
declare(strict_types=1);

/**
 * Remove only the quantities purchased by an order from a customer's cart.
 * Keeps any quantity the customer added after the order was submitted.
 * The caller must run this inside an active transaction.
 */
function remove_order_quantities_from_cart(PDO $pdo, int $userId, int $orderId): void
{
    $cartStmt = $pdo->prepare('SELECT id FROM carts WHERE user_id = :user_id LIMIT 1 FOR UPDATE');
    $cartStmt->execute(['user_id' => $userId]);
    $cartId = $cartStmt->fetchColumn();
    if ($cartId === false) {
        return;
    }

    $orderItemsStmt = $pdo->prepare(
        'SELECT variant_id, SUM(quantity) AS quantity
         FROM order_items
         WHERE order_id = :order_id
         GROUP BY variant_id
         ORDER BY variant_id'
    );
    $orderItemsStmt->execute(['order_id' => $orderId]);

    $cartItemsStmt = $pdo->prepare(
        'SELECT id, quantity
         FROM cart_items
         WHERE cart_id = :cart_id AND variant_id = :variant_id
         ORDER BY id
         FOR UPDATE'
    );
    $deleteStmt = $pdo->prepare('DELETE FROM cart_items WHERE id = :id');
    $updateStmt = $pdo->prepare('UPDATE cart_items SET quantity = :quantity WHERE id = :id');

    foreach ($orderItemsStmt->fetchAll() as $orderItem) {
        $remaining = (int) $orderItem['quantity'];
        $cartItemsStmt->execute([
            'cart_id' => (int) $cartId,
            'variant_id' => (int) $orderItem['variant_id'],
        ]);

        foreach ($cartItemsStmt->fetchAll() as $cartItem) {
            if ($remaining <= 0) {
                break;
            }

            $cartQuantity = (int) $cartItem['quantity'];
            if ($cartQuantity <= $remaining) {
                $deleteStmt->execute(['id' => (int) $cartItem['id']]);
                $remaining -= $cartQuantity;
            } else {
                $updateStmt->execute([
                    'quantity' => $cartQuantity - $remaining,
                    'id' => (int) $cartItem['id'],
                ]);
                $remaining = 0;
            }
        }
    }
}
