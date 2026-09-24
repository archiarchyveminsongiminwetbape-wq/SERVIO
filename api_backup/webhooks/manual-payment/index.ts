import { createClient } from '@supabase/supabase-js';

/**
 * Webhook pour le système de paiement manuel
 * Ce webhook est une version simplifiée qui ne dépend pas de Flutterwave
 * Il sert principalement pour les notifications et mises à jour de statut
 */

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
    const { event, data } = req.body || {};

    // Pour le système manuel, nous avons des événements simplifiés
    switch (event) {
      case 'payment_submitted':
        await handlePaymentSubmitted(data);
        break;
      
      case 'payment_confirmed':
        await handlePaymentConfirmed(data);
        break;
      
      case 'payment_rejected':
        await handlePaymentRejected(data);
        break;
      
      case 'transfer_completed':
        await handleTransferCompleted(data);
        break;
      
      default:
        console.log('Unknown event:', event);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Manual payment webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handlePaymentSubmitted(data: any) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { payment_id, user_id } = data;

  // Notifier l'admin qu'un nouveau paiement est soumis
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (admins && admins.length > 0) {
    for (const admin of admins) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'payment_submitted',
        title: 'Nouveau paiement soumis',
        body: 'Un client a soumis un paiement manuel qui nécessite votre confirmation',
        metadata: {
          payment_id,
          user_id
        }
      });
    }
  }
}

async function handlePaymentConfirmed(data: any) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { payment_id, booking_id, user_id } = data;

  // Le système d'escrow est automatiquement créé lors de la confirmation
  // via l'API /api/manual-payment/confirm

  // Notifier le prestataire que le paiement est confirmé
  if (booking_id) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('provider_id')
      .eq('id', booking_id)
      .single();

    if (booking) {
      await supabase.from('notifications').insert({
        user_id: booking.provider_id,
        type: 'payment_confirmed',
        title: 'Paiement confirmé',
        body: 'Le paiement pour votre service a été confirmé. Vous pouvez commencer le travail.',
        metadata: {
          booking_id,
          payment_id
        }
      });
    }
  }
}

async function handlePaymentRejected(data: any) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { payment_id, booking_id, user_id } = data;

  // Annuler le booking si le paiement est rejeté
  if (booking_id) {
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        payment_status: 'failed'
      })
      .eq('id', booking_id);
  }
}

async function handleTransferCompleted(data: any) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { transfer_id, provider_id, amount } = data;

  // Mettre à jour le statut du transfert
  await supabase
    .from('transfer_transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', transfer_id);

  // Notifier le prestataire que le virement est complété
  if (provider_id) {
    await supabase.from('notifications').insert({
      user_id: provider_id,
      type: 'transfer_completed',
      title: 'Virement reçu',
      body: `Un virement de ${amount} a été reçu sur votre compte.`,
      metadata: {
        transfer_id,
        amount
      }
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
