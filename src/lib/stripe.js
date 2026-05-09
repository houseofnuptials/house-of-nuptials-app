import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

export const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Wedding Ready',
    price: 12.99,
    period: '/month',
    annualNote: 'Or £79.99/year — save £36',
    priceId: process.env.REACT_APP_STRIPE_PRICE_MONTHLY,
    features: [
      'Everything in Starter',
      'Full detailed checklist with expert notes',
      'Budget tracker with overspend alerts',
      'Vendor email templates & scripts',
      'Style moodboard builder',
      'Guest list & RSVP manager',
      'Wedding day timeline builder',
      'Exclusive video content from our team',
      'Partner discounts & supplier offers',
      'Priority customer support',
    ],
  },
  annual: {
    id: 'annual',
    name: 'Wedding Ready',
    price: 6.67,
    period: '/month',
    annualNote: 'Billed as £79.99/year — save £36',
    priceId: process.env.REACT_APP_STRIPE_PRICE_ANNUAL,
    features: [
      'Everything in Starter',
      'Full detailed checklist with expert notes',
      'Budget tracker with overspend alerts',
      'Vendor email templates & scripts',
      'Style moodboard builder',
      'Guest list & RSVP manager',
      'Wedding day timeline builder',
      'Exclusive video content from our team',
      'Partner discounts & supplier offers',
      'Priority customer support',
    ],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Access',
    price: 149,
    period: 'once',
    annualNote: 'One payment. Access forever.',
    priceId: process.env.REACT_APP_STRIPE_PRICE_LIFETIME,
    features: [
      'Everything in Premium',
      'Lifetime access — no ongoing payments',
      'All future feature updates included',
      'Priority support & early access',
      'One free digital download of your choice',
    ],
  },
};

export async function createCheckoutSession(priceId, userId, userEmail) {
  const stripe = await getStripe();

  // Call your Supabase Edge Function or API route to create the session
  const response = await fetch(
    `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl: `${process.env.REACT_APP_URL}/dashboard?upgraded=true`,
        cancelUrl: `${process.env.REACT_APP_URL}/pricing`,
      }),
    }
  );

  const { sessionId, error } = await response.json();
  if (error) throw new Error(error);

  const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
  if (stripeError) throw stripeError;
}
