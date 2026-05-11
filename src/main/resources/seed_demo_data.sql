-- ================================================================
-- SPICE GARDEN - Full Demo Seed Data
-- Restaurant: Spice Garden | Mumbai
-- Roles covered: restaurant, branch, captain, kitchen, delivery, cashier, customer
-- Run this in Supabase SQL Editor or psql
-- ================================================================

DO $$
DECLARE
    v_state_id    INTEGER;
    v_city_id     INTEGER;
    v_pincode_id  BIGINT;
    v_rest_id     BIGINT;
    v_branch_id   BIGINT;
    v_captain_id  BIGINT;
    v_kitchen_id  BIGINT;
    v_delivery_id BIGINT;
    v_cashier_id  BIGINT;
    v_cust1_id    BIGINT;
    v_cust2_id    BIGINT;
    v_sec1_id     BIGINT;
    v_sec2_id     BIGINT;
    v_tbl1_id     BIGINT;
    v_addon1_id   BIGINT;
    v_addon2_id   BIGINT;
    v_cat1_id     BIGINT;
    v_cat2_id     BIGINT;
    v_cat3_id     BIGINT;
    v_subcat1_id  BIGINT;
    v_subcat2_id  BIGINT;
    v_subcat3_id  BIGINT;
    v_subcat4_id  BIGINT;
    v_item1_id    BIGINT;
    v_item2_id    BIGINT;
    v_item3_id    BIGINT;
    v_item4_id    BIGINT;
    v_item5_id    BIGINT;
    v_item6_id    BIGINT;
    v_item7_id    BIGINT;
    v_item8_id    BIGINT;
    v_item9_id    BIGINT;
    v_item10_id   BIGINT;
    v_item11_id   BIGINT;
    v_addr1_id    BIGINT;
    v_addr2_id    BIGINT;
    v_pgw_id      INTEGER;
    v_order1_id   BIGINT;
    v_order2_id   BIGINT;
    v_order3_id   BIGINT;
    v_order4_id   BIGINT;
    v_order5_id   BIGINT;
BEGIN

-- ────────────────────────────────────────────
-- 1. GEOGRAPHY
-- ────────────────────────────────────────────
INSERT INTO states (name, is_active, created_at, updated_at)
SELECT 'Maharashtra', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM states WHERE name = 'Maharashtra');
SELECT id INTO v_state_id FROM states WHERE name = 'Maharashtra' LIMIT 1;

INSERT INTO cities (name, state_id, is_active, created_at, updated_at)
SELECT 'Mumbai', v_state_id, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Mumbai' AND state_id = v_state_id);
SELECT id INTO v_city_id FROM cities WHERE name = 'Mumbai' AND state_id = v_state_id LIMIT 1;

INSERT INTO pincodes (pincode, state_id, city_id, is_active, created_at, updated_at)
SELECT '400001', v_state_id, v_city_id, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM pincodes WHERE pincode = '400001' AND city_id = v_city_id);
SELECT id INTO v_pincode_id FROM pincodes WHERE pincode = '400001' AND city_id = v_city_id LIMIT 1;

-- ────────────────────────────────────────────
-- 2. USERS
-- ────────────────────────────────────────────

-- Restaurant owner
INSERT INTO users (name, email, mobile, password, role, is_active, is_deleted, created_at, updated_at)
SELECT 'Spice Garden', 'spicegarden@demo.com', '9800000001', 'spice@123', 'restaurant', true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '9800000001');
SELECT id INTO v_rest_id FROM users WHERE mobile = '9800000001' LIMIT 1;

-- Branch user
INSERT INTO users (name, email, mobile, password, role, parent_id, is_active, is_deleted, created_at, updated_at)
SELECT 'Spice Garden - Main Branch', 'sgbranch@demo.com', '9800000002', 'branch@123', 'branch', v_rest_id, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '9800000002');
SELECT id INTO v_branch_id FROM users WHERE mobile = '9800000002' LIMIT 1;

-- Captain
INSERT INTO users (name, email, mobile, password, role, parent_id, branch_id, is_active, is_deleted, created_at, updated_at)
SELECT 'Raj Kumar', 'rajcaptain@demo.com', '9800000003', 'captain@123', 'captain', v_rest_id, v_branch_id, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '9800000003');
SELECT id INTO v_captain_id FROM users WHERE mobile = '9800000003' LIMIT 1;

