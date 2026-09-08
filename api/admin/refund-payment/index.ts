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
    const { paymentId, reason, adminId } = req.body || {};

    if (!paymentId || !reason || !adminId) {
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
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    }

    if (!payment.provider_payment_id) {
      return res.status(400).json({ error: 'No Stripe payment ID found' });
    }

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.provider_payment_id as string,
      reason: 'requested_by_customer',
      metadata: {
        admin_id: adminId,
        refund_reason: reason,
        payment_id: paymentId,
      },
    });

    // Update payment in database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_reason: reason,
        metadata: {
          ...payment.metadata,
          stripe_refund_id: refund.id,
          refund_amount: refund.amount / 100,
          refunded_by_admin: adminId,
        },
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      // Still return success as refund was processed in Stripe
    }

    return res.status(200).json({ 
      success: true, 
      refundId: refund.id,
      amount: refund.amount / 100,
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    return res.status(500).json({
      error: 'Refund failed',
      details: error?.message || 'Unknown error',
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
