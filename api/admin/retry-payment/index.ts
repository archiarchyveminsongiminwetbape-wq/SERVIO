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
    const { paymentId, adminId } = req.body || {};

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

    // Get payment details
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

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', payment.booking_id)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Create new Flutterwave transaction
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.user_id)
      .single();

    const tx_ref = `SERV-RETRY-${booking.id}-${Date.now()}`;
    
    const paymentRequest = {
      tx_ref,
      amount: payment.amount,
      currency: payment.currency,
      email: userProfile?.email || 'customer@example.com',
      phone: '',
      fullname: userProfile?.full_name || 'Customer',
      customer: {
        email: userProfile?.email || 'customer@example.com',
        phone: '',
        name: userProfile?.full_name || 'Customer',
      },
      customizations: {
        title: 'SERVIO Mission Payment - Retry',
        description: `Retry payment for booking ${booking.id}`,
        logo: 'https://your-domain.com/images/servio-logo.png',
      },
      meta: {
        booking_id: booking.id,
        user_id: booking.user_id,
        provider_id: booking.provider_id,
        original_payment_id: paymentId,
      },
      redirect_url: `${process.env.APP_URL || 'http://localhost:5173'}/payment-success?tx_ref=${tx_ref}`,
      payment_options: 'card,orange_money,mtn_money,bank_transfer',
    };

    const response = await flw.Charge.card(paymentRequest);

    if (response.status === 'success') {
      // Update payment record with new transaction reference
      await supabase.from('payments').update({
        provider_payment_id: response.data.id,
        status: 'pending',
        metadata: {
          ...payment.metadata,
          retry_tx_ref: tx_ref,
          original_payment_id: paymentId,
        },
      }).eq('id', paymentId);

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: adminId,
        action_type: 'retry_payment',
        target_type: 'payment',
        target_id: paymentId,
        details: 'Payment retried with new Flutterwave transaction',
      });

      return res.status(200).json({ 
        success: true,
        link: response.meta.authorization.redirect_url,
        tx_ref,
      });
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Flutterwave retry failed',
        details: response,
      });
    }
  } catch (error: any) {
    console.error('Flutterwave retry error:', error);
    return res.status(500).json({
      error: 'Flutterwave retry failed',
      details: error?.message || 'Unknown error',
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