-- Kitchen
INSERT INTO users (name, email, mobile, password, role, parent_id, branch_id, is_active, is_deleted, created_at, updated_at)
SELECT 'Chef Mohan', 'chefmohan@demo.com', '9800000004', 'kitchen@123', 'kitchen', v_rest_id, v_branch_id, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '9800000004');
SELECT id INTO v_kitchen_id FROM users WHERE mobile = '9800000004' LIMIT 1;

-- Delivery boy
INSERT INTO users (name, email, mobile, password, role, parent_id, branch_id, is_active, is_deleted, created_at, updated_at)
SELECT 'Vikram Singh', 'vikramdelivery@demo.com', '9800000005', 'delivery@123', 'delivery', v_rest_id, v_branch_id, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '9800000005');
SELECT id INTO v_delivery_id FROM users WHERE mobile = '9800000005' LIMIT 1;

-- Cashier
INSERT INTO users (name, email, mobile, password, role, parent_id, branch_id, is_active, is_deleted, created_at, updated_at)
SELECT 'Priya Sharma', 'priyacashier@demo.com', '9800000006', 'cashier@123', 'cashier', v_rest_id, v_branch_id, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '9800000006');
SELECT id INTO v_cashier_id FROM users WHERE mobile = '9800000006' LIMIT 1;

-- ────────────────────────────────────────────
-- 3. USERS PROFILE (restaurant)
-- ────────────────────────────────────────────
INSERT INTO users_profile (
    restaurant_id, restaurant_name, address,
    city_id, state_id, pincode_id, country,
    phone, website, latitude, longitude,
    primarys, secondary, tertiary, font_colour,
    description, is_active, created_at, updated_at
)
SELECT
    v_rest_id, 'Spice Garden Restaurant', '123, MG Road, Fort, Mumbai',
    v_city_id, v_state_id, v_pincode_id, 'India',
    '9800000001', 'www.spicegarden.in', 18.9322, 72.8264,
    '#FF5722', '#FFA726', '#FF7043', '#FFFFFF',
    'Authentic Indian cuisine since 2015. Known for our rich curries and tandoor dishes.',
    true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users_profile WHERE restaurant_id = v_rest_id);

-- ────────────────────────────────────────────
-- 4. RESTAURANT BRANCH (physical branch record)
-- ────────────────────────────────────────────
INSERT INTO restaurant_branch (branch_name, restaurant_id, address, pincode_id, phone, email, is_active, is_deleted, created_at, updated_at)
SELECT 'Main Branch - Fort', v_rest_id, '123, MG Road, Fort, Mumbai', v_pincode_id, '9800000002', 'sgbranch@demo.com', true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM restaurant_branch WHERE restaurant_id = v_rest_id AND branch_name = 'Main Branch - Fort');

-- ────────────────────────────────────────────
-- 5. SECTIONS
-- ────────────────────────────────────────────
INSERT INTO section (name, restaurant_id, branch_id, type, tax_percentage, service_charge_percentage)
VALUES ('AC Hall', v_rest_id, v_branch_id, 'indoor', 5.00, 0.00)
RETURNING id INTO v_sec1_id;

INSERT INTO section (name, restaurant_id, branch_id, type, tax_percentage, service_charge_percentage)
VALUES ('Outdoor Terrace', v_rest_id, v_branch_id, 'outdoor', 5.00, 0.00)
RETURNING id INTO v_sec2_id;

-- ────────────────────────────────────────────
-- 6. DINING TABLES
-- ────────────────────────────────────────────
INSERT INTO dining_tables (restaurant_id, branch_id, section_id, table_number, capacity, status, is_deleted, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, v_sec1_id, 'T-01', 4, 0, false, NOW(), NOW())
RETURNING id INTO v_tbl1_id;

INSERT INTO dining_tables (restaurant_id, branch_id, section_id, table_number, capacity, status, is_deleted, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, v_sec1_id, 'T-02', 4, 0, false, NOW(), NOW());
INSERT INTO dining_tables (restaurant_id, branch_id, section_id, table_number, capacity, status, is_deleted, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, v_sec1_id, 'T-03', 4, 0, false, NOW(), NOW());
INSERT INTO dining_tables (restaurant_id, branch_id, section_id, table_number, capacity, status, is_deleted, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, v_sec1_id, 'T-04', 6, 0, false, NOW(), NOW());
INSERT INTO dining_tables (restaurant_id, branch_id, section_id, table_number, capacity, status, is_deleted, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, v_sec1_id, 'T-05', 6, 0, false, NOW(), NOW());
INSERT INTO dining_tables (restaurant_id, branch_id, section_id, table_number, capacity, status, is_deleted, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, v_sec2_id, 'T-06', 4, 0, false, NOW(), NOW());
INSERT INTO dining_tables (restaurant_id, branch_id, section_id, table_number, capacity, status, is_deleted, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, v_sec2_id, 'T-07', 6, 0, false, NOW(), NOW());
INSERT INTO dining_tables (restaurant_id, branch_id, section_id, table_number, capacity, status, is_deleted, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, v_sec2_id, 'T-08', 6, 0, false, NOW(), NOW());

