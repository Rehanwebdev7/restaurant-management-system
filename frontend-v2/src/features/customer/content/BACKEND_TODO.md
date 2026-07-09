# Backend catch-up for seeded customer sections

Each entry lists a `content/seed/*.ts` file that ships placeholder data
today, plus the backend endpoint / table schema that will replace it. Real
tenants NEVER see the seed content — `useSeedMode()` (`content/useSeedMode.ts`)
gates every seed-driven section on `branding.domainResolved === false`.

Migration order should follow revenue impact + editorial importance.

## Seed files → backend endpoints

### `seed/chef.ts` — Chef bio
- **Endpoint (planned):** `GET /api/customer/team/chef/public`
- **Table (planned):** `restaurant_team` — columns: `id, restaurantId, role (enum: chef|manager|owner), name, title, photoUrl, quote, yearsOfExperience, signatureDishId (FK menu_items.id, nullable)`
- **UI:** HomePage `ChefStorySection`
- **Priority:** Medium — restaurants value chef branding

### `seed/awards.ts` — Awards list
- **Endpoint (planned):** `GET /api/customer/awards/public?restaurantId={n}`
- **Table (planned):** `restaurant_awards` — columns: `id, restaurantId, year, event, category, iconUrl, priority, isActive`
- **UI:** HomePage `AwardsTimeline`
- **Priority:** Low — brag value, not revenue

### `seed/press.ts` — Press mentions
- **Endpoint (planned):** `GET /api/customer/press/public?restaurantId={n}`
- **Table (planned):** `press_mentions` — columns: `id, restaurantId, publication, logoUrl, link, quote (nullable), publishedDate, priority`
- **UI:** HomePage `PressMarquee`
- **Priority:** Low — brag value

### `seed/testimonials.ts` — Customer testimonials
- **Endpoint (planned):** `GET /api/customer/testimonials/public?restaurantId={n}`
- **Table (planned):** `testimonials` — columns: `id, restaurantId, customerName, role, avatarUrl, rating (int 1-5), quote, source (google|manual|survey), publishedAt, isFeatured`
- **UI:** HomePage `TestimonialsSection` (currently inline hardcoded `TESTIMONIALS` array)
- **Priority:** High — social proof directly drives conversion

### `seed/story.ts` — Brand story milestones
- **Endpoint (planned):** `GET /api/customer/story/public?restaurantId={n}`
- **Table (planned):** `brand_milestones` — columns: `id, restaurantId, year, title, description, imageUrl, priority`
- **UI:** HomePage `StoryTimeline`
- **Priority:** Low — decorative

### `seed/faq.ts` — Restaurant FAQ
- **Endpoint (planned):** `GET /api/customer/faq/public?restaurantId={n}`
- **Table (planned):** `restaurant_faq` — columns: `id, restaurantId, question, answer, category (nullable), priority, isActive`
- **UI:** HomePage `FAQAccordion`
- **Priority:** High — reduces support load

### `seed/gallery-seeds.ts` — Fallback gallery images
- **Endpoint (existing):** `GET /api/public/customer/gallery/get_gallery?restaurantId={n}&platform={s}` (via `PublicCustomerGalleryController`) already returns per-tenant data
- **Fallback purpose:** demo/localhost when a fresh tenant has zero gallery rows uploaded
- **UI:** `AmbienceGalleryPreview` on HomePage + full `GalleryPage`
- **Priority:** Already-live backend — seed is fallback only

## Newsletter subscribe
- **Endpoint (planned):** `POST /api/customer/newsletter/subscribe/public`
- **Table (planned):** `newsletter_subscribers` — columns: `id, restaurantId, email, subscribedAt, unsubscribedAt, source`
- **UI:** HomePage `NewsletterCapture` (currently no-op with "Coming soon" toast)
- **Priority:** Medium — marketing lifecycle

## `branding` widen (in-progress)
Fields already exist on `BusinessSettingEntity` but NOT projected by `CustBrandingController` today. Approved to add:

`fssaiNumber`, `gstNumber`, `whatsappNumber`, `phone`, `email`, `address`,
`googleMapEmbed`, `googleRatingUrl`, `socialMediaLinks`, `aboutUs`,
`ourMission`, `ourVision`, `marqueeText`, `marqueeIsLive`, `marqueeBgColor`,
`marqueeTextColor`, `marqueeSpeed`.

Not schema work — pure JSON-projection widen in the branding controller.

## Migration ritual (when adding a real endpoint)

1. Ship the backend controller + table migration.
2. Add fetch function to `frontend-v2/src/api/services/customer.ts`.
3. Add TanStack Query hook to `frontend-v2/src/api/queries/customer.ts`.
4. In the section component, replace `seed/*.ts` import with the query hook.
5. Delete the corresponding entry from this doc and delete the seed file.
6. Verify `useSeedMode()` gate still works — real tenants keep seeing tenant data, demo mode keeps seeing seeds where the endpoint has no data.
