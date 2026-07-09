// TODO: backend endpoint pending — see BACKEND_TODO.md → seed/press.ts
// Rendered only when `useSeedMode()` returns true (demo/localhost).

export interface PressSeed {
  publication: string
  quote: string
}

export const PRESS_SEED: PressSeed[] = [
  { publication: 'Zomato Editor\'s Choice', quote: 'Butter chicken that defines the category.' },
  { publication: 'Times Food', quote: 'Warmth on a plate — heritage recipes at their finest.' },
  { publication: 'Condé Nast Traveller', quote: 'A destination for anyone who loves Indian cuisine.' },
  { publication: 'Vogue India', quote: 'The tandoor sings here; every visit is a celebration.' },
  { publication: 'Mumbai Mirror', quote: 'Serious cooking, unpretentious service, memorable evenings.' },
  { publication: 'The Hindu — Food', quote: 'Slow-cooked mastery, elegantly plated.' },
  { publication: 'Business Standard Weekend', quote: 'Chef Arjun\'s tasting menu is worth the trip.' },
]
