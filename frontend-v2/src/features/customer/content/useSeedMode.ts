/**
 * `useSeedMode` — gate hook for demo/placeholder content.
 *
 * Returns `true` when the backend has NOT resolved the request Host to a
 * real tenant domain (i.e. localhost, unknown hosts, demo mode). Returns
 * `false` for real onboarded tenants — those never see the seed sections.
 *
 * Sections that consume this hook: chef story, awards timeline, press
 * marquee, story timeline, testimonials, FAQ, newsletter capture, and the
 * gallery-seed fallback strip.
 *
 * See `content/BACKEND_TODO.md` for the endpoint / schema each seed will
 * migrate to once backend catches up.
 */
import { useBrand } from '@/components/providers/BrandProvider'

export function useSeedMode(): boolean {
  const brand = useBrand()
  // Do NOT enable seed while branding is still loading — avoids a flash of
  // sample sections on a real tenant's page during the initial fetch.
  if (brand.loading) return false
  return brand.domainResolved === false
}
