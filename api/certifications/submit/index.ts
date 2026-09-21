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
    const { user_id, certification_type, evidence_data } = req.body || {};

    if (!user_id || !certification_type) {
      return res.status(400).json({ error: 'Missing required fields: user_id, certification_type' });
    }

    const validTypes = ['identity', 'phone', 'email', 'address', 'business', 'provider'];
    if (!validTypes.includes(certification_type)) {
      return res.status(400).json({ error: 'Invalid certification_type' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Vérifier que l'utilisateur existe
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Créer ou mettre à jour la certification
    const { data: certification, error: certError } = await supabase
      .from('account_certifications')
      .upsert({
        user_id,
        certification_type,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        evidence_data: evidence_data || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,certification_type'
      })
      .select()
      .single();

    if (certError) {
      console.error('Error submitting certification:', certError);
      return res.status(500).json({ error: 'Failed to submit certification', details: certError.message });
    }

    // Notifier les admins de la nouvelle soumission
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'certification_submitted',
          title: 'Nouvelle certification soumise',
          body: `Un utilisateur a soumis une certification de type ${certification_type}`,
          metadata: {
            certification_id: certification.id,
            user_id,
            certification_type
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: certification,
      message: 'Certification submitted successfully'
    });
  } catch (error: any) {
    console.error('Certification submission error:', error);
    return res.status(500).json({
      error: 'Failed to submit certification',
      details: error?.message || 'Unknown error'
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
