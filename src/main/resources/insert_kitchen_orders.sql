-- ================================================================
-- KITCHEN MODULE - Sample Orders for Testing
-- Creates orders visible to Chef Mohan (9800000004) in Kitchen Display
-- ================================================================

-- Step 1: Insert a customer with phone number 9000000004 (if not exists)
INSERT IGNORE INTO customers (name, email, mobile_number, is_active, is_first_order, created_at, updated_at)
VALUES (
    'Rajesh Kumar',
    'rajesh.demo@example.com',
    '9000000004',
    TRUE,
    TRUE,
    NOW(),
    NOW()
);

-- Step 2: Get the customer ID
SET @customer_id = (SELECT id FROM customers WHERE mobile_number = '9000000004' LIMIT 1);

-- Step 3: Get the kitchen user ID (Chef Mohan with phone 9800000004)
SET @kitchen_id = (SELECT id FROM users WHERE phone = '9800000004' AND user_type = 'KITCHEN' LIMIT 1);
SET @restaurant_id = (SELECT restaurant_id FROM users WHERE id = @kitchen_id LIMIT 1);
SET @branch_id = (SELECT id FROM users WHERE phone = '9800000002' AND user_type = 'BRANCH' LIMIT 1);

-- Step 4: Get sample menu items for the orders
SET @menu_item_1 = (SELECT id FROM menu_items LIMIT 1);
SET @menu_item_2 = (SELECT id FROM menu_items LIMIT 1 OFFSET 1);
SET @menu_item_3 = (SELECT id FROM menu_items LIMIT 1 OFFSET 2);

-- Step 5: Insert Order 1 - NEW ORDER (PENDING status)
INSERT INTO orders (
    restaurant_id, branch_id, kitchen_id, customer_id,
    order_number, order_type, status, payment_status, payment_method,
    subtotal, tax_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone, customer_email,
    special_instructions, estimated_time,
    created_at, updated_at
) VALUES (
    @restaurant_id, @branch_id, @kitchen_id, @customer_id,
    CONCAT('KIT-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-001'),
    'DINE_IN',
    'PENDING',
    'PENDING',
    'CASH',
    500.00, 50.00, 0.00, 0.00, 550.00,
    'Rajesh Kumar', '9000000004', 'rajesh.demo@example.com',
    'Make it extra spicy',
    20,
    NOW(), NOW()
);

SET @order1_id = LAST_INSERT_ID();

-- Insert order items for Order 1
INSERT INTO order_items (order_id, kitchen_id, menu_item_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (@order1_id, @kitchen_id, @menu_item_1, (SELECT CONCAT(name, ' - Item 1') FROM menu_items WHERE id = @menu_item_1 LIMIT 1), 250.00, 2, 0.00, 500.00, 'PENDING', NOW(), NOW());

-- Step 6: Insert Order 2 - PREPARING ORDER (accepted by kitchen)
INSERT INTO orders (
    restaurant_id, branch_id, kitchen_id, customer_id,
    order_number, order_type, status, payment_status, payment_method,
    subtotal, tax_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone, customer_email,
    special_instructions, estimated_time,
    kitchen_accept_at,
    created_at, updated_at
) VALUES (
    @restaurant_id, @branch_id, @kitchen_id, @customer_id,
    CONCAT('KIT-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-002'),
    'DINE_IN',
    'PREPARING',
    'PENDING',
    'CASH',
    450.00, 45.00, 0.00, 0.00, 495.00,
    'Rajesh Kumar', '9000000004', 'rajesh.demo@example.com',
    'No onions',
    25,
    DATE_SUB(NOW(), INTERVAL 10 MINUTE),
    DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)
);

SET @order2_id = LAST_INSERT_ID();

-- Insert order items for Order 2
INSERT INTO order_items (order_id, kitchen_id, menu_item_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (@order2_id, @kitchen_id, @menu_item_2, (SELECT CONCAT(name, ' - Item 2') FROM menu_items WHERE id = @menu_item_2 LIMIT 1), 225.00, 2, 0.00, 450.00, 'PREPARING', NOW(), NOW());

-- Step 7: Insert Order 3 - READY ORDER (prepared and waiting for pickup)
INSERT INTO orders (
    restaurant_id, branch_id, kitchen_id, customer_id,
    order_number, order_type, status, payment_status, payment_method,
    subtotal, tax_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone, customer_email,
    special_instructions, estimated_time,
    kitchen_accept_at, kitchen_ready_at,
    created_at, updated_at
) VALUES (
    @restaurant_id, @branch_id, @kitchen_id, @customer_id,
    CONCAT('KIT-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-003'),
    'DINE_IN',
    'READY',
    'PENDING',
    'CASH',
    600.00, 60.00, 0.00, 0.00, 660.00,
    'Rajesh Kumar', '9000000004', 'rajesh.demo@example.com',
    'Keep rice separate',
    30,
    DATE_SUB(NOW(), INTERVAL 25 MINUTE),
    DATE_SUB(NOW(), INTERVAL 5 MINUTE),
    DATE_SUB(NOW(), INTERVAL 25 MINUTE), DATE_SUB(NOW(), INTERVAL 25 MINUTE)
);

SET @order3_id = LAST_INSERT_ID();

-- Insert order items for Order 3
INSERT INTO order_items (order_id, kitchen_id, menu_item_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (@order3_id, @kitchen_id, @menu_item_3, (SELECT CONCAT(name, ' - Item 3') FROM menu_items WHERE id = @menu_item_3 LIMIT 1), 300.00, 2, 0.00, 600.00, 'READY', NOW(), NOW());

-- Print summary
SELECT CONCAT(
    'Kitchen orders created successfully! ',
    'Customer: Rajesh Kumar (9000000004), ',
    'Kitchen: Chef Mohan, ',
    'Orders: 3 (PENDING, PREPARING, READY)'
) as result;
