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
    const { certification_id, admin_id, approved, rejection_reason } = req.body || {};

    if (!certification_id || !admin_id || approved === undefined) {
      return res.status(400).json({ error: 'Missing required fields: certification_id, admin_id, approved' });
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

    // Récupérer la certification
    const { data: certification, error: certError } = await supabase
      .from('account_certifications')
      .select('*')
      .eq('id', certification_id)
      .single();

    if (certError || !certification) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    // Mettre à jour la certification
    const updateData: any = {
      status: approved ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin_id,
      updated_at: new Date().toISOString()
    };

    if (!approved && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    if (approved) {
      updateData.is_verified = true;
    }

    const { data: updatedCertification, error: updateError } = await supabase
      .from('account_certifications')
      .update(updateData)
      .eq('id', certification_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error reviewing certification:', updateError);
      return res.status(500).json({ error: 'Failed to review certification', details: updateError.message });
    }

    // Notifier l'utilisateur du résultat
    await supabase.from('notifications').insert({
      user_id: certification.user_id,
      type: approved ? 'certification_approved' : 'certification_rejected',
      title: approved ? 'Certification approuvée' : 'Certification rejetée',
      body: approved 
        ? `Votre certification ${certification.certification_type} a été approuvée!`
        : `Votre certification ${certification.certification_type} a été rejetée. ${rejection_reason || ''}`,
      metadata: {
        certification_id,
        certification_type: certification.certification_type,
        approved
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedCertification,
      message: approved ? 'Certification approved successfully' : 'Certification rejected successfully'
    });
  } catch (error: any) {
    console.error('Certification review error:', error);
    return res.status(500).json({
      error: 'Failed to review certification',
      details: error?.message || 'Unknown error'
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
