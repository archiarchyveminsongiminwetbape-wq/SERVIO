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
    const { escrow_id, milestone_id, admin_id } = req.body || {};

    if (!escrow_id || !milestone_id || !admin_id) {
      return res.status(400).json({ error: 'Missing required fields: escrow_id, milestone_id, admin_id' });
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

    // Appeler la fonction PostgreSQL pour libérer les fonds
    const { data: releaseResult, error: releaseError } = await supabase.rpc(
      'release_escrow_funds',
      {
        escrow_id,
        milestone_id,
        admin_id
      }
    );

    if (releaseError) {
      console.error('Error releasing escrow funds:', releaseError);
      return res.status(500).json({ error: 'Failed to release escrow funds', details: releaseError.message });
    }

    // Notifier le prestataire que des fonds ont été libérés
    const { data: escrow } = await supabase
      .from('escrow_accounts')
      .select(`
        booking_id,
        bookings (
          provider_id,
          provider_profiles (
            user_id
          )
        )
      `)
      .eq('id', escrow_id)
      .single();

    const escrowData = escrow as any;
    const bookings = escrowData?.bookings;
    const firstBooking = Array.isArray(bookings) ? bookings[0] : bookings;
    const providerProfiles = firstBooking?.provider_profiles;
    const firstProviderProfile = Array.isArray(providerProfiles) ? providerProfiles[0] : providerProfiles;
    const providerUserId = firstProviderProfile?.user_id;
    if (providerUserId) {
      await supabase.from('notifications').insert({
        user_id: providerUserId,
        type: 'payment_released',
        title: 'Paiement libéré',
        body: `Un paiement de ${releaseResult.amount_released} a été libéré pour votre projet.`,
        metadata: {
          escrow_id,
          milestone_id,
          amount: releaseResult.amount_released
        }
      });
    }

    // Initier automatiquement le virement si possible
    try {
      const transferResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/initiate-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrow_id,
          milestone_id,
          admin_id
        })
      });

      const transferResult = await transferResponse.json();
      
      if (transferResult.success) {
        console.log('Automatic transfer initiated successfully');
      } else {
        console.log('Automatic transfer failed, manual intervention may be required:', transferResult.error);
      }
    } catch (transferError) {
      console.log('Automatic transfer initiation failed, manual intervention may be required:', transferError);
    }

    return res.status(200).json({
      success: true,
      data: releaseResult
    });
  } catch (error: any) {
    console.error('Escrow release error:', error);
    return res.status(500).json({
      error: 'Failed to release escrow funds',
      details: error?.message || 'Unknown error'
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
