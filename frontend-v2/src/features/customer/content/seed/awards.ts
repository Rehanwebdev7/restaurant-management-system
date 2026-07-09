// TODO: backend endpoint pending — see BACKEND_TODO.md → seed/awards.ts
// Rendered only when `useSeedMode()` returns true (demo/localhost).

export interface AwardSeed {
  year: number
  event: string
  category: string
}

export const AWARDS_SEED: AwardSeed[] = [
  { year: 2024, event: 'Times Food Awards', category: 'Best Indian Fine Dining' },
  { year: 2023, event: "Zomato Restaurant of the Year", category: 'Regional Winner — West' },
  { year: 2022, event: 'Condé Nast Traveller', category: 'Top 50 Restaurants in India' },
  { year: 2021, event: 'Vogue India Culinary Awards', category: 'Signature Dish — Butter Chicken' },
  { year: 2020, event: 'India Restaurant Excellence', category: 'Hospitality Innovation' },
]
