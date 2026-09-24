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
    const { paymentId, reason, adminId } = req.body || {};

    if (!paymentId) {
      return res.status(400).json({ error: 'Missing paymentId' });
    }

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ error: 'Flutterwave is not configured on the server' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Get payment details to find the transaction ID
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.payment_provider !== 'flutterwave') {
      return res.status(400).json({ error: 'This payment was not processed via Flutterwave' });
    }

    const transactionId = payment.provider_payment_id;
    if (!transactionId) {
      return res.status(400).json({ error: 'No Flutterwave transaction ID found for this payment' });
    }

    // Process refund
    const refundRequest = {
      id: transactionId,
      amount: payment.amount,
    };

    const response = await flw.Transaction.refund(refundRequest);

    if (response.status === 'success') {
      // Update payment status
      await supabase.from('payments').update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_reason: reason,
      }).eq('id', paymentId);

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: adminId,
        action_type: 'refund_payment',
        target_type: 'payment',
        target_id: paymentId,
        details: `Reason: ${reason}`,
      });

      return res.status(200).json({ 
        success: true,
        refundId: response.data.id,
      });
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Flutterwave refund failed',
        details: response,
      });
    }
  } catch (error: any) {
    console.error('Flutterwave refund error:', error);
    return res.status(500).json({
      error: 'Flutterwave refund failed',
      details: error?.message || 'Unknown error',
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
