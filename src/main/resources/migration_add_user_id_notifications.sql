-- ================================================================
-- MIGRATION: Add user_id column to notifications table
-- Run this in Supabase SQL Editor ONCE
-- This fixes the Hibernate schema validation error that causes
-- the backend to fail to start
-- ================================================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- ================================================================
-- SEED: Insert sample orders for Kitchen Display (Chef Mohan)
-- This inserts PENDING orders for today so Kitchen Display
-- shows data immediately after running
-- ================================================================

DO $$
DECLARE
    v_kitchen_id   BIGINT;
    v_branch_id    BIGINT;
    v_restaurant_id BIGINT;
    v_customer_id  BIGINT;
    v_item1_id     BIGINT;
    v_item2_id     BIGINT;
    v_item3_id     BIGINT;
    v_order1_id    BIGINT;
    v_order2_id    BIGINT;
    v_order3_id    BIGINT;
BEGIN

-- Get IDs
SELECT id INTO v_kitchen_id    FROM users WHERE mobile = '9800000004' AND role = 'kitchen' LIMIT 1;
SELECT id INTO v_branch_id     FROM users WHERE mobile = '9800000002' AND role = 'branch'  LIMIT 1;
SELECT id INTO v_restaurant_id FROM users WHERE mobile = '9800000001'                       LIMIT 1;

-- Get or create customer
SELECT id INTO v_customer_id FROM customers WHERE mobile_number = '9000000004' LIMIT 1;
IF v_customer_id IS NULL THEN
    INSERT INTO customers (name, email, mobile_number, is_active, is_first_order, created_at, updated_at)
    VALUES ('Rajesh Kumar', 'rajesh@demo.com', '9000000004', true, true, NOW(), NOW())
    RETURNING id INTO v_customer_id;
END IF;

-- Get 3 menu items
SELECT id INTO v_item1_id FROM menu_items WHERE branch_id = v_branch_id AND is_active = true ORDER BY id LIMIT 1;
SELECT id INTO v_item2_id FROM menu_items WHERE branch_id = v_branch_id AND is_active = true ORDER BY id LIMIT 1 OFFSET 1;
SELECT id INTO v_item3_id FROM menu_items WHERE branch_id = v_branch_id AND is_active = true ORDER BY id LIMIT 1 OFFSET 2;

-- Only insert if kitchen, branch, restaurant all found
IF v_kitchen_id IS NULL OR v_branch_id IS NULL OR v_restaurant_id IS NULL THEN
    RAISE NOTICE 'Kitchen/Branch/Restaurant user not found. Skipping order seed.';
    RETURN;
END IF;

-- ORDER 1 — PENDING (New Order)
INSERT INTO orders (
    order_number, order_type, status, payment_status, payment_method,
    kitchen_id, branch_id, restaurant_id, customer_id,
    subtotal, tax_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone,
    special_instructions, estimated_time,
    created_at, updated_at
) VALUES (
    'KIT-SEED-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-001',
    'DINE_IN', 'PENDING', 'PENDING', 'CASH',
    v_kitchen_id, v_branch_id, v_restaurant_id, v_customer_id,
    500.00, 50.00, 0.00, 0.00, 550.00,
    'Rajesh Kumar', '9000000004',
    'Make it spicy', 20,
    NOW(), NOW()
) RETURNING id INTO v_order1_id;

IF v_item1_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, kitchen_id, menu_item_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
    SELECT v_order1_id, v_kitchen_id, v_item1_id, name, price, 2, 0.00, price*2, 'PENDING', NOW(), NOW()
    FROM menu_items WHERE id = v_item1_id;
END IF;

-- ORDER 2 — PREPARING
INSERT INTO orders (
    order_number, order_type, status, payment_status, payment_method,
    kitchen_id, branch_id, restaurant_id, customer_id,
    subtotal, tax_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone,
    special_instructions, estimated_time,
    kitchen_accept_at, created_at, updated_at
) VALUES (
    'KIT-SEED-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-002',
    'DINE_IN', 'PREPARING', 'PENDING', 'CASH',
    v_kitchen_id, v_branch_id, v_restaurant_id, v_customer_id,
    450.00, 45.00, 0.00, 0.00, 495.00,
    'Suresh Patel', '9000000005',
    'No onions please', 25,
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'
) RETURNING id INTO v_order2_id;

IF v_item2_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, kitchen_id, menu_item_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
    SELECT v_order2_id, v_kitchen_id, v_item2_id, name, price, 1, 0.00, price, 'PREPARING', NOW() - INTERVAL '10 minutes', NOW()
    FROM menu_items WHERE id = v_item2_id;
END IF;

-- ORDER 3 — READY
INSERT INTO orders (
    order_number, order_type, status, payment_status, payment_method,
    kitchen_id, branch_id, restaurant_id, customer_id,
    subtotal, tax_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone,
    estimated_time,
    kitchen_accept_at, kitchen_ready_at, created_at, updated_at
) VALUES (
    'KIT-SEED-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-003',
    'DINE_IN', 'READY', 'PENDING', 'CASH',
    v_kitchen_id, v_branch_id, v_restaurant_id, v_customer_id,
    600.00, 60.00, 0.00, 0.00, 660.00,
    'Priya Singh', '9000000006',
    30,
    NOW() - INTERVAL '25 minutes',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'
) RETURNING id INTO v_order3_id;

IF v_item3_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, kitchen_id, menu_item_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
    SELECT v_order3_id, v_kitchen_id, v_item3_id, name, price, 2, 0.00, price*2, 'READY', NOW() - INTERVAL '30 minutes', NOW()
    FROM menu_items WHERE id = v_item3_id;
END IF;

RAISE NOTICE 'Kitchen orders seeded successfully! Orders: PENDING=%, PREPARING=%, READY=%', v_order1_id, v_order2_id, v_order3_id;

END $$;
