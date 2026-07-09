// TODO: backend endpoint pending — see BACKEND_TODO.md → seed/faq.ts
// Rendered only when `useSeedMode()` returns true (demo/localhost).

export interface FaqSeed {
  question: string
  answer: string
}

export const FAQ_SEED: FaqSeed[] = [
  {
    question: 'What are your delivery hours?',
    answer:
      'We deliver from 11:30 AM to 10:30 PM, seven days a week. Last order goes into the kitchen 30 minutes before close.',
  },
  {
    question: 'Is there a minimum order value?',
    answer:
      'Yes — $20 for delivery, $10 for takeaway. Orders above $50 ship free within our delivery zone.',
  },
  {
    question: 'Do you offer vegetarian and vegan options?',
    answer:
      'Absolutely. Our menu clearly labels vegetarian dishes with a green marker. Vegan preparations can be requested — our chefs will adapt any dish where possible.',
  },
  {
    question: 'How do I flag allergies or dietary restrictions?',
    answer:
      'Add a note at checkout or call the branch directly. Our kitchen is trained on gluten, nut, and dairy allergen protocols and takes them seriously.',
  },
  {
    question: 'Can I cancel or modify an order after placing it?',
    answer:
      'Yes — as long as the order has not entered the kitchen. Call the branch within 5 minutes of placement to modify or cancel without charge.',
  },
  {
    question: 'What is your refund policy?',
    answer:
      'If you\'re unhappy with any dish, tell us within 20 minutes of receipt. We\'ll replace it or refund the full amount — no questions asked.',
  },
  {
    question: 'Do you host private events and group bookings?',
    answer:
      'Yes. Our team can arrange private dining for 12–60 guests. Get in touch via the reservation form or call the branch to design your evening.',
  },
  {
    question: 'Do you offer catering for parties and offices?',
    answer:
      'Catering is available with 48-hour notice. Menus can be customised. Contact us for a quote based on headcount and dietary requirements.',
  },
  {
    question: 'Are the ingredients fresh and locally sourced?',
    answer:
      'Our vegetables and dairy come from partner farms, meat from certified halal suppliers, and spices ground in-house every morning. Freshness is non-negotiable.',
  },
  {
    question: 'Do you accept walk-ins?',
    answer:
      'Yes — walk-ins are welcome. On weekends and evenings we recommend booking a table to guarantee a seat within 15 minutes.',
  },
]
