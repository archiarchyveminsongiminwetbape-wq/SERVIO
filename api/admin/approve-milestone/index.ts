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
    const { milestone_id, admin_id, notes } = req.body || {};

    if (!milestone_id || !admin_id) {
      return res.status(400).json({ error: 'Missing required fields: milestone_id, admin_id' });
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

    // Récupérer le milestone et vérifier son statut
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestone_id)
      .single();

    if (milestoneError || !milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.status !== 'completed') {
      return res.status(400).json({ error: 'Milestone must be completed before approval' });
    }

    // Approuver le milestone
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('milestones')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: admin_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', milestone_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving milestone:', updateError);
      return res.status(500).json({ error: 'Failed to approve milestone', details: updateError.message });
    }

    // Récupérer les détails pour notification
    const { data: escrowDetails } = await supabase
      .from('milestones')
      .select(`
        escrow_id,
        escrow_accounts (
          booking_id,
          bookings (
            client_id,
            provider_id,
            provider_profiles (
              user_id
            )
          )
        )
      `)
      .eq('id', milestone_id)
      .single();

    // Notifier le prestataire que le milestone a été approuvé
    const providerUserId = escrowDetails?.escrow_accounts?.[0]?.bookings?.[0]?.provider_profiles?.[0]?.user_id;
    if (providerUserId) {
      await supabase.from('notifications').insert({
        user_id: providerUserId,
        type: 'milestone_approved',
        title: 'Jalon approuvé',
        body: `Le jalon "${milestone.title}" a été approuvé. Le paiement sera libéré prochainement.`,
        metadata: {
          milestone_id,
          escrow_id: escrowDetails.escrow_id,
          amount: milestone.amount
        }
      });
    }

    // Notifier le client que le milestone a été approuvé
    const clientId = escrowDetails?.escrow_accounts?.[0]?.bookings?.[0]?.client_id;
    if (clientId) {
      await supabase.from('notifications').insert({
        user_id: clientId,
        type: 'milestone_approved',
        title: 'Jalon approuvé',
        body: `Le jalon "${milestone.title}" a été approuvé. Un paiement de ${milestone.amount} sera libéré au prestataire.`,
        metadata: {
          milestone_id,
          escrow_id: escrowDetails.escrow_id,
          amount: milestone.amount
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedMilestone,
      message: 'Milestone approved successfully'
    });
  } catch (error: any) {
    console.error('Milestone approval error:', error);
    return res.status(500).json({
      error: 'Failed to approve milestone',
      details: error?.message || 'Unknown error'
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
