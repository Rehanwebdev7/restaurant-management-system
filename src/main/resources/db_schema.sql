-- ================================================================
-- RMS Database Schema - PostgreSQL / Supabase
-- Generated from actual JPA entity definitions
-- Dependency order is strictly maintained
-- Run in Supabase Dashboard → SQL Editor
-- ================================================================

-- ────────────────────────────────────────────
-- 1. GEOGRAPHY (no dependencies)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    state_id INTEGER REFERENCES states(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pincodes (
    id BIGSERIAL PRIMARY KEY,
    pincode VARCHAR(255) NOT NULL,
    state_id INTEGER REFERENCES states(id),
    city_id INTEGER REFERENCES cities(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- ────────────────────────────────────────────
-- 2. CONFIG TABLES (no dependencies)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS global_setting (
    id BIGSERIAL PRIMARY KEY,
    cron_on_off VARCHAR(255),
    lock_system VARCHAR(255),
    maintainance_mode VARCHAR(255),
    system_ip VARCHAR(255),
    latest_version VARCHAR(255),
    force_update VARCHAR(255),
    min_amount NUMERIC(15,2)
);

CREATE TABLE IF NOT EXISTS app_version (
    id BIGSERIAL PRIMARY KEY,
    platform VARCHAR(255),
    version_name VARCHAR(255),
    latest_version VARCHAR(255),
    minimum_version VARCHAR(255),
    is_force_update VARCHAR(255),
    playstore_url VARCHAR(255),
    app_store_url VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_formates (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255),
    entity_id VARCHAR(255),
    message VARCHAR(255),
    sender_id VARCHAR(255),
    service VARCHAR(255),
    template_id VARCHAR(255),
    user_id INTEGER
);

CREATE TABLE IF NOT EXISTS api_config (
    id SERIAL PRIMARY KEY,
    service VARCHAR(255),
    credentials JSONB
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id BIGSERIAL PRIMARY KEY,
    plan_name VARCHAR(255),
    description TEXT,
    price NUMERIC(15,2),
    duration_days INTEGER,
    max_branch INTEGER,
    max_kitchen INTEGER,
    max_delivery_boy INTEGER,
    features TEXT,
    is_active BOOLEAN,
    sort_order INTEGER,
    is_deleted BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- ────────────────────────────────────────────
-- 3. USERS (self-referential FK)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    mobile VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(255),
    parent_id BIGINT REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    branch_id BIGINT REFERENCES users(id),
    approval_status VARCHAR(255),
    approval_notes VARCHAR(255),
    gst_number VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    pincode VARCHAR(255),
    balance NUMERIC(10,2),
    outstanding_balance NUMERIC(10,2),
    is_order_stopped BOOLEAN DEFAULT false,
    order_stopped_at TIMESTAMP,
    order_stopped_by VARCHAR(255)
);

-- ────────────────────────────────────────────
-- 4. TABLES THAT DEPEND ON USERS ONLY
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sliders (
    id BIGSERIAL PRIMARY KEY,
    image_url VARCHAR(255),
    drive_image_url VARCHAR(255),
    title VARCHAR(255),
    platform VARCHAR(255),
    description VARCHAR(255),
    restaurant_id BIGINT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS marquee_messages (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    message VARCHAR(500) NOT NULL,
    bg_color VARCHAR(20),
    text_color VARCHAR(20),
    speed INTEGER,
    font_weight VARCHAR(10),
    is_active BOOLEAN,
    schedule_start TIMESTAMP,
    schedule_end TIMESTAMP,
    display_order INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_settings (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    domain_url VARCHAR(255),
    theme_mode VARCHAR(10),
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    tertiary_color VARCHAR(20),
    font_color VARCHAR(20),
    font_name VARCHAR(50),
    logo_url VARCHAR(500),
    drive_logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    drive_favicon_url VARCHAR(500),
    organisation_name VARCHAR(255),
    business_name VARCHAR(255),
    authorised_person_name VARCHAR(255),
    entity_type VARCHAR(50),
    gst_number VARCHAR(20),
    gst_certificate_url VARCHAR(500),
    drive_gst_certificate_url VARCHAR(500),
    fssai_number VARCHAR(20),
    pan_company VARCHAR(15),
    pan_signatory VARCHAR(15),
    aadhaar_number VARCHAR(15),
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    ambulance_number VARCHAR(20),
    google_map_embed TEXT,
    address TEXT,
    social_media_links TEXT,
    google_rating_url VARCHAR(500),
    marquee_text VARCHAR(500),
    marquee_is_live BOOLEAN,
    marquee_bg_color VARCHAR(20),
    marquee_text_color VARCHAR(20),
    marquee_speed INTEGER,
    about_us TEXT,
    privacy_policy TEXT,
    terms_conditions TEXT,
    refund_policy TEXT,
    cancellation_policy TEXT,
    our_mission TEXT,
    our_vision TEXT,
    filter_recommended BOOLEAN,
    filter_popular BOOLEAN,
    filter_discount BOOLEAN,
    filter_fast_serving BOOLEAN,
    filter_price BOOLEAN,
    filter_rating BOOLEAN,
    filter_veg_nonveg BOOLEAN,
    referral_amount NUMERIC(15,2),
    referral_enabled BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS section (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    restaurant_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    type VARCHAR(255),
    tax_percentage NUMERIC(15,2),
    service_charge_percentage NUMERIC(15,2)
);

CREATE TABLE IF NOT EXISTS dining_tables (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    table_number VARCHAR(255),
    section_id BIGINT REFERENCES section(id),
    capacity INTEGER,
    status INTEGER,
    qr_code VARCHAR(255),
    notes VARCHAR(255),
    is_deleted BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurant_branch (
    id BIGSERIAL PRIMARY KEY,
    branch_name VARCHAR(255),
    restaurant_id BIGINT REFERENCES users(id),
    address VARCHAR(255),
    pincode_id BIGINT REFERENCES pincodes(id),
    latitude NUMERIC(15,8),
    longitude NUMERIC(15,8),
    phone VARCHAR(255),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurant_hours (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    day_of_week VARCHAR(255),
    special_date DATE,
    occasion_name VARCHAR(255),
    opening_time TIME,
    closing_time TIME,
    is_closed BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_zones (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT REFERENCES users(id),
    zone_name VARCHAR(255),
    description VARCHAR(255),
    radius_km_from DOUBLE PRECISION,
    radius_km_to DOUBLE PRECISION,
    delivery_charge NUMERIC(15,2),
    delivery_time_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    photo_url VARCHAR(500),
    drive_photo_url VARCHAR(500),
    display_order INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_approval (
    id BIGSERIAL PRIMARY KEY,
    email BOOLEAN,
    name VARCHAR(255),
    sms BOOLEAN,
    whatsapp BOOLEAN,
    app BOOLEAN
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    user_role VARCHAR(255),
    action VARCHAR(255),
    data VARCHAR(255),
    ip_address VARCHAR(255),
    user_agent VARCHAR(255),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_logs (
    id SERIAL PRIMARY KEY,
    service_type VARCHAR(255),
    txn_id VARCHAR(255),
    request TEXT,
    response JSONB,
    date DATE,
    time TIME,
    operator_no VARCHAR(255),
    api_ref_id VARCHAR(255),
    latency INTEGER
);

CREATE TABLE IF NOT EXISTS otp_logs (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(255),
    mobile_number VARCHAR(255),
    otp_code VARCHAR(255),
    otp_type VARCHAR(255),
    type VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    is_used BOOLEAN DEFAULT false,
    attempt_count INTEGER,
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    verified_at TIMESTAMP,
    used_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),
    mobile VARCHAR(255),
    token VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_category (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    name VARCHAR(255),
    description VARCHAR(255),
    priority INTEGER,
    is_active BOOLEAN,
    is_deleted BOOLEAN,
    icon_url VARCHAR(255),
    drive_icon_url VARCHAR(255),
    tax_percentage NUMERIC(15,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_subcategory (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    menu_category_id BIGINT REFERENCES menu_category(id),
    restaurant_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    priority INTEGER,
    is_active BOOLEAN,
    icon_url VARCHAR(255),
    drive_icon_url VARCHAR(255),
    is_deleted BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addons (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    restaurant_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    min_addon INTEGER,
    max_addon INTEGER,
    is_multiple BOOLEAN,
    show_online BOOLEAN,
    show_in_captain BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_gateway (
    id SERIAL PRIMARY KEY,
    status BOOLEAN,
    allow_cod BOOLEAN,
    vendorname VARCHAR(255),
    on_of VARCHAR(255),
    title VARCHAR(255),
    payment_method VARCHAR(255),
    credentials JSONB,
    restaurant_id BIGINT REFERENCES users(id)
);

-- ────────────────────────────────────────────
-- 5. CUSTOMERS (depends on users)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    mobile_number VARCHAR(255),
    password VARCHAR(255),
    photo_url TEXT,
    drive_photo_url TEXT,
    date_of_birth DATE,
    is_active BOOLEAN,
    is_first_order BOOLEAN,
    created_at TIMESTAMP,
    user_id BIGINT REFERENCES users(id),
    is_deleted INTEGER,
    allow_cod BOOLEAN,
    referal_code VARCHAR(255) UNIQUE,
    referred_by_id BIGINT,
    wallet_balance NUMERIC(15,2),
    referral_signup_bonus NUMERIC(15,2),
    referral_recurring_bonus NUMERIC(15,2),
    updated_at TIMESTAMP
);

-- ────────────────────────────────────────────
-- 6. DEPENDS ON BOTH USERS AND CUSTOMERS
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users_profile (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    restaurant_name VARCHAR(255),
    gst_number VARCHAR(255),
    gst_url VARCHAR(255),
    drive_gst_url VARCHAR(255),
    licence_url VARCHAR(255),
    drive_licence_url VARCHAR(255),
    address VARCHAR(255),
    city_id INTEGER REFERENCES cities(id),
    state_id INTEGER REFERENCES states(id),
    country VARCHAR(255),
    pincode_id BIGINT REFERENCES pincodes(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    timezone VARCHAR(255),
    currency_code VARCHAR(255),
    logo_url VARCHAR(255),
    drive_logo_url VARCHAR(255),
    fevicon_url VARCHAR(255),
    drive_fevicon_url VARCHAR(255),
    website VARCHAR(255),
    phone VARCHAR(255),
    alternate_phone VARCHAR(255),
    secondary VARCHAR(255),
    tertiary VARCHAR(255),
    font_colour VARCHAR(255),
    font_name VARCHAR(255),
    other_doc_url VARCHAR(255),
    drive_other_doc_url VARCHAR(255),
    description VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    primarys VARCHAR(255),
    screen VARCHAR(255),
    pncode VARCHAR(255),
    booking_buffer_minutes VARCHAR(255),
    booking_grace_minutes VARCHAR(255),
    booking_payment_required BOOLEAN,
    booking_payment_amount NUMERIC(15,2),
    social_media_details JSONB
);

CREATE TABLE IF NOT EXISTS bank_details (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    customer_id BIGINT REFERENCES customers(id),
    account_number VARCHAR(255),
    ifsc_code VARCHAR(255),
    upi VARCHAR(255),
    status VARCHAR(255),
    name VARCHAR(255),
    is_delete VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    approved_by_id BIGINT REFERENCES users(id),
    approved_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_token (
    id BIGSERIAL PRIMARY KEY,
    platform VARCHAR(255),
    token VARCHAR(255),
    users_id BIGINT REFERENCES users(id),
    customers_id BIGINT REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    plan_id BIGINT REFERENCES subscription_plans(plan_id),
    start_date DATE,
    end_date DATE,
    grace_end_date DATE,
    amount_paid NUMERIC(10,2),
    discount_amount NUMERIC(10,2),
    status VARCHAR(20),
    coupon_code VARCHAR(50),
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outstanding (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    deduct_by_id BIGINT REFERENCES users(id),
    mode INTEGER,
    service VARCHAR(255),
    opening_bal DECIMAL(12,2) DEFAULT 0.00,
    amount NUMERIC(15,2),
    closing_bal DECIMAL(12,2) DEFAULT 0.00,
    order_id VARCHAR(255),
    remark VARCHAR(255),
    date DATE,
    time VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS referral_contacts (
    id BIGSERIAL PRIMARY KEY,
    referrer_customer_id BIGINT REFERENCES customers(id),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(255),
    normalized_phone VARCHAR(255),
    mapped_customer_id BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT,
    user_id BIGINT,
    restaurant_id BIGINT,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(255),
    order_id BIGINT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    read_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    is_active BOOLEAN DEFAULT false,
    menu_category_id BIGINT REFERENCES menu_category(id),
    menu_subcategory_id BIGINT REFERENCES menu_subcategory(id),
    addons_id BIGINT REFERENCES addons(id),
    name VARCHAR(255),
    description VARCHAR(255),
    price NUMERIC(15,2),
    mrp NUMERIC(15,2),
    half_price NUMERIC(15,2),
    half_mrp NUMERIC(15,2),
    qtr_price NUMERIC(15,2),
    qtr_mrp NUMERIC(15,2),
    cost_price NUMERIC(15,2),
    dietary_type BOOLEAN,
    is_available BOOLEAN,
    available_online BOOLEAN,
    image_url VARCHAR(255),
    drive_image_url VARCHAR(255),
    preparation_minutes INTEGER,
    delivery_minutes INTEGER,
    is_recommended BOOLEAN,
    spice_level VARCHAR(255),
    gst_percentage NUMERIC(15,2),
    gst_type VARCHAR(10),
    priority INTEGER,
    created_at TIMESTAMP,
    is_deleted BOOLEAN,
    system_rating NUMERIC(3,2),
    average_rating NUMERIC(3,2),
    rating_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS addons_items (
    id BIGSERIAL PRIMARY KEY,
    addons_id BIGINT REFERENCES addons(id),
    name VARCHAR(255),
    price NUMERIC(15,2),
    attribute VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_item_addons (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT REFERENCES menu_items(id),
    addon_id BIGINT REFERENCES addons(id),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon (
    id SERIAL PRIMARY KEY,
    coupon_name VARCHAR(255),
    coupon_code VARCHAR(255),
    discount_amount NUMERIC(15,2),
    validity DATE,
    display_on_screen BOOLEAN,
    logo VARCHAR(255),
    drive_logo VARCHAR(255),
    is_delete BOOLEAN,
    description TEXT,
    title VARCHAR(255),
    branch_id BIGINT REFERENCES users(id),
    restaurant_id BIGINT REFERENCES users(id),
    added_by_id BIGINT REFERENCES users(id),
    is_percent BOOLEAN,
    global BOOLEAN,
    usage_limit INTEGER,
    created_at TIMESTAMP,
    first_order BOOLEAN,
    quantity INTEGER
);

CREATE TABLE IF NOT EXISTS coupon_mapping (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER REFERENCES coupon(id),
    menu_item_id BIGINT REFERENCES menu_items(id)
);

CREATE TABLE IF NOT EXISTS coupon_usage_limit (
    id SERIAL PRIMARY KEY,
    branch_id BIGINT REFERENCES users(id),
    restaurant_id BIGINT REFERENCES users(id),
    customer_id BIGINT REFERENCES users(id),
    coupon_code VARCHAR(255),
    rem_usage_limit INTEGER,
    last_update_at TIMESTAMP
);

-- ────────────────────────────────────────────
-- 7. TABLE BOOKING (depends on dining_tables, users, customers)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS table_booking (
    id BIGSERIAL PRIMARY KEY,
    table_id BIGINT REFERENCES dining_tables(id),
    status VARCHAR(255),
    booking_date DATE,
    booking_time TIME,
    users_id BIGINT REFERENCES users(id),
    customer_id BIGINT REFERENCES customers(id),
    payment_status VARCHAR(255),
    amount NUMERIC(15,2)
);

-- ────────────────────────────────────────────
-- 8. CUSTOMER ADDRESSES (depends on customers, pincodes)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_delivery_addresses (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id),
    address_type VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    pincode_id BIGINT REFERENCES pincodes(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    landmark VARCHAR(255),
    delivery_instructions VARCHAR(255),
    is_default BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP
);

-- ────────────────────────────────────────────
-- 9. ORDERS (depends on everything above)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES users(id),
    dining_id BIGINT REFERENCES users(id),
    captain_id BIGINT REFERENCES users(id),
    kitchen_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    delivery_id BIGINT REFERENCES users(id),
    order_number VARCHAR(255) UNIQUE,
    order_type VARCHAR(255),
    customer_id BIGINT REFERENCES customers(id),
    cashier_id BIGINT REFERENCES users(id),
    customer_delivery_addresses_id BIGINT REFERENCES customer_delivery_addresses(id),
    table_number VARCHAR(255),
    status VARCHAR(255),
    coupon_code VARCHAR(255),
    payment_status VARCHAR(255),
    payment_method VARCHAR(255),
    payment_remarks TEXT,
    subtotal NUMERIC(15,2),
    tax_amount NUMERIC(15,2),
    ser_charge_amount NUMERIC(15,2),
    discount_amount NUMERIC(15,2),
    delivery_fee NUMERIC(15,2),
    total_amount NUMERIC(15,2),
    wallet_amount_used NUMERIC(15,2),
    special_instructions VARCHAR(255),
    estimated_time INTEGER,
    created_at TIMESTAMP,
    kitchen_accept_at TIMESTAMP,
    kitchen_ready_at TIMESTAMP,
    delivery_accept_at TIMESTAMP,
    updated_at TIMESTAMP,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(255),
    customer_email VARCHAR(255),
    bank_ref_num VARCHAR(255),
    api_ref_num VARCHAR(255),
    customer_feedback TEXT,
    payment_gateway_id INTEGER REFERENCES payment_gateway(id),
    table_booking_id BIGINT REFERENCES table_booking(id),
    delivery_status VARCHAR(255),
    completed_at TIMESTAMP
);

-- ────────────────────────────────────────────
-- 10. ORDER ITEMS (depends on orders, menu_items, users)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    menu_item_id BIGINT REFERENCES menu_items(id),
    menu_item_name VARCHAR(255),
    price NUMERIC(15,2),
    quantity INTEGER,
    addons_total NUMERIC(15,2),
    special_instructions VARCHAR(255),
    item_total NUMERIC(15,2),
    status VARCHAR(255),
    kitchen_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_addons_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    quantity VARCHAR(255),
    price NUMERIC(15,2),
    order_item_id BIGINT REFERENCES order_items(id),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_payments (
    id BIGSERIAL PRIMARY KEY,
    online_order_id BIGINT REFERENCES orders(id),
    restaurant_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES users(id),
    payment_method VARCHAR(255),
    payment_gateway VARCHAR(255),
    gateway_transaction_id VARCHAR(255),
    amount NUMERIC(15,2),
    payment_status VARCHAR(255),
    payment_time TIMESTAMP,
    refund_amount NUMERIC(15,2),
    refund_reason VARCHAR(255),
    refund_time TIMESTAMP,
    is_reconciled BOOLEAN,
    reconciled_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- ────────────────────────────────────────────
-- 11. WALLET TRANSACTIONS (depends on orders, bank_details)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_topup_request (
    id SERIAL PRIMARY KEY,
    amount NUMERIC(15,2),
    approved_by_id BIGINT REFERENCES users(id),
    approved_date TIMESTAMP,
    date TIMESTAMP,
    mode INTEGER,
    order_id VARCHAR(255),
    reason VARCHAR(255),
    recorn INTEGER,
    remark VARCHAR(255),
    status VARCHAR(255),
    time VARCHAR(255),
    trans_date TIMESTAMP,
    utr VARCHAR(255),
    user_id BIGINT REFERENCES users(id),
    bank_id BIGINT REFERENCES bank_details(id),
    request_type VARCHAR(255),
    customer_id BIGINT REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    mode INTEGER,
    op_bal NUMERIC(15,2),
    amount NUMERIC(15,2),
    closing_bal NUMERIC(15,2),
    user_id BIGINT REFERENCES users(id),
    order_id BIGINT REFERENCES orders(id),
    bank_ref_id VARCHAR(255),
    bank_detail_id BIGINT REFERENCES bank_details(id),
    customer_id BIGINT REFERENCES customers(id),
    message TEXT,
    status VARCHAR(255),
    date DATE,
    time TIME
);

-- ────────────────────────────────────────────
-- 12. MISC (depend on menu_items, dining_tables)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_item_ratings (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT REFERENCES menu_items(id),
    mobile_number VARCHAR(20),
    rating INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS table_release_schedule (
    id BIGSERIAL PRIMARY KEY,
    dining_table_id BIGINT NOT NULL,
    release_at TIMESTAMP NOT NULL,
    processed BOOLEAN NOT NULL,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);

-- ────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_referal_code ON customers(referal_code);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(menu_category_id);

CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_pincodes_city_id ON pincodes(city_id);

CREATE INDEX IF NOT EXISTS idx_table_release_date ON table_release_schedule(release_at);
CREATE INDEX IF NOT EXISTS idx_otp_logs_mobile ON otp_logs(mobile_number);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires ON otp_logs(expires_at);

-- ════════════════════════════════════════════
-- Schema creation complete. (51 tables)
-- ════════════════════════════════════════════