-- ────────────────────────────────────────────
-- 7. ADDONS + ADDON ITEMS
-- ────────────────────────────────────────────
INSERT INTO addons (name, description, restaurant_id, branch_id, min_addon, max_addon, is_multiple, show_online, show_in_captain, is_active, created_at, updated_at)
VALUES ('Spice Level', 'Choose your spice preference', v_rest_id, v_branch_id, 1, 1, false, true, true, true, NOW(), NOW())
RETURNING id INTO v_addon1_id;

INSERT INTO addons_items (addons_id, name, price, attribute, is_active, created_at, updated_at) VALUES (v_addon1_id, 'Mild',   0, 'spice', true, NOW(), NOW());
INSERT INTO addons_items (addons_id, name, price, attribute, is_active, created_at, updated_at) VALUES (v_addon1_id, 'Medium', 0, 'spice', true, NOW(), NOW());
INSERT INTO addons_items (addons_id, name, price, attribute, is_active, created_at, updated_at) VALUES (v_addon1_id, 'Hot',    0, 'spice', true, NOW(), NOW());

INSERT INTO addons (name, description, restaurant_id, branch_id, min_addon, max_addon, is_multiple, show_online, show_in_captain, is_active, created_at, updated_at)
VALUES ('Extra Bread', 'Add more bread items', v_rest_id, v_branch_id, 0, 3, true, true, true, true, NOW(), NOW())
RETURNING id INTO v_addon2_id;

INSERT INTO addons_items (addons_id, name, price, attribute, is_active, created_at, updated_at) VALUES (v_addon2_id, 'Naan',    30, 'bread', true, NOW(), NOW());
INSERT INTO addons_items (addons_id, name, price, attribute, is_active, created_at, updated_at) VALUES (v_addon2_id, 'Roti',    15, 'bread', true, NOW(), NOW());
INSERT INTO addons_items (addons_id, name, price, attribute, is_active, created_at, updated_at) VALUES (v_addon2_id, 'Paratha', 25, 'bread', true, NOW(), NOW());

-- ────────────────────────────────────────────
-- 8. MENU CATEGORIES
-- ────────────────────────────────────────────
INSERT INTO menu_category (restaurant_id, branch_id, name, description, priority, is_active, is_deleted, tax_percentage, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, 'Starters', 'Delicious starters and appetizers', 1, true, false, 5.00, NOW(), NOW())
RETURNING id INTO v_cat1_id;

INSERT INTO menu_category (restaurant_id, branch_id, name, description, priority, is_active, is_deleted, tax_percentage, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, 'Main Course', 'Rich and flavorful main dishes', 2, true, false, 5.00, NOW(), NOW())
RETURNING id INTO v_cat2_id;

INSERT INTO menu_category (restaurant_id, branch_id, name, description, priority, is_active, is_deleted, tax_percentage, created_at, updated_at)
VALUES (v_rest_id, v_branch_id, 'Beverages', 'Refreshing drinks and beverages', 3, true, false, 0.00, NOW(), NOW())
RETURNING id INTO v_cat3_id;

-- ────────────────────────────────────────────
-- 9. MENU SUBCATEGORIES
-- ────────────────────────────────────────────
INSERT INTO menu_subcategory (name, description, menu_category_id, restaurant_id, branch_id, priority, is_active, is_deleted, created_at, updated_at)
VALUES ('Veg Starters', 'Vegetarian appetizers', v_cat1_id, v_rest_id, v_branch_id, 1, true, false, NOW(), NOW())
RETURNING id INTO v_subcat1_id;

INSERT INTO menu_subcategory (name, description, menu_category_id, restaurant_id, branch_id, priority, is_active, is_deleted, created_at, updated_at)
VALUES ('Non-Veg Starters', 'Non-vegetarian appetizers', v_cat1_id, v_rest_id, v_branch_id, 2, true, false, NOW(), NOW())
RETURNING id INTO v_subcat2_id;

