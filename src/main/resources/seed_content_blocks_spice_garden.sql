-- ================================================================
-- SEED: Real content for Spice Garden Pvt Ltd (tenant restaurant_id=42)
-- ----------------------------------------------------------------
-- Populates restaurant_content_blocks table with ~50 real rows serving:
--   HomePage: TESTIMONIAL, STAT, INSTAGRAM_POST, WHY_DINE
--   LocationsPage: FACILITY, EVENT_PACKAGE, AWARD, REACH_INFO
--   ContactPage: FAQ, DEPARTMENT, HELP_CATEGORY, HOURS_NOTE
--   AboutPage: TEAM_MEMBER
--
-- Also updates restaurant_branch id=4 (Main Branch - Fort) with
-- rich metadata for LocationsPage branch cards.
--
-- Idempotent — deletes existing tenant-42 content_blocks first.
--
-- Run in: Supabase SQL Editor
-- Created: 2026-07-16
-- ================================================================

-- Clear old rows for this tenant (safe re-run)
DELETE FROM restaurant_content_blocks WHERE restaurant_id = 42;

-- ---------- HomePage TESTIMONIALS (3) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, subtitle, description, meta) VALUES
(42, 'HOME', 'TESTIMONIAL', 1, 'Ananya Verma', 'Food Critic, Mumbai Mirror',
 'The butter chicken here is otherworldly. Every visit feels like a celebration.',
 '{"rating": 5}'::jsonb),
(42, 'HOME', 'TESTIMONIAL', 2, 'Rahul Mehta', 'Regular Patron',
 'Hands down the best Tandoori chicken in the city. The hospitality is unmatched.',
 '{"rating": 5}'::jsonb),
(42, 'HOME', 'TESTIMONIAL', 3, 'Priya Sharma', 'Lifestyle Blogger',
 'Authentic flavours, premium ambience, and warm service. A perfect date-night spot.',
 '{"rating": 5}'::jsonb);

-- ---------- HomePage STATS (3) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, subtitle) VALUES
(42, 'HOME', 'STAT', 1, '200+', 'Authentic Dishes'),
(42, 'HOME', 'STAT', 2, '10,000+', 'Happy Customers'),
(42, 'HOME', 'STAT', 3, '20+', 'Years of Service');

-- ---------- HomePage WHY_DINE tiles (3) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, description, icon_name) VALUES
(42, 'HOME', 'WHY_DINE', 1, 'Hand-Crafted by Chefs',
 'Every dish prepared fresh by our experienced kitchen team.', 'ChefHat'),
(42, 'HOME', 'WHY_DINE', 2, 'Farm-Fresh Ingredients',
 'Sourced daily from trusted local farms for peak flavour.', 'Leaf'),
(42, 'HOME', 'WHY_DINE', 3, 'Award-Winning Recipes',
 'Heritage recipes refined over decades for an unforgettable bite.', 'Award');

