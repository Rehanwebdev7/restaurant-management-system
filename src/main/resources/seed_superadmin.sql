-- ================================================================
-- Superadmin + Admin Seed Users
-- ----------------------------------------------------------------
-- The primary seed_demo_data.sql ships restaurant/branch/captain/
-- kitchen/delivery/cashier/customer but NOT superadmin or admin.
-- Run this in Supabase SQL Editor (or psql) to create those.
--
-- Created 2026-06-23.
-- ================================================================

-- Superadmin
INSERT INTO users (name, email, mobile, password, role, is_active, is_deleted, created_at, updated_at)
SELECT 'Platform Superadmin', 'super@demo.com', '9800000007', 'super@123',
       'superadmin', true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '9800000007');

-- Admin
INSERT INTO users (name, email, mobile, password, role, is_active, is_deleted, created_at, updated_at)
SELECT 'Platform Admin', 'admin@demo.com', '9800000008', 'admin@123',
       'admin', true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '9800000008');

-- Verify
SELECT id, name, mobile, role, is_active FROM users
WHERE mobile IN ('9800000007', '9800000008')
ORDER BY mobile;
