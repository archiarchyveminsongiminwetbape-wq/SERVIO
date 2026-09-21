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
    const { milestone_id, provider_id, evidence_urls, notes } = req.body || {};

    if (!milestone_id || !provider_id) {
      return res.status(400).json({ error: 'Missing required fields: milestone_id, provider_id' });
    }

    if (!evidence_urls || !Array.isArray(evidence_urls) || evidence_urls.length === 0) {
      return res.status(400).json({ error: 'Evidence URLs are required and must be an array' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Vérifier que le provider est bien le propriétaire du milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select(`
        *,
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

    if (milestoneError || !milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.escrow_accounts.bookings.provider_profiles.user_id !== provider_id) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this milestone' });
    }

    if (milestone.status !== 'pending') {
      return res.status(400).json({ error: 'Milestone can only be submitted from pending status' });
    }

    // Soumettre le milestone avec les preuves
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('milestones')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        evidence_urls,
        description: notes || milestone.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', milestone_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error submitting milestone:', updateError);
      return res.status(500).json({ error: 'Failed to submit milestone', details: updateError.message });
    }

    // Notifier l'admin pour review
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'milestone_submitted',
          title: 'Jalon soumis pour review',
          body: `Le jalon "${milestone.title}" a été soumis avec des preuves de travail`,
          metadata: {
            milestone_id,
            escrow_id: milestone.escrow_id,
            provider_id,
            evidence_count: evidence_urls.length
          }
        });
      }
    }

    // Notifier le client que le milestone a été soumis
    if (escrowDetails?.escrow_accounts?.bookings?.client_id) {
      await supabase.from('notifications').insert({
        user_id: escrowDetails.escrow_accounts.bookings.client_id,
        type: 'milestone_submitted',
        title: 'Jalon soumis',
        body: `Le jalon "${updatedMilestone.title}" a été soumis pour validation`,
        metadata: {
          milestone_id,
          escrow_id: milestone.escrow_id
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedMilestone,
      message: 'Milestone submitted successfully'
    });
  } catch (error: any) {
    console.error('Milestone submission error:', error);
    return res.status(500).json({
      error: 'Failed to submit milestone',
      details: error?.message || 'Unknown error'
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