INSERT INTO menu_subcategory (name, description, menu_category_id, restaurant_id, branch_id, priority, is_active, is_deleted, created_at, updated_at)
VALUES ('Veg Main Course', 'Vegetarian mains', v_cat2_id, v_rest_id, v_branch_id, 1, true, false, NOW(), NOW())
RETURNING id INTO v_subcat3_id;

INSERT INTO menu_subcategory (name, description, menu_category_id, restaurant_id, branch_id, priority, is_active, is_deleted, created_at, updated_at)
VALUES ('Non-Veg Main Course', 'Non-vegetarian mains', v_cat2_id, v_rest_id, v_branch_id, 2, true, false, NOW(), NOW())
RETURNING id INTO v_subcat4_id;

-- ────────────────────────────────────────────
-- 10. MENU ITEMS
-- ────────────────────────────────────────────

-- Starters - Veg
INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id, addons_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted, is_recommended,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat1_id, v_subcat1_id, v_addon1_id,
    'Paneer Tikka', 'Marinated paneer grilled in tandoor with spices', 280, 320, true, true, true,
    5.00, 'INCLUSIVE', 1, true, false, true,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.5, 24, NOW())
RETURNING id INTO v_item1_id;

INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat1_id, v_subcat1_id,
    'Veg Spring Roll', 'Crispy spring rolls stuffed with seasoned vegetables', 180, 220, true, true, true,
    5.00, 'INCLUSIVE', 2, true, false,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.2, 15, NOW())
RETURNING id INTO v_item2_id;

INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat1_id, v_subcat1_id,
    'Hara Bhara Kebab', 'Spinach, peas and paneer patties grilled to perfection', 220, 260, true, true, true,
    5.00, 'INCLUSIVE', 3, true, false,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.3, 18, NOW())
RETURNING id INTO v_item3_id;

-- Starters - Non-Veg
INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id, addons_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted, is_recommended,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat1_id, v_subcat2_id, v_addon1_id,
    'Chicken Tikka', 'Juicy chicken marinated in yogurt and spices, grilled in tandoor', 320, 380, false, true, true,
    5.00, 'INCLUSIVE', 1, true, false, true,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.7, 38, NOW())
RETURNING id INTO v_item4_id;

INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id, addons_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat1_id, v_subcat2_id, v_addon1_id,
    'Fish Fry', 'Coastal style crispy fish marinated in tangy masala', 350, 400, false, true, true,
    5.00, 'INCLUSIVE', 2, true, false,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.4, 20, NOW())
RETURNING id INTO v_item5_id;

-- Main Course - Veg
INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id, addons_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted, is_recommended,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat2_id, v_subcat3_id, v_addon2_id,
    'Dal Makhani', 'Slow-cooked black lentils simmered overnight in butter and cream', 250, 290, true, true, true,
    5.00, 'INCLUSIVE', 1, true, false, true,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.8, 52, NOW())
RETURNING id INTO v_item6_id;

INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id, addons_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted, is_recommended,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat2_id, v_subcat3_id, v_addon2_id,
    'Paneer Butter Masala', 'Soft paneer cubes in rich buttery tomato gravy', 300, 350, true, true, true,
    5.00, 'INCLUSIVE', 2, true, false, true,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.6, 45, NOW())
RETURNING id INTO v_item7_id;

INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat2_id, v_subcat3_id,
    'Veg Biryani', 'Fragrant basmati rice layered with seasonal vegetables and whole spices', 280, 320, true, true, true,
    5.00, 'INCLUSIVE', 3, true, false,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.3, 32, NOW())
RETURNING id INTO v_item8_id;

-- Main Course - Non-Veg
INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id, addons_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted, is_recommended,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat2_id, v_subcat4_id, v_addon2_id,
    'Butter Chicken', 'Tender chicken in velvety tomato-butter sauce — our bestseller', 380, 440, false, true, true,
    5.00, 'INCLUSIVE', 1, true, false, true,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.9, 87, NOW())
RETURNING id INTO v_item9_id;

INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id, menu_subcategory_id, addons_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted, is_recommended,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat2_id, v_subcat4_id, v_addon1_id,
    'Mutton Rogan Josh', 'Kashmiri style slow-cooked mutton in aromatic gravy', 450, 520, false, true, true,
    5.00, 'INCLUSIVE', 2, true, false, true,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.7, 63, NOW())
RETURNING id INTO v_item10_id;

-- Beverages
INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat3_id,
    'Sweet Lassi', 'Chilled creamy yogurt drink sweetened to perfection', 80, 100, true, true, true,
    0.00, 'INCLUSIVE', 1, true, false,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.5, 41, NOW())