-- ---------- HomePage INSTAGRAM (6) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, image_url) VALUES
(42, 'HOME', 'INSTAGRAM_POST', 1, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80'),
(42, 'HOME', 'INSTAGRAM_POST', 2, 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80'),
(42, 'HOME', 'INSTAGRAM_POST', 3, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'),
(42, 'HOME', 'INSTAGRAM_POST', 4, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80'),
(42, 'HOME', 'INSTAGRAM_POST', 5, 'https://images.unsplash.com/photo-1565895405227-31cffbe0cf86?auto=format&fit=crop&w=800&q=80'),
(42, 'HOME', 'INSTAGRAM_POST', 6, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80');

-- ---------- LocationsPage FACILITIES (8) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, description, icon_name) VALUES
(42, 'LOCATIONS', 'FACILITY', 1, 'Valet Parking',      'Complimentary at all branches', 'Car'),
(42, 'LOCATIONS', 'FACILITY', 2, 'Full Bar & Sommelier','Curated Indian & imported labels', 'Wine'),
(42, 'LOCATIONS', 'FACILITY', 3, 'Live Kitchen',       'Watch the chefs at work', 'ChefHat'),
(42, 'LOCATIONS', 'FACILITY', 4, 'Wheelchair Access',  'Ramps + accessible restrooms', 'Accessibility'),
(42, 'LOCATIONS', 'FACILITY', 5, 'Free High-Speed Wi-Fi','For work-lunches or catch-ups', 'Wifi'),
(42, 'LOCATIONS', 'FACILITY', 6, 'Private Dining Rooms','Seating 8-40 · projector on request', 'PartyPopper'),
(42, 'LOCATIONS', 'FACILITY', 7, 'Family & Kids Menu', 'High-chairs + colouring kits', 'Users'),
(42, 'LOCATIONS', 'FACILITY', 8, 'FSSAI Certified',    'Kitchen audited every quarter', 'ShieldCheck');

-- ---------- LocationsPage EVENTS (3) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, description, icon_name, meta) VALUES
(42, 'LOCATIONS', 'EVENT_PACKAGE', 1, 'Birthdays & Anniversaries',
 'A dedicated host, custom cake table setup, and a curated tasting menu that fits your budget.',
 'Cake', '{"accent": "From ₹1,200/head"}'::jsonb),
(42, 'LOCATIONS', 'EVENT_PACKAGE', 2, 'Corporate & Team Dinners',
 'Private dining rooms with AV support, semi-buffet options, and GST invoices for reimbursements.',
 'Building2', '{"accent": "Groups of 12–60"}'::jsonb),
(42, 'LOCATIONS', 'EVENT_PACKAGE', 3, 'Weddings & Sangeets',
 'Full-restaurant buyouts, off-site catering, live counters — mehendi, sangeet, cocktail evenings.',
 'Sparkles', '{"accent": "Full-venue buyouts"}'::jsonb);

-- ---------- LocationsPage AWARDS (3) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, description, icon_name) VALUES
(42, 'LOCATIONS', 'AWARD', 1, 'Times Food Awards 2024', 'Best North Indian — Bandra', 'Award'),
(42, 'LOCATIONS', 'AWARD', 2, 'Zomato Gold Rated',       '4.6★ across three branches',  'Star'),
(42, 'LOCATIONS', 'AWARD', 3, 'Featured in Conde Nast',  'Mumbai''s 20 must-visit kitchens', 'ChefHat');

-- ---------- LocationsPage REACH INFO (4) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, description, icon_name) VALUES
(42, 'LOCATIONS', 'REACH_INFO', 1, 'By Metro & Local',
 'Andheri branch is a 3-min walk from Metro Line 1; Bandra is 10 min from Bandra Station (W).', 'Train'),
(42, 'LOCATIONS', 'REACH_INFO', 2, 'By Car',
 'All branches offer complimentary valet. Powai has a free surface lot for 40 cars.', 'Car'),
(42, 'LOCATIONS', 'REACH_INFO', 3, 'Nearby Landmarks',
 'Bandra — opposite Turner Rd Church. Andheri — behind Solitaire Corporate Park. Powai — next to Hiranandani Central Park.', 'MapPin'),
(42, 'LOCATIONS', 'REACH_INFO', 4, 'Peak-time Waits',
 'Fri–Sat 8 PM onwards: expect 20–30 min without a reservation. Reserve online to skip the queue.', 'Clock');

-- ---------- ContactPage FAQ (8) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, description) VALUES
(42, 'CONTACT', 'FAQ', 1, 'Do I need to reserve, or can I walk in?',
 'Walk-ins are always welcome, but weekend evenings (Fri–Sun after 7:30 PM) usually have a 20–30 minute wait. We recommend reserving online — it takes under a minute and holds your table until 15 minutes past your slot.'),
