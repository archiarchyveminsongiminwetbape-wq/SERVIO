import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export default async function handler(req: any, res: any) {
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Webhook signature missing or not configured' });
  }

  let event;

  try {
    const rawBody = await new Promise<string>((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: Buffer) => {
        data += chunk;
      });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error('Webhook verification failed:', error.message);
    return res.status(400).json({ error: 'Webhook verification failed' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      const userId = session.metadata?.user_id;

      if (bookingId && userId) {
        const supabase = createClient(
          process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        await supabase.from('bookings').update({
          payment_status: 'completed',
          status: 'confirmed',
        }).eq('id', bookingId);

        await supabase.from('payments').insert({
          booking_id: bookingId,
          user_id: userId,
          amount: Number(session.amount_total || 0) / 100,
          currency: (session.currency || 'eur').toUpperCase(),
          status: 'completed',
          payment_method: 'card',
          payment_provider: 'stripe',
          provider_payment_id: session.id,
          metadata: {
            checkout_session_id: session.id,
            payment_intent: session.payment_intent,
            customer_email: session.customer_details?.email || null,
          },
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export const config = {
  runtime: 'nodejs',
};
