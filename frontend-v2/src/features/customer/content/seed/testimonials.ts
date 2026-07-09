// TODO: backend endpoint pending — see BACKEND_TODO.md → seed/testimonials.ts
// Rendered only when `useSeedMode()` returns true (demo/localhost).

export interface TestimonialSeed {
  quote: string
  name: string
  role: string
  avatarUrl: string
  rating: number
}

export const TESTIMONIALS_SEED: TestimonialSeed[] = [
  {
    quote:
      'The butter chicken here is otherworldly — genuinely the best I\'ve had. Every visit feels like a celebration.',
    name: 'Ananya Verma',
    role: 'Food Critic, Mumbai Mirror',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    rating: 5,
  },
  {
    quote:
      'Hands down the best tandoori chicken in the city. Warm hospitality, spotless kitchen, unmatched flavour.',
    name: 'Rahul Mehta',
    role: 'Regular Patron · Bandra',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
  },
  {
    quote:
      'Authentic flavours, premium ambience, and warm service. Our go-to spot for date nights and family dinners.',
    name: 'Priya Sharma',
    role: 'Lifestyle Blogger',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    rating: 5,
  },
]