(42, 'CONTACT', 'FAQ', 2, 'Is there a dress code?',
 'Smart casual across all branches. We ask that guests avoid beachwear, gym clothes, or overly informal attire in the evenings. Kids are welcome any time in their favourite outfits.'),
(42, 'CONTACT', 'FAQ', 3, 'Can you accommodate food allergies and dietary needs?',
 'Absolutely. Every dish is flagged for common allergens (nuts, dairy, gluten, seafood). Tell us at booking or on arrival — our chefs will adjust or suggest alternatives. We also have Jain, vegan, and gluten-free variants for most menu items.'),
(42, 'CONTACT', 'FAQ', 4, 'Do you serve alcohol?',
 'Yes, all three branches are fully licensed. We have a curated wine list (Indian + imported), a full-service bar, and a sommelier at Bandra. Andheri and Powai serve cocktails, wines, and spirits.'),
(42, 'CONTACT', 'FAQ', 5, 'How do I book a private dining room or event?',
 'Fill in the reservation form above and mention ''Private Dining'' in the notes, or email events@spicegarden.com. Our event manager will call within 4 hours to discuss menu, setup, and pricing. Rooms seat 8–40; full-restaurant buyouts also available.'),
(42, 'CONTACT', 'FAQ', 6, 'What about parking?',
 'Complimentary valet at all three branches. Powai additionally has a free surface lot for 40 cars. Bandra and Andheri branches are also well-connected by metro and local train — see our Locations page for details.'),
(42, 'CONTACT', 'FAQ', 7, 'Do you deliver?',
 'Yes — via Zomato, Swiggy, and our own website (with a 10% off first-order discount for direct orders). Delivery zone covers most of Mumbai suburbs; check your PIN code at checkout.'),
(42, 'CONTACT', 'FAQ', 8, 'Can I get a GST invoice for corporate meals?',
 'Yes. Provide your company name and GSTIN at billing or in the booking notes, and we''ll issue a compliant invoice immediately. For monthly meal contracts, email corporate@spicegarden.com.');

-- ---------- ContactPage DEPARTMENTS (6) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, subtitle, description, meta) VALUES
(42, 'CONTACT', 'DEPARTMENT', 1, 'Reservation Desk',   'Daily · 9 AM – 11 PM', 'Fastest for same-day bookings',
 '{"phone": "+91 9876543210", "email": "reservations@spicegarden.com"}'::jsonb),
(42, 'CONTACT', 'DEPARTMENT', 2, 'Event Manager',      'Mon–Sat · 10 AM – 7 PM', 'Birthdays, sangeets, buyouts',
 '{"phone": "+91 9876543220", "email": "events@spicegarden.com"}'::jsonb),
(42, 'CONTACT', 'DEPARTMENT', 3, 'Catering & Off-Site','Mon–Sat · 10 AM – 7 PM', 'Home & office deliveries · 20+ pax',
 '{"phone": "+91 9876543230", "email": "catering@spicegarden.com"}'::jsonb),
(42, 'CONTACT', 'DEPARTMENT', 4, 'Corporate Sales',    'Mon–Fri · 10 AM – 6 PM', 'Meal contracts, gift cards, invoicing',
 '{"phone": "+91 9876543240", "email": "corporate@spicegarden.com"}'::jsonb),
(42, 'CONTACT', 'DEPARTMENT', 5, 'Guest Relations',    'Daily · 11 AM – 11 PM',  'Feedback, complaints, lost items',
 '{"phone": "+91 9876543250", "email": "care@spicegarden.com"}'::jsonb),
(42, 'CONTACT', 'DEPARTMENT', 6, 'Careers & HR',       'Mon–Fri · 10 AM – 6 PM', 'Chefs, service, management roles',
 '{"phone": "+91 9876543260", "email": "careers@spicegarden.com"}'::jsonb);