RETURNING id INTO v_item11_id;

INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat3_id,
    'Masala Chai', 'Spiced Indian tea brewed with ginger, cardamom and milk', 40, 50, true, true, true,
    0.00, 'INCLUSIVE', 2, true, false,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.6, 78, NOW());

INSERT INTO menu_items (restaurant_id, branch_id, menu_category_id,
    name, description, price, mrp, dietary_type, is_available, available_online,
    gst_percentage, gst_type, priority, is_active, is_deleted,
    system_rating, average_rating, rating_count, created_at)
VALUES (v_rest_id, v_branch_id, v_cat3_id,
    'Fresh Lime Soda', 'Fizzy lime soda with a hint of mint and black salt', 60, 80, true, true, true,
    0.00, 'INCLUSIVE', 3, true, false,
    ROUND((4.0 + RANDOM())::numeric, 2), 4.1, 29, NOW());

-- ────────────────────────────────────────────
-- 11. CUSTOMERS
-- ────────────────────────────────────────────
INSERT INTO customers (name, email, mobile_number, password, is_active, is_first_order, wallet_balance, referal_code, created_at, updated_at)
SELECT 'Amit Verma', 'amit.verma@demo.com', '9900000001', 'customer@123', true, false, 150.00, 'AMIT001', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE mobile_number = '9900000001');
SELECT id INTO v_cust1_id FROM customers WHERE mobile_number = '9900000001' LIMIT 1;

INSERT INTO customers (name, email, mobile_number, password, is_active, is_first_order, wallet_balance, referal_code, created_at, updated_at)
SELECT 'Neha Gupta', 'neha.gupta@demo.com', '9900000002', 'customer@123', true, false, 0.00, 'NEHA002', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE mobile_number = '9900000002');
SELECT id INTO v_cust2_id FROM customers WHERE mobile_number = '9900000002' LIMIT 1;

-- ────────────────────────────────────────────
-- 12. CUSTOMER DELIVERY ADDRESSES
-- ────────────────────────────────────────────
INSERT INTO customer_delivery_addresses (customer_id, address_type, address_line1, address_line2, pincode_id, latitude, longitude, landmark, is_default, is_active, created_at)
VALUES (v_cust1_id, 'HOME', '123, Marine Lines', 'Near Churchgate Station', v_pincode_id, 18.9434, 72.8232, 'Near HSBC Bank', true, true, NOW())
RETURNING id INTO v_addr1_id;

INSERT INTO customer_delivery_addresses (customer_id, address_type, address_line1, address_line2, pincode_id, latitude, longitude, landmark, is_default, is_active, created_at)
VALUES (v_cust2_id, 'HOME', '45, Hill Road', 'Bandra West', v_pincode_id, 19.0596, 72.8295, 'Near Linking Road Market', true, true, NOW())
RETURNING id INTO v_addr2_id;

-- ────────────────────────────────────────────
-- 13. PAYMENT GATEWAY
-- ────────────────────────────────────────────
INSERT INTO payment_gateway (restaurant_id, status, allow_cod, vendorname, title, payment_method)
SELECT v_rest_id, true, true, 'COD', 'Cash on Delivery', 'COD'
WHERE NOT EXISTS (SELECT 1 FROM payment_gateway WHERE restaurant_id = v_rest_id);
SELECT id INTO v_pgw_id FROM payment_gateway WHERE restaurant_id = v_rest_id LIMIT 1;

-- ────────────────────────────────────────────
-- 14. RESTAURANT HOURS (all 7 days)
-- ────────────────────────────────────────────
INSERT INTO restaurant_hours (restaurant_id, branch_id, day_of_week, opening_time, closing_time, is_closed, created_at, updated_at) VALUES (v_rest_id, v_branch_id, 'MONDAY',    '11:00', '23:00', false, NOW(), NOW());
INSERT INTO restaurant_hours (restaurant_id, branch_id, day_of_week, opening_time, closing_time, is_closed, created_at, updated_at) VALUES (v_rest_id, v_branch_id, 'TUESDAY',   '11:00', '23:00', false, NOW(), NOW());
INSERT INTO restaurant_hours (restaurant_id, branch_id, day_of_week, opening_time, closing_time, is_closed, created_at, updated_at) VALUES (v_rest_id, v_branch_id, 'WEDNESDAY', '11:00', '23:00', false, NOW(), NOW());
INSERT INTO restaurant_hours (restaurant_id, branch_id, day_of_week, opening_time, closing_time, is_closed, created_at, updated_at) VALUES (v_rest_id, v_branch_id, 'THURSDAY',  '11:00', '23:00', false, NOW(), NOW());
INSERT INTO restaurant_hours (restaurant_id, branch_id, day_of_week, opening_time, closing_time, is_closed, created_at, updated_at) VALUES (v_rest_id, v_branch_id, 'FRIDAY',    '11:00', '23:59', false, NOW(), NOW());
INSERT INTO restaurant_hours (restaurant_id, branch_id, day_of_week, opening_time, closing_time, is_closed, created_at, updated_at) VALUES (v_rest_id, v_branch_id, 'SATURDAY',  '10:00', '23:59', false, NOW(), NOW());
INSERT INTO restaurant_hours (restaurant_id, branch_id, day_of_week, opening_time, closing_time, is_closed, created_at, updated_at) VALUES (v_rest_id, v_branch_id, 'SUNDAY',    '11:00', '22:00', false, NOW(), NOW());

