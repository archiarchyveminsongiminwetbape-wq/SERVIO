import Flutterwave from 'flutterwave-node-v3';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY || '',
  process.env.FLUTTERWAVE_SECRET_KEY || '',
  process.env.FLUTTERWAVE_ENCRYPTION_KEY || ''
);

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
    const { event, data } = req.body;

    // Verify webhook signature
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    if (secretHash) {
      const signature = req.headers['verif-hash'];
      if (signature !== secretHash) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    if (event === 'charge.completed' || event === 'transfer.completed') {
      const { tx_ref, amount, currency, id, flw_ref, customer, payment_type } = data;
      
      const bookingId = data.meta?.booking_id;
      const userId = data.meta?.user_id;

      if (!bookingId) {
        console.error('Flutterwave webhook: No booking_id in meta');
        return res.status(400).json({ error: 'Missing booking_id' });
      }

      const supabase = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      // Update booking status - KEEP PENDING until admin validates work
      await supabase.from('bookings').update({
        payment_status: 'in_escrow', // Changed from 'completed' to 'in_escrow'
        status: 'confirmed',
      }).eq('id', bookingId);

      // Get booking details for payment record
      const { data: booking } = await supabase
        .from('bookings')
        .select('user_id, provider_id')
        .eq('id', bookingId)
        .single();

      if (booking) {
        // Create payment record with escrow status
        await supabase.from('payments').insert({
          booking_id: bookingId,
          user_id: booking.user_id,
          amount: parseFloat(amount),
          currency: currency,
          status: 'in_escrow', // Changed from 'completed' to 'in_escrow'
          payment_method: payment_type === 'card' ? 'card' : payment_type.toLowerCase(),
          payment_provider: 'flutterwave',
          provider_payment_id: id,
          metadata: {
            tx_ref,
            flw_ref,
            customer_email: customer.email,
            customer_name: customer.name,
            escrow_enabled: true, // Flag to indicate escrow is active
          },
        });
      }

      console.log(`Flutterwave payment completed for booking ${bookingId}`);
    }

    if (event === 'charge.failed') {
      const { tx_ref, meta } = data;
      const bookingId = meta?.booking_id;

      if (bookingId) {
        const supabase = createClient(
          process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        await supabase.from('bookings').update({
          payment_status: 'failed',
          status: 'cancelled',
        }).eq('id', bookingId);

        const { data: booking } = await supabase
          .from('bookings')
          .select('user_id')
          .eq('id', bookingId)
          .single();

        if (booking) {
          await supabase.from('payments').insert({
            booking_id: bookingId,
            user_id: booking.user_id,
            amount: 0,
            currency: 'XAF',
            status: 'failed',
            payment_method: 'flutterwave',
            payment_provider: 'flutterwave',
            provider_payment_id: data.id,
            metadata: {
              reason: 'Payment failed via Flutterwave',
              tx_ref,
            },
          });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Flutterwave webhook processing failed:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export const config = {
  runtime: 'nodejs',
};
