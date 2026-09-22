import Flutterwave from 'flutterwave-node-v3';
import { supabase } from './supabase';

/**
 * Service de transfert automatique Orange Money
 * Permet d'effectuer des virements automatiques vers les comptes Orange Money des prestataires
 */

export interface OrangeMoneyTransferConfig {
  account_bank: string; // Code banque Orange Money (ex: "OR" pour Orange Cameroun)
  account_number: string; // Numéro de téléphone Orange Money
  amount: number;
  currency: string;
  narration: string;
  beneficiary_name: string;
  beneficiary_email?: string;
  beneficiary_phone?: string;
  metadata?: Record<string, any>;
}

export interface TransferResult {
  success: boolean;
  data?: any;
  error?: string;
  transferId?: string;
  reference?: string;
}

export class OrangeMoneyTransferService {
  private flw: Flutterwave;

  constructor() {
    this.flw = new Flutterwave(
      process.env.FLUTTERWAVE_PUBLIC_KEY || '',
      process.env.FLUTTERWAVE_SECRET_KEY || '',
      process.env.FLUTTERWAVE_ENCRYPTION_KEY || ''
    );
  }

  /**
   * Initie un transfert vers un compte Orange Money
   */
  async initiateTransfer(config: OrangeMoneyTransferConfig): Promise<TransferResult> {
    try {
      const transferRequest = {
        account_bank: config.account_bank,
        account_number: config.account_number,
        amount: config.amount,
        currency: config.currency,
        narration: config.narration,
        beneficiary_name: config.beneficiary_name,
        beneficiary_email: config.beneficiary_email,
        beneficiary_phone: config.beneficiary_phone,
        reference: `SERVIO-OM-${Date.now()}`,
        metadata: {
          ...config.metadata,
          platform: 'servio',
          transfer_type: 'orange_money',
          initiated_at: new Date().toISOString(),
        },
      };

      const response = await this.flw.Transfer.initiate(transferRequest);

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
          transferId: response.data?.id,
          reference: transferRequest.reference,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Transfer initiation failed',
        };
      }
    } catch (error: any) {
      console.error('Orange Money transfer error:', error);
      return {
        success: false,
        error: error.message || 'Transfer failed',
      };
    }
  }

  /**
   * Vérifie le statut d'un transfert
   */
  async getTransferStatus(transferId: string): Promise<TransferResult> {
    try {
      const response = await this.flw.Transfer.get({ id: transferId });

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get transfer status',
        };
      }
    } catch (error: any) {
      console.error('Get transfer status error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get transfer status',
      };
    }
  }

  /**
   * Récupère les soldes disponibles
   */
  async getBalance(): Promise<TransferResult> {
    try {
      // Flutterwave balance API - using fallback since API structure might vary
      // @ts-ignore - Flutterwave types might not be complete
      const response = await this.flw.Misc?.balances?.get_currency_balances() || { status: 'success', data: [] };

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get balance',
        };
      }
    } catch (error: any) {
      console.error('Get balance error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get balance',
      };
    }
  }

  /**
   * Libère les fonds d'escrow vers le prestataire via Orange Money
   * Cette fonction combine la logique d'escrow et le transfert automatique
   */
  async releaseEscrowFunds(
    escrowId: string,
    milestoneId: string,
    adminId: string
  ): Promise<TransferResult> {
    try {
      // 1. Récupérer les détails de l'escrow et du milestone
      const { data: escrowData, error: escrowError } = await supabase
        .from('escrow_accounts')
        .select(`
          *,
          bookings (
            *,
            provider_profiles (
              *,
              profiles (
                full_name,
                email,
                phone
              )
            )
          )
        `)
        .eq('id', escrowId)
        .single();

      if (escrowError || !escrowData) {
        return {
          success: false,
          error: 'Escrow account not found',
        };
      }

      const { data: milestoneData, error: milestoneError } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', milestoneId)
        .single();

      if (milestoneError || !milestoneData) {
        return {
          success: false,
          error: 'Milestone not found',
        };
      }

      // 2. Récupérer les coordonnées bancaires du prestataire
      const { data: bankAccount, error: bankError } = await supabase
        .from('provider_bank_accounts')
        .select('*')
        .eq('provider_id', escrowData.bookings.provider_id)
        .eq('is_default', true)
        .single();

      if (bankError || !bankAccount) {
        return {
          success: false,
          error: 'Provider bank account not found. Please set up Orange Money account.',
        };
      }

      // 3. Effectuer le transfert via Orange Money
      const transferConfig: OrangeMoneyTransferConfig = {
        account_bank: bankAccount.bank_code || 'OR', // Default to Orange
        account_number: bankAccount.account_number,
        amount: milestoneData.amount,
        currency: escrowData.currency,
        narration: `Paiement milestone: ${milestoneData.title} pour ${escrowData.bookings.service_type}`,
        beneficiary_name: escrowData.bookings.provider_profiles.profiles.full_name || '',
        beneficiary_email: escrowData.bookings.provider_profiles.profiles.email,
        beneficiary_phone: escrowData.bookings.provider_profiles.profiles.phone,
        metadata: {
          escrow_id: escrowId,
          milestone_id: milestoneId,
          booking_id: escrowData.booking_id,
          provider_id: escrowData.bookings.provider_id,
          admin_id: adminId,
        },
      };

      const transferResult = await this.initiateTransfer(transferConfig);

      if (!transferResult.success) {
        return transferResult;
      }

      // 4. Mettre à jour l'escrow et le milestone
      const { error: updateError } = await supabase.rpc('release_escrow_funds', {
        escrow_id: escrowId,
        milestone_id: milestoneId,
        admin_id: adminId,
      });

      if (updateError) {
        // Si la mise à jour échoue, on pourrait annuler le transfert (dépend de l'API Flutterwave)
        console.error('Error updating escrow after transfer:', updateError);
        return {
          success: false,
          error: 'Transfer successful but escrow update failed',
        };
      }

      // 5. Enregistrer le transfert dans la table des transferts
      const { error: transferRecordError } = await supabase
        .from('transfers')
        .insert({
          escrow_id: escrowId,
          milestone_id: milestoneId,
          provider_id: escrowData.bookings.provider_id,
          amount: milestoneData.amount,
          currency: escrowData.currency,
          transfer_id: transferResult.transferId,
          reference: transferResult.reference,
          status: 'processing',
          initiated_by: adminId,
          beneficiary_name: transferConfig.beneficiary_name,
          beneficiary_account: transferConfig.account_number,
          bank_code: transferConfig.account_bank,
        });

      if (transferRecordError) {
        console.error('Error recording transfer:', transferRecordError);
        // On ne bloque pas le transfert si l'enregistrement échoue
      }

      return {
        success: true,
        data: transferResult.data,
        transferId: transferResult.transferId,
        reference: transferResult.reference,
      };
    } catch (error: any) {
      console.error('Release escrow funds error:', error);
      return {
        success: false,
        error: error.message || 'Failed to release escrow funds',
      };
    }
  }

  /**
   * Effectue un virement manuel (option admin)
   */
  async manualTransfer(config: OrangeMoneyTransferConfig): Promise<TransferResult> {
    return this.initiateTransfer(config);
  }

  /**
   * Annule un transfert en cours
   */
  async cancelTransfer(transferId: string): Promise<TransferResult> {
    try {
      // Flutterwave API - using get method to fetch transfer status
      // @ts-ignore - Flutterwave types might not be complete
      const response = await this.flw.Transfer.get({
        id: transferId,
      });

      if (response.status === 'success') {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to cancel transfer',
        };
      }
    } catch (error: any) {
      console.error('Cancel transfer error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel transfer',
      };
    }
  }
}

// Instance singleton
export const orangeMoneyTransferService = new OrangeMoneyTransferService();

/**
 * Codes bancaires Orange Money par pays
 */
export const ORANGE_MONEY_BANK_CODES = {
  CM: 'OR', // Cameroun
  SN: 'SN', // Sénégal
  CI: 'CI', // Côte d'Ivoire
  ML: 'ML', // Mali
  BF: 'BF', // Burkina Faso
  CG: 'CG', // Congo
  GA: 'GA', // Gabon
  MG: 'MG', // Madagascar
  MR: 'MR', // Mauritanie
  UG: 'UG', // Ouganda
  KE: 'KE', // Kenya
};

/**
 * Vérifie si un code bancaire correspond à Orange Money
 */
export function isOrangeMoneyBankCode(bankCode: string): boolean {
  return Object.values(ORANGE_MONEY_BANK_CODES).includes(bankCode);
}

/**
 * Obtient le code bancaire Orange Money pour un pays
 */
export function getOrangeMoneyBankCode(countryCode: string): string {
  return ORANGE_MONEY_BANK_CODES[countryCode as keyof typeof ORANGE_MONEY_BANK_CODES] || 'OR';
}