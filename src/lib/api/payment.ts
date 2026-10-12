// API de paiement - appels aux endpoints serveur

async function postPaymentApi<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || !result) {
    throw new Error(result?.error || 'Le service de paiement est indisponible.');
  }

  return result as T;
}

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
 */
export async function createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
  try {
    const { amount, currency, bookingId, userId, providerId, clientEmail, metadata = {} } = request;

    if (!amount || !bookingId || !userId || !providerId) {
      return { success: false, error: 'Missing required payment parameters' };
    }

    return await postPaymentApi<CheckoutSessionResponse>('/api/checkout-session', {
      amount,
      currency,
      bookingId,
      userId,
      providerId,
      clientEmail,
      metadata,
    });
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
 */
export async function verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
  try {
    const { tx_ref } = request;

    if (!tx_ref) {
      return { success: false, error: 'Transaction reference is required' };
    }

    return await postPaymentApi<VerifyPaymentResponse>('/api/verify-payment', { tx_ref });
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
    return await postPaymentApi('/api/admin/initiate-transfer', transferData);
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
    return await postPaymentApi('/api/admin/refund-payment', { transactionId, amount });
  } catch (error: any) {
    console.error('Refund error:', error);
    return {
      success: false,
      error: error.message || 'Refund failed',
    };
  }
}