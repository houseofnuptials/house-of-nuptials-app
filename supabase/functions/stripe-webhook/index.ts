// ================================================================
// Supabase Edge Function: stripe-webhook
// Location: supabase/functions/stripe-webhook/index.ts
//
// Deploy with: npx supabase functions deploy stripe-webhook
// Then add this URL as a webhook in your Stripe Dashboard
// Listen for: checkout.session.completed
// ================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook Error', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userEmail = session.customer_email || session.metadata?.userEmail
    const customerId = session.customer as string

    if (userEmail) {
      // Find user by email and set premium
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === userEmail)

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: true,
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (error) {
          console.error('Error updating profile:', error)
          return new Response('Database error', { status: 500 })
        }

        console.log(`✓ Set premium for user: ${userEmail}`)
      }
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: false, updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', customerId)

    if (error) console.error('Error downgrading profile:', error)
    else console.log(`✓ Removed premium for customer: ${customerId}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
