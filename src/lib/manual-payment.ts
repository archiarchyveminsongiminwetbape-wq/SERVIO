/**
 * Service de Paiement Manuel - Remplacement de Flutterwave
 * 
 * Ce service permet de gérer les paiements sans dépendance externe,
 * en utilisant un système de confirmation manuelle par l'admin.
 */

export interface ManualPaymentConfig {
  tx_ref: string;
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  fullname?: string;
  booking_id?: string;
  user_id?: string;
  payment_method?: string;
}

export interface ManualPaymentRecord {
  id: string;
  tx_ref: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  payment_method: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  booking_id?: string;
  user_id?: string;
  admin_notes?: string;
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  evidence_urls?: string[];
}

export class ManualPaymentService {
  /**
   * Initie un paiement manuel
   * Contrairement à Flutterwave, cela crée simplement un enregistrement
   * qui devra être confirmé manuellement par l'admin
   */
  async initiatePayment(config: ManualPaymentConfig): Promise<{
    success: boolean;
    data?: ManualPaymentRecord;
    error?: string;
  }> {
    try {
      // Dans un système manuel, nous créons un enregistrement de paiement
      // qui sera confirmé plus tard par l'admin
      const paymentRecord: Partial<ManualPaymentRecord> = {
        tx_ref: config.tx_ref,
        amount: config.amount,
        currency: config.currency,
        status: 'pending',
        payment_method: config.payment_method || 'manual',
        customer_email: config.email,
        customer_name: config.fullname || config.email.split('@')[0],
        customer_phone: config.phone,
        booking_id: config.booking_id,
        user_id: config.user_id,
        created_at: new Date().toISOString(),
      };

      // Dans une implémentation réelle, ceci serait sauvegardé en base de données
      // Pour l'instant, nous retournons un succès simulé
      return {
        success: true,
        data: paymentRecord as ManualPaymentRecord,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initiate manual payment',
      };
    }
  }

  /**
   * Simule la vérification d'un paiement manuel
   * Dans un système réel, l'admin confirmerait visuellement via le dashboard
   */
  async verifyTransaction(transactionId: string): Promise<{
    success: boolean;
    data?: ManualPaymentRecord;
    error?: string;
  }> {
    try {
      // Dans un système manuel, la vérification consiste à vérifier
      // si l'admin a confirmé le paiement
      return {
        success: true,
        data: {
          id: transactionId,
          tx_ref: 'MANUAL-' + transactionId,
          amount: 0,
          currency: 'XAF',
          status: 'pending',
          payment_method: 'manual',
          customer_email: '',
          customer_name: '',
          created_at: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify manual payment',
      };
    }
  }

  /**
   * Génère une référence de transaction unique
   */
  generateTxRef(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `MANUAL-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Formate le montant pour affichage
   */
  formatAmount(amount: number, currency: string): string {
    return `${amount.toLocaleString()} ${currency}`;
  }

  /**
   * Détermine si un paiement est Orange Money
   * Pour le système manuel, cela dépend de la méthode choisie
   */
  isOrangeMoneyPayment(paymentMethod: string): boolean {
    return paymentMethod?.toLowerCase().includes('orange') || 
           paymentMethod?.toLowerCase() === 'mobile_money';
  }

  /**
   * Obtient les méthodes de paiement disponibles
   */
  getAvailablePaymentMethods() {
    return [
      { value: 'orange_money', label: 'Orange Money', icon: '🍊' },
      { value: 'mtn_money', label: 'MTN Money', icon: '🟡' },
      { value: 'wave', label: 'Wave', icon: '🌊' },
      { value: 'bank_transfer', label: 'Virement bancaire', icon: '🏦' },
      { value: 'cash', label: 'Espèces', icon: '💵' },
      { value: 'check', label: 'Chèque', icon: '📝' },
    ];
  }

  /**
   * Obtient les pays supportés (comme avec Flutterwave)
   */
  getSupportedCountries() {
    return [
      { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
      { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
      { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
      { code: 'ML', name: 'Mali', flag: '🇲🇱' },
      { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
      { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
      { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
    ];
  }

  /**
   * Vérifie si un pays est supporté
   */
  isCountrySupported(countryCode: string): boolean {
    return this.getSupportedCountries().some(
      country => country.code === countryCode?.toUpperCase()
    );
  }
}

// Instance singleton
export const manualPaymentService = new ManualPaymentService();

/**
 * Fonctions utilitaires pour le système manuel
 */

/**
 * Génère un numéro de référence de virement manuel
 */
export function generateManualTransferReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `MANUAL-TRF-${timestamp}-${random}`.toUpperCase();
}

/**
 * Détermine le statut d'un paiement manuel
 */
export function getManualPaymentStatus(status: string): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case 'pending':
      return { label: 'En attente', color: 'yellow', icon: '⏳' };
    case 'confirmed':
      return { label: 'Confirmé', color: 'green', icon: '✅' };
    case 'rejected':
      return { label: 'Rejeté', color: 'red', icon: '❌' };
    case 'cancelled':
      return { label: 'Annulé', color: 'gray', icon: '🚫' };
    default:
      return { label: status, color: 'gray', icon: '❓' };
  }
}

/**
 * Formate une date pour affichage
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
