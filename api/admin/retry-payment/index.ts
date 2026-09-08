import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, adminId } = req.body || {};

    if (!paymentId || !adminId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, bookings(*)')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'failed') {
      return res.status(400).json({ error: 'Only failed payments can be retried' });
    }

    if (!payment.bookings) {
      return res.status(400).json({ error: 'Associated booking not found' });
    }

    // Get user details for the booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('client_id, provider_id')
      .eq('id', payment.booking_id)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get client email
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', booking.client_id)
      .single();

    if (!clientProfile?.email) {
      return res.status(400).json({ error: 'Client email not found' });
    }

    // Create new checkout session for retry
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: payment.currency.toLowerCase(),
            product_data: {
              name: 'SERVIO mission payment - Retry',
              description: `Retry payment for booking ${payment.booking_id}`,
            },
            unit_amount: Math.round(Number(payment.amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || 'http://localhost:5173'}/bookings?payment=success`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:5173'}/bookings?payment=cancelled`,
      customer_email: clientProfile.email,
      metadata: {
        booking_id: String(payment.booking_id),
        user_id: String(booking.client_id),
        provider_id: String(booking.provider_id),
        retry_payment_id: paymentId,
        admin_initiated: 'true',
        admin_id: adminId,
      },
      payment_method_types: ['card'],
    });

    // Update payment status to processing
    await supabase
      .from('payments')
      .update({
        status: 'processing',
        metadata: {
          ...payment.metadata,
          retry_checkout_session_id: session.id,
          retry_initiated_by: adminId,
          retry_initiated_at: new Date().toISOString(),
        },
      })
      .eq('id', paymentId);

    return res.status(200).json({ 
      success: true, 
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Retry payment error:', error);
    return res.status(500).json({
      error: 'Retry failed',
      details: error?.message || 'Unknown error',
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
