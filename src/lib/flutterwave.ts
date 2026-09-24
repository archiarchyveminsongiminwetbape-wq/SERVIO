// Client-side Flutterwave interface - uses API calls instead of direct SDK
// The actual Flutterwave SDK is server-side only

export interface FlutterwavePaymentConfig {
  tx_ref: string;
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  fullname?: string;
  customer?: {
    email: string;
    phone?: string;
    name: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: any;
  redirect_url?: string;
  booking_id?: string;
  user_id?: string;
}

/**
 * Configuration Flutterwave optimisée pour Orange Money
 * 
 * Flutterwave supporte les cartes virtuelles Orange Money dans plusieurs pays africains:
 * - Sénégal, Côte d'Ivoire, Mali, Burkina Faso, Cameroun, etc.
 * 
 * Cette configuration privilégie Orange Money comme méthode de paiement
 */
export class FlutterwaveService {
  /**
   * Initialise un paiement avec priorité pour Orange Money
   * 
   * payment_options: 'card,orange_money,mtn_money,mobile_money,bank_transfer,ussd'
   * L'ordre détermine la priorité d'affichage
   */
  async initiatePayment(config: FlutterwavePaymentConfig) {
    try {
      // Call the checkout-session API endpoint
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: config.amount,
          currency: config.currency,
          bookingId: config.booking_id,
          userId: config.user_id,
          clientEmail: config.email,
          metadata: {
            client_name: config.fullname,
            ...config.meta,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.link) {
        return {
          success: true,
          data: { link: result.link, tx_ref: result.tx_ref },
          message: 'Payment initiated successfully',
        };
      } else {
        return {
          success: false,
          error: result.error || 'Payment initiation failed',
        };
      }
    } catch (error: any) {
      console.error('Flutterwave payment initiation error:', error);
      return {
        success: false,
        error: error.message || 'Payment initiation failed',
      };
    }
  }

  /**
   * Initie un paiement spécifique pour Orange Money
   * Cette méthode force l'utilisation d'Orange Money
   */
  async initiateOrangeMoneyPayment(config: FlutterwavePaymentConfig) {
    // Orange Money specific payments use the same checkout endpoint
    // The payment method is handled on the Flutterwave checkout page
    return this.initiatePayment(config);
  }

  /**
   * Vérifie une transaction
   */
  async verifyTransaction(transactionId: string) {
    try {
      const response = await fetch(`/api/verify-payment?transactionId=${transactionId}`);
      const result = await response.json();

      if (response.ok) {
        return {
          success: result.success,
          data: result.data,
          message: result.message,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Transaction verification failed',
        };
      }
    } catch (error: any) {
      console.error('Flutterwave verification error:', error);
      return {
        success: false,
        error: error.message || 'Transaction verification failed',
      };
    }
  }

  /**
   * Rembourse une transaction
   */
  async refundTransaction(transactionId: string, amount?: number) {
    try {
      const response = await fetch('/api/admin/refund-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId, amount }),
      });
      const result = await response.json();

      if (response.ok) {
        return {
          success: result.success,
          data: result.data,
          message: result.message,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Refund failed',
        };
      }
    } catch (error: any) {
      console.error('Flutterwave refund error:', error);
      return {
        success: false,
        error: error.message || 'Refund failed',
      };
    }
  }

  /**
   * Obtient les détails d'une transaction
   */
  async getTransaction(transactionId: string) {
    try {
      const response = await fetch(`/api/verify-payment?transactionId=${transactionId}`);
      const result = await response.json();

      if (response.ok) {
        return {
          success: result.success,
          data: result.data,
          message: result.message,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get transaction',
        };
      }
    } catch (error: any) {
      console.error('Flutterwave get transaction error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get transaction',
      };
    }
  }

  /**
   * Initie un virement vers le compte du prestataire
   * Utilisé pour libérer les fonds de l'escrow
   */
  async initiateTransfer(transferData: {
    account_bank: string;
    account_number: string;
    amount: number;
    currency: string;
    narration: string;
    beneficiary_name: string;
  }) {
    try {
      const response = await fetch('/api/admin/initiate-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });
      const result = await response.json();

      if (response.ok) {
        return {
          success: result.success,
          data: result.data,
          message: result.message,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Transfer failed',
        };
      }
    } catch (error: any) {
      console.error('Flutterwave transfer error:', error);
      return {
        success: false,
        error: error.message || 'Transfer failed',
      };
    }
  }
}

// Instance singleton
export const flutterwaveService = new FlutterwaveService();

/**
 * Génère une référence de transaction unique
 */
export function generateTxRef(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `SERVIO-${timestamp}-${random}`.toUpperCase();
}

/**
 * Détermine si un paiement est Orange Money
 */
export function isOrangeMoneyPayment(paymentType: string): boolean {
  return paymentType?.toLowerCase().includes('orange') || 
         paymentType?.toLowerCase() === 'mobile_money';
}

/**
 * Obtient les pays supportés par Orange Money via Flutterwave
 */
export const ORANGE_MONEY_COUNTRIES = [
  'SN', // Sénégal
  'CI', // Côte d'Ivoire
  'ML', // Mali
  'BF', // Burkina Faso
  'CM', // Cameroun
  'CG', // Congo
  'GA', // Gabon
  'MG', // Madagascar
  'MR', // Mauritanie
  'UG', // Ouganda
  'KE', // Kenya
];

/**
 * Vérifie si un pays est supporté par Orange Money
 */
export function isOrangeMoneyCountry(countryCode: string): boolean {
  return ORANGE_MONEY_COUNTRIES.includes(countryCode?.toUpperCase());
}
