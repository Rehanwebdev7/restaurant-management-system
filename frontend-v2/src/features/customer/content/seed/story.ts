// TODO: backend endpoint pending — see BACKEND_TODO.md → seed/story.ts
// Rendered only when `useSeedMode()` returns true (demo/localhost).

export interface StoryMilestoneSeed {
  year: number
  title: string
  description: string
  imageUrl: string
}

export const STORY_SEED: StoryMilestoneSeed[] = [
  {
    year: 2003,
    title: 'The First Kitchen',
    description:
      'A single tandoor, a family recipe book, and a dream — Spice Garden opens its doors in a modest Bandra corner.',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  },
  {
    year: 2011,
    title: 'Recognition',
    description:
      'Featured in Times Food Awards as an emerging fine-dining destination — our butter chicken becomes a city landmark.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    year: 2018,
    title: 'Second Home',
    description:
      'A second branch opens in Indiranagar, Bangalore — same recipes, same warmth, new city to feed.',
    imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
  },
  {
    year: 2024,
    title: 'Times Food — Restaurant of the Year',
    description:
      'A decade of listening to our guests, twenty years of the same tandoor — recognised as the year\'s top Indian fine-dining kitchen.',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
  },
]
