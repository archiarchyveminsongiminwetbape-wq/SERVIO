import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: 'Missing signature or webhook secret' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Webhook event received: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.booking_id

        if (bookingId) {
          // Update payment status
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              provider_payment_id: paymentIntent.id,
            })
            .eq('booking_id', bookingId)

          // Update booking status
          await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId)

          console.log(`Payment succeeded for booking ${bookingId}`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.booking_id

        if (bookingId) {
          // Update payment status
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              failed_at: new Date().toISOString(),
              provider_payment_id: paymentIntent.id,
            })
            .eq('booking_id', bookingId)

          // Update booking status
          await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId)

          console.log(`Payment failed for booking ${bookingId}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
