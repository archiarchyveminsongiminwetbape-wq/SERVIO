// API de paiement - Simulation des endpoints backend pour développement
import { supabase } from '@/lib/supabase';

export interface CheckoutSessionRequest {
  amount: number;
  currency: string;
  bookingId: string;
  userId: string;
  providerId: string;
  clientEmail: string;
  metadata?: any;
}

export interface CheckoutSessionResponse {
  success: boolean;
  link?: string;
  tx_ref?: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  tx_ref: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Crée une session de paiement Flutterwave
 * Simule l'endpoint /api/checkout-session
 */
export async function createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
  try {
    const { amount, currency, bookingId, userId, providerId, clientEmail, metadata = {} } = request;

    if (!amount || !bookingId || !userId || !providerId) {
      return { success: false, error: 'Missing required payment parameters' };
    }

    // Générer une référence de transaction
    const tx_ref = `SERV-${bookingId}-${Date.now()}`;

    // Mise à jour de la réservation avec les métadonnées de paiement
    const { data: booking } = await supabase
      .from('bookings')
      .select('metadata')
      .eq('id', bookingId)
      .single();

    const existingMetadata = booking?.metadata || {};
    await supabase.from('bookings').update({
      metadata: {
        ...existingMetadata,
        payment_intent_reference: tx_ref,
        flutterwave_tx_ref: tx_ref,
        ...metadata,
      },
    }).eq('id', bookingId);

    // Pour le développement, nous simulons un lien de paiement
    // En production, ceci appellerait l'API Flutterwave réelle
    const mockPaymentLink = `https://flutterwave.com/pay/${tx_ref}`;

    return {
      success: true,
      link: mockPaymentLink,
      tx_ref,
    };
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return {
      success: false,
      error: error.message || 'Payment session creation failed',
    };
  }
}

/**
 * Vérifie un paiement Flutterwave
 * Simule l'endpoint /api/verify-payment
 */
export async function verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
  try {
    const { tx_ref } = request;

    if (!tx_ref) {
      return { success: false, error: 'Transaction reference is required' };
    }

    // Pour le développement, nous simulons une vérification réussie
    // En production, ceci appellerait l'API Flutterwave réelle
    
    // Trouver la réservation correspondante
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('metadata->>flutterwave_tx_ref', tx_ref)
      .single();

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Simuler une vérification réussie
    await supabase.from('bookings').update({
      payment_status: 'paid',
      status: 'confirmed',
    }).eq('id', booking.id);

    return {
      success: true,
      data: {
        tx_ref,
        status: 'successful',
        amount: booking.price,
        currency: booking.currency,
      },
    };
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message || 'Payment verification failed',
    };
  }
}

/**
 * Initie un transfert vers le compte d'un prestataire
 * Utilisé pour libérer les fonds de l'escrow
 */
export async function initiateTransfer(transferData: {
  account_bank: string;
  account_number: string;
  amount: number;
  currency: string;
  narration: string;
  beneficiary_name: string;
}) {
  try {
    // Pour le développement, nous simulons un transfert réussi
    // En production, ceci appellerait l'API Flutterwave réelle
    
    console.log('Transfer initiated:', transferData);
    
    return {
      success: true,
      data: {
        transfer_id: `TRF-${Date.now()}`,
        status: 'successful',
        amount: transferData.amount,
      },
    };
  } catch (error: any) {
    console.error('Transfer error:', error);
    return {
      success: false,
      error: error.message || 'Transfer failed',
    };
  }
}

/**
 * Rembourse une transaction
 */
export async function refundTransaction(transactionId: string, amount?: number) {
  try {
    // Pour le développement, nous simulons un remboursement réussi
    // En production, ceci appellerait l'API Flutterwave réelle
    
    console.log('Refund initiated:', { transactionId, amount });
    
    return {
      success: true,
      data: {
        refund_id: `REF-${Date.now()}`,
        status: 'successful',
        amount: amount,
      },
    };
  } catch (error: any) {
    console.error('Refund error:', error);
    return {
      success: false,
      error: error.message || 'Refund failed',
    };
  }
}