-- ────────────────────────────────────────────
-- 15. DELIVERY ZONES
-- ────────────────────────────────────────────
INSERT INTO delivery_zones (branch_id, zone_name, description, radius_km_from, radius_km_to, delivery_charge, delivery_time_minutes, is_active, created_at)
VALUES (v_branch_id, 'Zone 1 - Nearby', '0 to 5 km radius', 0, 5, 40.00, 20, true, NOW());
INSERT INTO delivery_zones (branch_id, zone_name, description, radius_km_from, radius_km_to, delivery_charge, delivery_time_minutes, is_active, created_at)
VALUES (v_branch_id, 'Zone 2 - Extended', '5 to 10 km radius', 5, 10, 80.00, 40, true, NOW());

-- ────────────────────────────────────────────
-- 16. BUSINESS SETTINGS
-- ────────────────────────────────────────────
INSERT INTO business_settings (
    restaurant_id, organisation_name, business_name, email, phone,
    address, theme_mode, primary_color, secondary_color, font_color,
    referral_enabled, referral_amount,
    marquee_is_live, marquee_text, marquee_bg_color, marquee_text_color, marquee_speed,
    created_at, updated_at
)
SELECT
    v_rest_id, 'Spice Garden Pvt Ltd', 'Spice Garden Restaurant', 'info@spicegarden.in', '9800000001',
    '123, MG Road, Fort, Mumbai - 400001', 'light', '#FF5722', '#FFA726', '#FFFFFF',
    true, 50.00,
    true, 'Welcome to Spice Garden! Enjoy authentic Indian cuisine. Free delivery on orders above Rs 500!',
    '#1a1a2e', '#ffffff', 30,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE restaurant_id = v_rest_id);

-- ────────────────────────────────────────────
-- 17. MARQUEE MESSAGES
-- ────────────────────────────────────────────
INSERT INTO marquee_messages (restaurant_id, message, bg_color, text_color, speed, font_weight, is_active, display_order, created_at, updated_at)
VALUES (v_rest_id, 'Welcome to Spice Garden! Authentic Indian flavors since 2015.', '#FF5722', '#FFFFFF', 30, '600', true, 1, NOW(), NOW());
INSERT INTO marquee_messages (restaurant_id, message, bg_color, text_color, speed, font_weight, is_active, display_order, created_at, updated_at)
VALUES (v_rest_id, 'Free delivery on orders above Rs 500! Use code FLAT100 for Rs 100 off.', '#1a1a2e', '#FFFFFF', 30, '500', true, 2, NOW(), NOW());

-- ────────────────────────────────────────────
-- 18. COUPONS
-- ────────────────────────────────────────────
INSERT INTO coupon (coupon_name, coupon_code, discount_amount, validity, display_on_screen,
    description, title, branch_id, restaurant_id, added_by_id,
    is_percent, global, usage_limit, quantity, first_order, is_delete, created_at)
VALUES ('First Order 20% Off', 'WELCOME20', 20.00, '2026-12-31', true,
    '20% off on your first order at Spice Garden', 'First Order Offer',
    v_branch_id, v_rest_id, v_rest_id,
    true, true, 1, 1000, true, false, NOW());

INSERT INTO coupon (coupon_name, coupon_code, discount_amount, validity, display_on_screen,
    description, title, branch_id, restaurant_id, added_by_id,
    is_percent, global, usage_limit, quantity, first_order, is_delete, created_at)
VALUES ('Flat Rs 100 Off', 'FLAT100', 100.00, '2026-12-31', true,
    'Flat Rs 100 off on orders above Rs 500', 'Weekend Special',
    v_branch_id, v_rest_id, v_rest_id,
    false, true, 5, 500, false, false, NOW());

