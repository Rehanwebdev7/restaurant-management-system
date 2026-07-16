-- ================================================================
-- PHASE 1 — Data Reconciliation (business_settings ← users_profile)
-- ----------------------------------------------------------------
-- Copies duplicate-field values FROM users_profile INTO business_settings
-- for any restaurant where business_settings has NULL but users_profile
-- has a non-null value. Idempotent — safe to run multiple times.
--
-- After this script, business_settings becomes the authoritative source
-- for all shared fields. Users_profile columns will be dropped in Phase 4
-- (after Phase 2 backend refactor deployed + observed stable).
--
-- Run in: Supabase SQL Editor
-- Created: 2026-07-16
-- ================================================================

-- ---------- Branding (logo + colors + font) ----------
UPDATE business_settings bs
SET logo_url = up.logo_url
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.logo_url IS NULL AND up.logo_url IS NOT NULL;

UPDATE business_settings bs
SET drive_logo_url = up.drive_logo_url
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.drive_logo_url IS NULL AND up.drive_logo_url IS NOT NULL;

-- users_profile uses typo "fevicon_url" → business_settings uses correct "favicon_url"
UPDATE business_settings bs
SET favicon_url = up.fevicon_url
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.favicon_url IS NULL AND up.fevicon_url IS NOT NULL;

UPDATE business_settings bs
SET drive_favicon_url = up.drive_fevicon_url
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.drive_favicon_url IS NULL AND up.drive_fevicon_url IS NOT NULL;

-- users_profile uses typo "primarys" → business_settings uses "primary_color"
UPDATE business_settings bs
SET primary_color = up.primarys
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.primary_color IS NULL AND up.primarys IS NOT NULL;

UPDATE business_settings bs
SET secondary_color = up.secondary
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.secondary_color IS NULL AND up.secondary IS NOT NULL;

UPDATE business_settings bs
SET tertiary_color = up.tertiary
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.tertiary_color IS NULL AND up.tertiary IS NOT NULL;

-- users_profile uses "font_colour" (British) → business_settings uses "font_color"
UPDATE business_settings bs
SET font_color = up.font_colour
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.font_color IS NULL AND up.font_colour IS NOT NULL;

UPDATE business_settings bs
SET font_name = up.font_name
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.font_name IS NULL AND up.font_name IS NOT NULL;

-- ---------- Identity ----------
-- users_profile "restaurant_name" → business_settings "business_name"
UPDATE business_settings bs
SET business_name = up.restaurant_name
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.business_name IS NULL AND up.restaurant_name IS NOT NULL;

-- ---------- Tax ----------
UPDATE business_settings bs
SET gst_number = up.gst_number
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.gst_number IS NULL AND up.gst_number IS NOT NULL;

-- users_profile "gst_url" → business_settings "gst_certificate_url"
UPDATE business_settings bs
SET gst_certificate_url = up.gst_url
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.gst_certificate_url IS NULL AND up.gst_url IS NOT NULL;

UPDATE business_settings bs
SET drive_gst_certificate_url = up.drive_gst_url
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.drive_gst_certificate_url IS NULL AND up.drive_gst_url IS NOT NULL;

-- ---------- Contact ----------
UPDATE business_settings bs
SET phone = up.phone
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.phone IS NULL AND up.phone IS NOT NULL;

-- ---------- Social (users_profile stores as JSON, business_settings as TEXT) ----------
UPDATE business_settings bs
SET social_media_links = up.social_media_details::text
FROM users_profile up
WHERE bs.restaurant_id = up.restaurant_id
  AND bs.social_media_links IS NULL AND up.social_media_details IS NOT NULL;

-- ================================================================
-- VERIFICATION QUERIES (run these AFTER the UPDATEs above)
-- ================================================================

-- Q1: For every restaurant with a users_profile row, verify business_settings
-- now has the key branding fields populated (or was already NULL in both).
SELECT
  u.id AS restaurant_id,
  u.name AS restaurant_name,
  bs.business_name,
  bs.logo_url IS NOT NULL AS has_logo,
  bs.primary_color IS NOT NULL AS has_primary,
  bs.gst_number IS NOT NULL AS has_gst,
  up.logo_url IS NOT NULL AS up_had_logo,
  up.primarys IS NOT NULL AS up_had_primary,
  up.gst_number IS NOT NULL AS up_had_gst
FROM users u
LEFT JOIN business_settings bs ON bs.restaurant_id = u.id
LEFT JOIN users_profile up ON up.restaurant_id = u.id
WHERE u.role IN ('restaurant', 'admin', 'superadmin')
  AND u.is_deleted = false
ORDER BY u.id;

-- Q2: Data drift check — where users_profile and business_settings both have
-- values but they differ. These need manual review before Phase 4 drop.
SELECT
  u.id AS restaurant_id,
  bs.logo_url AS bs_logo,
  up.logo_url AS up_logo,
  bs.primary_color AS bs_primary,
  up.primarys AS up_primary,
  bs.business_name AS bs_name,
  up.restaurant_name AS up_name
FROM users u
JOIN business_settings bs ON bs.restaurant_id = u.id
JOIN users_profile up ON up.restaurant_id = u.id
WHERE
  (bs.logo_url IS NOT NULL AND up.logo_url IS NOT NULL AND bs.logo_url <> up.logo_url)
  OR (bs.primary_color IS NOT NULL AND up.primarys IS NOT NULL AND bs.primary_color <> up.primarys)
  OR (bs.business_name IS NOT NULL AND up.restaurant_name IS NOT NULL AND bs.business_name <> up.restaurant_name);
-- Expected: 0 rows (business_settings takes precedence — this only flags conflicts)

-- Q3: Sanity — count how many business_settings rows exist per restaurant
SELECT restaurant_id, COUNT(*) AS bs_count
FROM business_settings
GROUP BY restaurant_id
HAVING COUNT(*) > 1;
-- Expected: 0 rows (one settings row per restaurant)

-- ================================================================
-- ROLLBACK
-- ================================================================
-- This script is ADDITIVE only. No rollback needed — it only fills NULL
-- values, never overwrites existing business_settings data.
