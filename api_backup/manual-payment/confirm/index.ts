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
    const { payment_id, admin_id, admin_notes, evidence_urls } = req.body || {};

    if (!payment_id || !admin_id) {
      return res.status(400).json({ error: 'Missing required fields: payment_id, admin_id' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Vérifier que l'admin est bien admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', admin_id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Récupérer le paiement manuel
    const { data: payment, error: paymentError } = await supabase
      .from('manual_payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment can only be confirmed from pending status' });
    }

    // Mettre à jour le paiement comme confirmé
    const { data: updatedPayment, error: updateError } = await supabase
      .from('manual_payments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: admin_id,
        admin_notes,
        evidence_urls: evidence_urls || payment.evidence_urls,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error confirming payment:', updateError);
      return res.status(500).json({ error: 'Failed to confirm payment', details: updateError.message });
    }

    // Si le paiement est lié à un booking, créer l'escrow account
    if (payment.booking_id) {
      // Vérifier si un escrow existe déjà
      const { data: existingEscrow } = await supabase
        .from('escrow_accounts')
        .select('*')
        .eq('booking_id', payment.booking_id)
        .single();

      if (!existingEscrow) {
        // Créer l'escrow account
        const { data: escrow } = await supabase
          .from('escrow_accounts')
          .insert({
            booking_id: payment.booking_id,
            total_amount: payment.amount,
            currency: payment.currency,
            amount_remaining: payment.amount,
            status: 'funded',
            funded_at: new Date().toISOString()
          })
          .select()
          .single();

        if (escrow) {
          // Créer les milestones par défaut
          await supabase
            .from('milestones')
            .insert([
              {
                escrow_id: escrow.id,
                title: 'Initial Payment',
                description: 'Premier paiement après début du travail',
                percentage: 30.0,
                amount: payment.amount * 0.30
              },
              {
                escrow_id: escrow.id,
                title: 'Progress Payment',
                description: 'Paiement intermédiaire après avancement',
                percentage: 40.0,
                amount: payment.amount * 0.40
              },
              {
                escrow_id: escrow.id,
                title: 'Final Payment',
                description: 'Paiement final après livraison complète',
                percentage: 30.0,
                amount: payment.amount * 0.30
              }
            ]);

          // Mettre à jour le booking
          await supabase
            .from('bookings')
            .update({
              payment_status: 'in_escrow',
              status: 'confirmed'
            })
            .eq('id', payment.booking_id);
        }
      }
    }

    // Notifier le client que le paiement a été confirmé
    if (payment.user_id) {
      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        type: 'payment_confirmed',
        title: 'Paiement confirmé',
        body: `Votre paiement de ${payment.amount} ${payment.currency} a été confirmé. Le travail peut commencer.`,
        metadata: {
          payment_id,
          amount: payment.amount,
          currency: payment.currency
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedPayment,
      message: 'Payment confirmed successfully'
    });
  } catch (error: any) {
    console.error('Manual payment confirmation error:', error);
    return res.status(500).json({
      error: 'Failed to confirm payment',
      details: error?.message || 'Unknown error'
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