-- ---------- ContactPage HELP CATEGORIES (4) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, description, icon_name, meta) VALUES
(42, 'CONTACT', 'HELP_CATEGORY', 1, 'General Enquiries',
 'Menu questions, dietary needs, allergies, or anything else — our guest desk answers in under 4 hours.',
 'HelpCircle', '{"cta": "hello@spicegarden.com", "href": "mailto:hello@spicegarden.com"}'::jsonb),
(42, 'CONTACT', 'HELP_CATEGORY', 2, 'Reservations',
 'Reserve a table, modify an existing booking, or ask about waitlist availability for weekend evenings.',
 'Calendar', '{"cta": "+91 9876543210", "href": "tel:+919876543210"}'::jsonb),
(42, 'CONTACT', 'HELP_CATEGORY', 3, 'Private Events',
 'Birthdays, anniversaries, corporate dinners, weddings — our event manager will design a bespoke evening.',
 'Sparkles', '{"cta": "events@spicegarden.com", "href": "mailto:events@spicegarden.com"}'::jsonb),
(42, 'CONTACT', 'HELP_CATEGORY', 4, 'Media & Press',
 'Reviews, features, chef interviews, food photography visits — our PR team responds within one working day.',
 'Newspaper', '{"cta": "press@spicegarden.com", "href": "mailto:press@spicegarden.com"}'::jsonb);

-- ---------- ContactPage HOURS NOTES (4) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, description, icon_name) VALUES
(42, 'CONTACT', 'HOURS_NOTE', 1, 'Happy Hour',
 'Weekdays 5:30 PM – 7:30 PM · 25% off cocktails and small plates at the bar.', 'Clock'),
(42, 'CONTACT', 'HOURS_NOTE', 2, 'Kitchen Close',
 'Last food order 30 mins before closing. Bar stays open until close.', 'Utensils'),
(42, 'CONTACT', 'HOURS_NOTE', 3, 'Sunday Brunch',
 'Live jazz + bottomless mimosas at the Powai branch, 11 AM – 3 PM.', 'ChefHat'),
(42, 'CONTACT', 'HOURS_NOTE', 4, 'Festive Hours',
 'Diwali, Christmas & New Year — extended hours + special tasting menu. Book 2 weeks ahead.', 'Sparkles');

-- ---------- AboutPage TEAM (4) ----------
INSERT INTO restaurant_content_blocks (restaurant_id, page, section_type, sort_order, title, subtitle, image_url) VALUES
(42, 'ABOUT', 'TEAM_MEMBER', 1, 'Chef Aarav Kapoor', 'Executive Chef',
 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=600&q=80'),
(42, 'ABOUT', 'TEAM_MEMBER', 2, 'Riya Mehta',        'Sommelier',
 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'),
(42, 'ABOUT', 'TEAM_MEMBER', 3, 'Daniel Pinto',      'Maître d''',
 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80'),
(42, 'ABOUT', 'TEAM_MEMBER', 4, 'Sneha Iyer',        'Pastry Chef',
 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80');

-- ---------- restaurant_branch id=4 (Main Branch - Fort) rich metadata ----------
UPDATE restaurant_branch
SET
  specialty = 'Slow-cooked Awadhi kebabs & tandoor',
  seating   = '120 covers · 2 private rooms',
  best_for  = '["Anniversaries","Rooftop Dining","Wine Pairings"]',
  features  = '["Rooftop","Valet Parking","Live Ghazal Fri-Sat","Chef''s Table","Sommelier"]',
  chef_note = 'Our flagship kitchen — everything we serve across Mumbai is first perfected here.',
  photo_url = 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80'
WHERE id = 4;

-- ================================================================
-- VERIFICATION
-- ================================================================
SELECT page, section_type, COUNT(*)
FROM restaurant_content_blocks
WHERE restaurant_id = 42
GROUP BY page, section_type
ORDER BY page, section_type;
-- Expected ~50 rows across 12 section types

SELECT id, branch_name, specialty, seating, features
FROM restaurant_branch WHERE id = 4;
-- Expected: rich metadata populated
