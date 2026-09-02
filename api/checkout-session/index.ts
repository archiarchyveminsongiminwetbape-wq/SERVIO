import Stripe from 'stripe';

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
    const { amount, currency = 'eur', bookingId, userId, providerId, clientEmail, metadata = {} } = req.body || {};

    if (!amount || !bookingId || !userId || !providerId) {
      return res.status(400).json({ error: 'Missing required payment parameters' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe is not configured on the server' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'SERVIO mission payment',
              description: `Mission booking ${bookingId}`,
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || 'http://localhost:5173'}/bookings?payment=success`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:5173'}/bookings?payment=cancelled`,
      customer_email: clientEmail,
      metadata: {
        ...metadata,
        booking_id: String(bookingId),
        user_id: String(userId),
        provider_id: String(providerId),
      },
      payment_method_types: ['card'],
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Stripe checkout failed',
      details: error?.message || 'Unknown error',
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
