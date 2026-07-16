-- ================================================================
-- PHASE 4 — DROP duplicate columns from users_profile (DESTRUCTIVE)
-- ----------------------------------------------------------------
-- Only run AFTER Phase 2 (backend refactor) + Phase 3 (entity cleanup)
-- have been deployed to production for AT LEAST 2-3 days and observed
-- stable. This is destructive and requires a snapshot rollback if issues.
--
-- Preflight (run manually before this script):
--   1. Confirm backend logs have zero references to dropped fields
--   2. Take Supabase DB snapshot ("PRE-Phase-4" backup)
--   3. Verify phase1_reconcile_business_settings.sql ran successfully
--
-- Run in: Supabase SQL Editor
-- Created: 2026-07-16
-- ================================================================

-- Drop 17 duplicate + typo columns from users_profile
ALTER TABLE users_profile
  DROP COLUMN IF EXISTS restaurant_name,
  DROP COLUMN IF EXISTS gst_number,
  DROP COLUMN IF EXISTS gst_url,
  DROP COLUMN IF EXISTS drive_gst_url,
  DROP COLUMN IF EXISTS logo_url,
  DROP COLUMN IF EXISTS drive_logo_url,
  DROP COLUMN IF EXISTS fevicon_url,
  DROP COLUMN IF EXISTS drive_fevicon_url,
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS secondary,
  DROP COLUMN IF EXISTS tertiary,
  DROP COLUMN IF EXISTS font_colour,
  DROP COLUMN IF EXISTS font_name,
  DROP COLUMN IF EXISTS primarys,
  DROP COLUMN IF EXISTS pncode,
  DROP COLUMN IF EXISTS social_media_details;

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Q1: Confirm dropped columns are gone
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users_profile'
  AND column_name IN (
    'restaurant_name', 'gst_number', 'gst_url', 'drive_gst_url',
    'logo_url', 'drive_logo_url', 'fevicon_url', 'drive_fevicon_url',
    'website', 'phone', 'secondary', 'tertiary', 'font_colour', 'font_name',
    'primarys', 'pncode', 'social_media_details'
  );
-- Expected: 0 rows (all dropped)

-- Q2: Confirm operational columns intact
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users_profile'
ORDER BY ordinal_position;
-- Expected columns:
--   id, restaurant_id,
--   licence_url, drive_licence_url, other_doc_url, drive_other_doc_url,
--   address, city_id, state_id, country, pincode_id,
--   latitude, longitude,
--   timezone, currency_code,
--   alternate_phone,
--   description, screen, is_active,
--   created_at, updated_at,
--   booking_buffer_minutes, booking_grace_minutes,
--   booking_payment_required, booking_payment_amount

-- Q3: Sanity — orders/bookings/delivery still resolve restaurant profile
SELECT COUNT(*) AS profile_count FROM users_profile WHERE is_active = true;
-- Expected: same count as before this script ran

-- ================================================================
-- ROLLBACK (only if catastrophic — use "PRE-Phase-4" snapshot)
-- ================================================================
-- 1. Restore users_profile table from PRE-Phase-4 snapshot in Supabase
-- 2. Git revert backend code to before Phase 2 (or Phase 3)
-- 3. Redeploy backend
--
-- Column recreation SQL (last-resort — replays Phase 1 reconciliation reverse):
--   ALTER TABLE users_profile
--     ADD COLUMN restaurant_name text,
--     ADD COLUMN gst_number text,
--     ...etc
--   Then UPDATE users_profile FROM business_settings for each field.
