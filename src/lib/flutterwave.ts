import Flutterwave from 'flutterwave-node-v3';

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
  private flw: Flutterwave;

  constructor() {
    this.flw = new Flutterwave(
      process.env.FLUTTERWAVE_PUBLIC_KEY || '',
      process.env.FLUTTERWAVE_SECRET_KEY || '',
      process.env.FLUTTERWAVE_ENCRYPTION_KEY || ''
    );
  }

  /**
   * Initialise un paiement avec priorité pour Orange Money
   * 
   * payment_options: 'card,orange_money,mtn_money,mobile_money,bank_transfer,ussd'
   * L'ordre détermine la priorité d'affichage
   */
  async initiatePayment(config: FlutterwavePaymentConfig) {
    try {
      const paymentRequest = {
        tx_ref: config.tx_ref,
        amount: config.amount,
        currency: config.currency,
        email: config.email,
        phone: config.phone,
        fullname: config.fullname,
        customer: config.customer,
        customizations: config.customizations || {
          title: 'SERVIO - Paiement de service',
          description: 'Paiement sécurisé via SERVIO',
        },
        meta: {
          ...config.meta,
          booking_id: config.booking_id,
          user_id: config.user_id,
          platform: 'servio',
        },
        redirect_url: config.redirect_url,
        // PRIORITÉ: Orange Money en premier, puis autres méthodes
        payment_options: 'orange_money,card,mtn_money,mobile_money,bank_transfer,ussd',
      };

      const response = await this.flw.Charge.card(paymentRequest);

      return {
        success: response.status === 'success',
        data: response.data,
        message: response.message,
      };
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
    try {
      const paymentRequest = {
        tx_ref: config.tx_ref,
        amount: config.amount,
        currency: config.currency,
        email: config.email,
        phone: config.phone,
        fullname: config.fullname,
        customer: config.customer,
        customizations: config.customizations || {
          title: 'SERVIO - Paiement Orange Money',
          description: 'Paiement sécurisé via Orange Money',
        },
        meta: {
          ...config.meta,
          booking_id: config.booking_id,
          user_id: config.user_id,
          platform: 'servio',
          payment_method: 'orange_money',
        },
        redirect_url: config.redirect_url,
        // FORCE Orange Money uniquement
        payment_options: 'orange_money',
      };

      const response = await this.flw.Charge.mobile_money(paymentRequest);

      return {
        success: response.status === 'success',
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      console.error('Flutterwave Orange Money payment error:', error);
      return {
        success: false,
        error: error.message || 'Orange Money payment failed',
      };
    }
  }

  /**
   * Vérifie une transaction
   */
  async verifyTransaction(transactionId: string) {
    try {
      const response = await this.flw.Transaction.verify({ id: transactionId });

      return {
        success: response.status === 'success',
        data: response.data,
        message: response.message,
      };
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
      const response = await this.flw.Transaction.refund({
        id: transactionId,
        amount,
      });

      return {
        success: response.status === 'success',
        data: response.data,
        message: response.message,
      };
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
      const response = await this.flw.Transaction.get({ id: transactionId });

      return {
        success: response.status === 'success',
        data: response.data,
        message: response.message,
      };
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
      const response = await this.flw.Transfer.initiate({
        account_bank: transferData.account_bank,
        account_number: transferData.account_number,
        amount: transferData.amount,
        currency: transferData.currency,
        narration: transferData.narration,
        beneficiary_name: transferData.beneficiary_name,
        reference: `SERVIO-ESCROW-${Date.now()}`,
      });

      return {
        success: response.status === 'success',
        data: response.data,
        message: response.message,
      };
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
