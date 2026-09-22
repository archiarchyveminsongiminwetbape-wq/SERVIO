import { supabase, handleApiError, handleApiSuccess, handleApiFailure, type ApiResponse } from './index';

/**
 * Escrow API - Gestion des comptes séquestres et des paiements progressifs
 */

export const escrowApi = {
  /**
   * Récupère tous les comptes escrow (admin uniquement)
   */
  async getAllEscrowAccounts(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('escrow_accounts')
        .select(`
          *,
          bookings (
            id,
            client_id,
            provider_id,
            service_type,
            status,
            profiles (
              full_name,
              email
            ),
            provider_profiles (
              business_name,
              user_id
            )
          )
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      query = query.order('funded_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Récupère un compte escrow par ID
   */
  async getEscrowById(escrowId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('escrow_accounts')
        .select(`
          *,
          bookings (
            id,
            client_id,
            provider_id,
            service_type,
            status,
            profiles (
              full_name,
              email
            ),
            provider_profiles (
              business_name,
              user_id
            )
          )
        `)
        .eq('id', escrowId)
        .single();

      if (error) throw error;

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Récupère les comptes escrow d'un utilisateur (client ou provider)
   */
  async getUserEscrowAccounts(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('escrow_accounts')
        .select(`
          *,
          bookings (
            id,
            client_id,
            provider_id,
            service_type,
            status,
            profiles (
              full_name,
              email
            ),
            provider_profiles (
              business_name,
              user_id
            )
          )
        `)
        .or(`bookings.client_id.eq.${userId},bookings.provider_profiles.user_id.eq.${userId}`)
        .order('funded_at', { ascending: false });

      if (error) throw error;

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Approuve un milestone
   */
  async approveMilestone(milestoneId: string, adminId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/admin/approve-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          admin_id: adminId
        })
      });

      const result = await response.json();

      if (result.success) {
        return handleApiSuccess(result.data);
      } else {
        return handleApiFailure(result.error);
      }
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Rejette un milestone
   */
  async rejectMilestone(milestoneId: string, adminId: string, rejectionReason: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/admin/reject-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          admin_id: adminId,
          rejection_reason: rejectionReason
        })
      });

      const result = await response.json();

      if (result.success) {
        return handleApiSuccess(result.data);
      } else {
        return handleApiFailure(result.error);
      }
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Libère les fonds d'un milestone
   */
  async releaseEscrowFunds(escrowId: string, milestoneId: string, adminId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/admin/release-escrow-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrow_id: escrowId,
          milestone_id: milestoneId,
          admin_id: adminId
        })
      });

      const result = await response.json();

      if (result.success) {
        return handleApiSuccess(result.data);
      } else {
        return handleApiFailure(result.error);
      }
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Soumet un milestone avec preuves
   */
  async submitMilestone(milestoneId: string, providerId: string, evidenceUrls: string[], notes?: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/milestones/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          provider_id: providerId,
          evidence_urls: evidenceUrls,
          notes
        })
      });

      const result = await response.json();

      if (result.success) {
        return handleApiSuccess(result.data);
      } else {
        return handleApiFailure(result.error);
      }
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};

/**
 * Certifications API - Gestion des certifications de comptes
 */

export const certificationsApi = {
  /**
   * Soumet une certification
   */
  async submitCertification(userId: string, certificationType: string, evidenceData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/certifications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          certification_type: certificationType,
          evidence_data: evidenceData
        })
      });

      const result = await response.json();

      if (result.success) {
        return handleApiSuccess(result.data);
      } else {
        return handleApiFailure(result.error);
      }
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Récupère les certifications d'un utilisateur
   */
  async getUserCertifications(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('account_certifications')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Récupère toutes les certifications en attente (admin)
   */
  async getPendingCertifications(): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('account_certifications')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .in('status', ['submitted', 'under_review'])
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Approuve une certification
   */
  async approveCertification(certificationId: string, adminId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/admin/review-certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certification_id: certificationId,
          admin_id: adminId,
          approved: true
        })
      });

      const result = await response.json();

      if (result.success) {
        return handleApiSuccess(result.data);
      } else {
        return handleApiFailure(result.error);
      }
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Rejette une certification
   */
  async rejectCertification(certificationId: string, adminId: string, rejectionReason: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/admin/review-certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certification_id: certificationId,
          admin_id: adminId,
          approved: false,
          rejection_reason: rejectionReason
        })
      });

      const result = await response.json();

      if (result.success) {
        return handleApiSuccess(result.data);
      } else {
        return handleApiFailure(result.error);
      }
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  /**
   * Récupère le niveau de certification d'un utilisateur
   */
  async getUserCertificationLevel(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_certified, certification_level, certification_date')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};