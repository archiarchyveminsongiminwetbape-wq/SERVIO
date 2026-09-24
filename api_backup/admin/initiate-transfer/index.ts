import Flutterwave from 'flutterwave-node-v3';
import { createClient } from '@supabase/supabase-js';

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY || '',
  process.env.FLUTTERWAVE_SECRET_KEY || '',
  process.env.FLUTTERWAVE_ENCRYPTION_KEY || ''
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

    // Récupérer les données de l'escrow et du milestone
    const { data: escrow } = await supabase
      .from('escrow_accounts')
      .select('*, bookings(provider_id)')
      .eq('id', escrow_id)
      .single();

    const { data: milestone } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestone_id)
      .single();

    if (!escrow || !milestone) {
      return res.status(404).json({ error: 'Escrow or milestone not found' });
    }

    if (milestone.status !== 'approved') {
      return res.status(400).json({ error: 'Milestone must be approved before transfer' });
    }

    // Récupérer le compte bancaire du provider
    const { data: bankAccount } = await supabase
      .from('provider_bank_accounts')
      .select('*')
      .eq('provider_id', escrow.bookings.provider_id)
      .eq('is_verified', true)
      .order('is_primary', { ascending: false })
      .limit(1)
      .single();

    if (!bankAccount) {
      return res.status(400).json({ 
        error: 'No verified bank account found for provider',
        message: 'Le prestataire n\'a pas de compte bancaire vérifié'
      });
    }

    // Générer une référence de transfert
    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Créer l'enregistrement de transfert
    const { data: transfer, error: transferError } = await supabase
      .from('transfer_transactions')
      .insert({
        escrow_id,
        milestone_id,
        provider_id: escrow.bookings.provider_id,
        bank_account_id: bankAccount.id,
        amount: milestone.amount,
        currency: escrow.currency,
        status: 'processing',
        reference,
        initiated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transferError) {
      console.error('Error creating transfer record:', transferError);
      return res.status(500).json({ error: 'Failed to create transfer record' });
    }

    // Initier le transfert via Flutterwave
    try {
      let flutterwaveResponse;

      if (bankAccount.account_type === 'mobile_money') {
        // Transfert Mobile Money (Orange Money, MTN, etc.)
        const transferData = {
          account_bank: bankAccount.provider.toUpperCase(), // 'ORANGE', 'MTN', etc.
          account_number: bankAccount.account_number,
          amount: milestone.amount,
          currency: escrow.currency,
          narration: `SERVIO - Paiement jalon ${milestone.title}`,
          beneficiary_name: bankAccount.account_name,
          reference: reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/flutterwave/transfer`,
        };

        flutterwaveResponse = await flw.Transfer.initiate(transferData);
      } else {
        // Transfert bancaire classique
        const transferData = {
          account_bank: bankAccount.bank_code,
          account_number: bankAccount.account_number,
          amount: milestone.amount,
          currency: escrow.currency,
          narration: `SERVIO - Paiement jalon ${milestone.title}`,
          beneficiary_name: bankAccount.account_name,
          reference: reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/flutterwave/transfer`,
        };

        flutterwaveResponse = await flw.Transfer.initiate(transferData);
      }

      // Mettre à jour le transfert avec la réponse Flutterwave
      await supabase
        .from('transfer_transactions')
        .update({
          flutterwave_reference: flutterwaveResponse.data?.id,
          flutterwave_response: flutterwaveResponse,
          status: flutterwaveResponse.status === 'success' ? 'processing' : 'failed',
          error_message: flutterwaveResponse.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      // Notifier le provider
      await supabase.from('notifications').insert({
        user_id: escrow.bookings.provider_id,
        type: 'transfer_initiated',
        title: 'Virement initié',
        body: `Un virement de ${milestone.amount} ${escrow.currency} a été initié vers votre compte ${bankAccount.provider}`,
        metadata: {
          transfer_id: transfer.id,
          reference,
          amount: milestone.amount,
          currency: escrow.currency
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          transfer,
          flutterwave_response: flutterwaveResponse
        },
        message: 'Transfer initiated successfully'
      });

    } catch (flutterwaveError: any) {
      console.error('Flutterwave transfer error:', flutterwaveError);

      // Marquer le transfert comme échoué
      await supabase
        .from('transfer_transactions')
        .update({
          status: 'failed',
          error_message: flutterwaveError.message,
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      return res.status(500).json({
        error: 'Flutterwave transfer failed',
        details: flutterwaveError.message
      });
    }

  } catch (error: any) {
    console.error('Transfer initiation error:', error);
    return res.status(500).json({
      error: 'Failed to initiate transfer',
      details: error?.message || 'Unknown error'
    });
  }
}

export const config = {
  runtime: 'nodejs',
};
