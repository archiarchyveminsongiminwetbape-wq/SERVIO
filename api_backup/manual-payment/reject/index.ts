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
    const { payment_id, admin_id, rejection_reason } = req.body || {};

    if (!payment_id || !admin_id) {
      return res.status(400).json({ error: 'Missing required fields: payment_id, admin_id' });
    }

    if (!rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
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

    // Mettre à jour le paiement comme rejeté
    const { data: updatedPayment, error: updateError } = await supabase
      .from('manual_payments')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: admin_id,
        rejection_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting payment:', updateError);
      return res.status(500).json({ error: 'Failed to reject payment', details: updateError.message });
    }

    // Notifier le client que le paiement a été rejeté
    if (updatedPayment.user_id) {
      await supabase.from('notifications').insert({
        user_id: updatedPayment.user_id,
        type: 'payment_rejected',
        title: 'Paiement rejeté',
        body: `Votre paiement de ${updatedPayment.amount} ${updatedPayment.currency} a été rejeté. Raison: ${rejection_reason}`,
        metadata: {
          payment_id,
          rejection_reason
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedPayment,
      message: 'Payment rejected successfully'
    });
  } catch (error: any) {
    console.error('Manual payment rejection error:', error);
    return res.status(500).json({
      error: 'Failed to reject payment',
      details: error?.message || 'Unknown error'
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
