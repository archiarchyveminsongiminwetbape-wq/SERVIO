import Flutterwave from 'flutterwave-node-v3';
import { createClient } from '@supabase/supabase-js';

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY || '',
  process.env.FLUTTERWAVE_SECRET_KEY || '',
  process.env.FLUTTERWAVE_ENCRYPTION_KEY || ''
);

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false, autoRefreshToken: false } }
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
    const { amount, currency = 'XAF', planId, userId, clientEmail, metadata = {} } = req.body || {};

    if (!amount || !planId || !userId) {
      return res.status(400).json({ error: 'Missing required subscription parameters' });
    }

    if (!process.env.FLUTTERWAVE_PUBLIC_KEY || !process.env.FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ error: 'Flutterwave is not configured on the server' });
    }

    const tx_ref = `SUB-${planId}-${userId}-${Date.now()}`;
    
    const paymentRequest = {
      tx_ref,
      amount: amount,
      currency: currency,
      email: clientEmail,
      phone: '',
      fullname: metadata.client_name || 'Subscriber',
      customer: {
        email: clientEmail,
        phone: '',
        name: metadata.client_name || 'Subscriber',
      },
      customizations: {
        title: 'SERVIO Premium Subscription',
        description: `Subscription for plan ${planId}`,
        logo: 'https://your-domain.com/images/servio-logo.png',
      },
      meta: {
        subscription_plan: planId,
        user_id: userId,
        ...metadata,
      },
      redirect_url: `${process.env.APP_URL || 'http://localhost:5173'}/subscription-success?tx_ref=${tx_ref}&plan=${planId}`,
      payment_options: 'card,orange_money,mtn_money,bank_transfer',
    };

    const response = await flw.Charge.card(paymentRequest);

    if (response.status === 'success') {
      return res.status(200).json({ 
        link: response.meta.authorization.redirect_url,
        tx_ref,
      });
    } else {
      return res.status(400).json({ error: 'Flutterwave subscription checkout failed', details: response });
    }
  } catch (error: any) {
    console.error('Flutterwave subscription checkout error:', error);
    return res.status(500).json({
      error: 'Flutterwave subscription checkout failed',
      details: error?.message || 'Unknown error',
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
