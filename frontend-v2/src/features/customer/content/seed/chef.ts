// TODO: backend endpoint pending — see BACKEND_TODO.md → seed/chef.ts
// Rendered only when `useSeedMode()` returns true (demo/localhost).
// Real tenants replace this with GET /api/customer/team/chef/public.

export interface ChefSeed {
  name: string
  title: string
  photoUrl: string
  quote: string
  yearsOfExperience: number
  signatureDish: string
}

export const CHEF_SEED: ChefSeed = {
  name: 'Chef Arjun Malhotra',
  title: 'Executive Chef & Co-Founder',
  photoUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=1000&q=80',
  quote:
    'Every plate carries a memory — of my grandmother\'s kitchen, of monsoon evenings, of the first tandoor I ever lit. We don\'t just cook; we translate heritage into flavour.',
  yearsOfExperience: 22,
  signatureDish: 'Slow-braised Butter Chicken',
}