-- ────────────────────────────────────────────
-- 19. ORDERS
-- ────────────────────────────────────────────

-- ORDER 1: DINE_IN - DELIVERED - Cash paid
-- Amit on Table T-01, Raj (captain), Chef Mohan (kitchen), Priya (cashier)
INSERT INTO orders (
    order_number, order_type, restaurant_id, branch_id,
    captain_id, kitchen_id, cashier_id,
    customer_id, section_id, table_number,
    status, payment_status, payment_method,
    subtotal, tax_amount, ser_charge_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone, customer_email,
    kitchen_accept_at, kitchen_ready_at, completed_at, created_at, updated_at
) VALUES (
    'ORD-2025-0001', 'DINE_IN', v_rest_id, v_branch_id,
    v_captain_id, v_kitchen_id, v_cashier_id,
    v_cust1_id, v_sec1_id, 'T-01',
    'DELIVERED', 'PAID', 'CASH',
    940.00, 47.00, 0.00, 0.00, 0.00, 987.00,
    'Amit Verma', '9900000001', 'amit.verma@demo.com',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'
) RETURNING id INTO v_order1_id;

INSERT INTO order_items (order_id, menu_item_id, kitchen_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order1_id, v_item1_id, v_kitchen_id, 'Paneer Tikka', 280.00, 2, 0.00, 560.00, 'DELIVERED', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour 30 minutes');
INSERT INTO order_items (order_id, menu_item_id, kitchen_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order1_id, v_item9_id, v_kitchen_id, 'Butter Chicken', 380.00, 1, 0.00, 380.00, 'DELIVERED', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour 30 minutes');
INSERT INTO order_items (order_id, menu_item_id, kitchen_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order1_id, v_item11_id, v_kitchen_id, 'Sweet Lassi', 80.00, 2, 0.00, 160.00, 'DELIVERED', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour 30 minutes');

INSERT INTO order_payments (online_order_id, restaurant_id, branch_id, payment_method, amount, payment_status, payment_time, is_reconciled, created_at, updated_at)
VALUES (v_order1_id, v_rest_id, v_branch_id, 'CASH', 987.00, 'PAID', NOW() - INTERVAL '1 hour', false, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

-- ORDER 2: DELIVERY - DELIVERED - Online paid
-- Neha, Vikram (delivery), Chef Mohan (kitchen)
INSERT INTO orders (
    order_number, order_type, restaurant_id, branch_id,
    kitchen_id, delivery_id, cashier_id,
    customer_id, customer_delivery_addresses_id,
    status, payment_status, payment_method,
    subtotal, tax_amount, ser_charge_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone, customer_email,
    kitchen_accept_at, kitchen_ready_at, delivery_accept_at, completed_at, created_at, updated_at
) VALUES (
    'ORD-2025-0002', 'DELIVERY', v_rest_id, v_branch_id,
    v_kitchen_id, v_delivery_id, v_cashier_id,
    v_cust2_id, v_addr2_id,
    'DELIVERED', 'PAID', 'ONLINE',
    630.00, 28.00, 0.00, 0.00, 40.00, 698.00,
    'Neha Gupta', '9900000002', 'neha.gupta@demo.com',
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 30 minutes',
    NOW() - INTERVAL '4 hours 20 minutes', NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'
) RETURNING id INTO v_order2_id;

INSERT INTO order_items (order_id, menu_item_id, kitchen_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order2_id, v_item6_id, v_kitchen_id, 'Dal Makhani', 250.00, 1, 0.00, 250.00, 'DELIVERED', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO order_items (order_id, menu_item_id, kitchen_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order2_id, v_item7_id, v_kitchen_id, 'Paneer Butter Masala', 300.00, 1, 0.00, 300.00, 'DELIVERED', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO order_items (order_id, menu_item_id, kitchen_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order2_id, v_item11_id, v_kitchen_id, 'Sweet Lassi', 80.00, 1, 0.00, 80.00, 'DELIVERED', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours 30 minutes');

INSERT INTO order_payments (online_order_id, restaurant_id, branch_id, payment_method, payment_gateway, amount, payment_status, payment_time, is_reconciled, created_at, updated_at)
VALUES (v_order2_id, v_rest_id, v_branch_id, 'ONLINE', 'Razorpay', 698.00, 'PAID', NOW() - INTERVAL '6 hours', false, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours');

-- ORDER 3: DINE_IN - PREPARING (active/live order)
-- Amit on Table T-02
INSERT INTO orders (
    order_number, order_type, restaurant_id, branch_id,
    captain_id, kitchen_id,
    customer_id, section_id, table_number,
    status, payment_status, payment_method,
    subtotal, tax_amount, ser_charge_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone,
    kitchen_accept_at, created_at, updated_at
) VALUES (
    'ORD-2025-0003', 'DINE_IN', v_rest_id, v_branch_id,
    v_captain_id, v_kitchen_id,
    v_cust1_id, v_sec1_id, 'T-02',
    'PREPARING', 'PENDING', 'CASH',
    800.00, 40.00, 0.00, 0.00, 0.00, 840.00,
    'Amit Verma', '9900000001',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes'
) RETURNING id INTO v_order3_id;

INSERT INTO order_items (order_id, menu_item_id, kitchen_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order3_id, v_item4_id, v_kitchen_id, 'Chicken Tikka', 320.00, 1, 0.00, 320.00, 'PREPARING', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '15 minutes');
INSERT INTO order_items (order_id, menu_item_id, kitchen_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order3_id, v_item10_id, v_kitchen_id, 'Mutton Rogan Josh', 450.00, 1, 0.00, 450.00, 'PREPARING', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '15 minutes');

-- ORDER 4: DELIVERY - PENDING (brand new order)
-- Neha placed just now, not yet assigned to delivery
INSERT INTO orders (
    order_number, order_type, restaurant_id, branch_id,
    customer_id, customer_delivery_addresses_id,
    status, payment_status, payment_method,
    subtotal, tax_amount, ser_charge_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone,
    created_at, updated_at
) VALUES (
    'ORD-2025-0004', 'DELIVERY', v_rest_id, v_branch_id,
    v_cust2_id, v_addr2_id,
    'PENDING', 'PENDING', 'COD',
    360.00, 18.00, 0.00, 0.00, 40.00, 418.00,
    'Neha Gupta', '9900000002',
    NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'
) RETURNING id INTO v_order4_id;

INSERT INTO order_items (order_id, menu_item_id, menu_item_name, price, quantity, addons_total, item_total, status, created_at, updated_at)
VALUES (v_order4_id, v_item2_id, 'Veg Spring Roll', 180.00, 2, 0.00, 360.00, 'PENDING', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes');

-- ORDER 5: TAKEAWAY - CANCELLED
-- Amit cancelled yesterday
INSERT INTO orders (
    order_number, order_type, restaurant_id, branch_id,
    customer_id,
    status, payment_status, payment_method,
    subtotal, tax_amount, ser_charge_amount, discount_amount, delivery_fee, total_amount,
    customer_name, customer_phone,
    created_at, updated_at
) VALUES (
    'ORD-2025-0005', 'TAKEAWAY', v_rest_id, v_branch_id,
    v_cust1_id,
    'CANCELLED', 'PENDING', 'COD',
    350.00, 0.00, 0.00, 0.00, 0.00, 350.00,
    'Amit Verma', '9900000001',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
);

-- ────────────────────────────────────────────
-- DONE - Print summary
-- ────────────────────────────────────────────
RAISE NOTICE '============================================';
RAISE NOTICE 'SPICE GARDEN - Seed data inserted!';
RAISE NOTICE '--------------------------------------------';
RAISE NOTICE 'RESTAURANT  | mobile: 9800000001 | pass: spice@123';
RAISE NOTICE 'BRANCH USER | mobile: 9800000002 | pass: branch@123';
RAISE NOTICE 'CAPTAIN     | mobile: 9800000003 | pass: captain@123';
RAISE NOTICE 'KITCHEN     | mobile: 9800000004 | pass: kitchen@123';
RAISE NOTICE 'DELIVERY    | mobile: 9800000005 | pass: delivery@123';
RAISE NOTICE 'CASHIER     | mobile: 9800000006 | pass: cashier@123';
RAISE NOTICE 'CUSTOMER 1  | mobile: 9900000001 | pass: customer@123';
RAISE NOTICE 'CUSTOMER 2  | mobile: 9900000002 | pass: customer@123';
RAISE NOTICE '--------------------------------------------';
RAISE NOTICE 'Menu: 3 categories, 4 subcategories, 11 items';
RAISE NOTICE 'Tables: 8 tables in 2 sections';
RAISE NOTICE 'Orders: 5 (delivered x2, preparing x1, pending x1, cancelled x1)';
RAISE NOTICE 'Coupons: WELCOME20 (20%% off), FLAT100 (Rs 100 off)';
RAISE NOTICE '============================================';

END $$;
