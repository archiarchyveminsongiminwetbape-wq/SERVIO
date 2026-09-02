import { createClient } from '@supabase/supabase-js';

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
    const { bookingId, providerId, userId, paymentMethod, amount, currency = 'EUR', contractReference } = req.body || {};

    if (!bookingId || !providerId || !userId) {
      return res.status(400).json({ error: 'Missing booking, provider, or user data' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase server configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, payment_status, provider_id, client_id, price, currency, payment_method, metadata')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const paymentAllowed = ['card', 'cash', 'bank_transfer', 'orange_money', 'mtn_money'].includes(paymentMethod || booking.payment_method || '');
    const amountValid = Number(amount ?? booking.price ?? 0) > 0;
    const providerMatches = String(booking.provider_id) === String(providerId);
    const userMatches = String(booking.client_id) === String(userId);

    if (!paymentAllowed || !amountValid || !providerMatches || !userMatches) {
      return res.status(403).json({ error: 'Final mission validation refused: invalid payment or ownership context' });
    }

    const finalizedMetadata = {
      ...(booking.metadata || {}),
      contract_reference: contractReference || booking.metadata?.contract_reference || `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      contract_status: 'signed',
      contract_signed_at: new Date().toISOString(),
      payment_data: {
        ...(booking.metadata?.payment_data || {}),
        method: paymentMethod || booking.payment_method || 'manual',
        amount: Number(amount ?? booking.price ?? 0),
        currency: currency || booking.currency || 'EUR',
        status: booking.payment_status || 'pending',
      },
    };

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        payment_status: booking.payment_status === 'completed' ? 'completed' : 'held',
        metadata: finalizedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      return res.status(500).json({ error: 'Final booking update failed', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      bookingId,
      contractReference: finalizedMetadata.contract_reference,
      signedAt: finalizedMetadata.contract_signed_at,
    });
  } catch (error: any) {
    console.error('Final contract validation failed:', error);
    return res.status(500).json({
      error: 'Final contract validation failed',
      details: error?.message || 'Unknown error',
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
