import Flutterwave from 'flutterwave-node-v3';
import { createClient } from '@supabase/supabase-js';

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
    const { tx_ref } = req.body || {};

    if (!tx_ref) {
      return res.status(400).json({ error: 'Missing tx_ref' });
    }

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ error: 'Flutterwave is not configured on the server' });
    }

    // Verify transaction
    const response = await flw.Transaction.verify({ id: tx_ref });

    if (response.status === 'success' && response.data.status === 'successful') {
      const { meta, amount, currency, id, flw_ref, customer, payment_type } = response.data;
      const bookingId = meta?.booking_id;

      if (bookingId) {
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
      }

      return res.status(200).json({ 
        success: true,
        data: response.data,
      });
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Payment verification failed',
        data: response.data,
      });
    }
  } catch (error: any) {
    console.error('Flutterwave verification error:', error);
    return res.status(500).json({
      error: 'Flutterwave verification failed',
      details: error?.message || 'Unknown error',
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
