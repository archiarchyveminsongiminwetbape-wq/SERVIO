import { supabase } from './supabase';

/**
 * Service de notifications (Email et SMS)
 * Gère l'envoi de notifications pour les événements importants du système
 */

export interface NotificationConfig {
  type: 'email' | 'sms' | 'both';
  recipient: {
    email?: string;
    phone?: string;
    userId?: string;
  };
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationResult {
  success: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  error?: string;
}

export class NotificationService {
  /**
   * Envoie une notification (email et/ou SMS)
   */
  async sendNotification(config: NotificationConfig): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      emailSent: false,
      smsSent: false,
    };

    try {
      // Enregistrer la notification dans la base de données
      if (config.recipient.userId) {
        await this.recordNotification(config.recipient.userId, config.template, config.data);
      }

      // Envoyer email si configuré
      if (config.type === 'email' || config.type === 'both') {
        if (config.recipient.email) {
          const emailResult = await this.sendEmail(config.recipient.email, config.template, config.data);
          result.emailSent = emailResult.success;
          if (!emailResult.success) {
            result.error = emailResult.error;
          }
        }
      }

      // Envoyer SMS si configuré
      if (config.type === 'sms' || config.type === 'both') {
        if (config.recipient.phone) {
          const smsResult = await this.sendSMS(config.recipient.phone, config.template, config.data);
          result.smsSent = smsResult.success;
          if (!smsResult.success && !result.error) {
            result.error = smsResult.error;
          }
        }
      }

      result.success = (result.emailSent || result.smsSent) ?? false;
      return result;
    } catch (error: any) {
      console.error('Notification error:', error);
      return {
        success: false,
        error: error.message || 'Notification failed',
      };
    }
  }

  /**
   * Envoie un email
   */
  private async sendEmail(email: string, template: string, data: Record<string, any>): Promise<NotificationResult> {
    try {
      // Utiliser Supabase Edge Function pour l'envoi d'email
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuration Supabase manquante');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: email,
          template,
          data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Email sending failed',
        };
      }
    } catch (error: any) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message || 'Email sending failed',
      };
    }
  }

  /**
   * Envoie un SMS
   */
  private async sendSMS(phone: string, template: string, data: Record<string, any>): Promise<NotificationResult> {
    try {
      // Utiliser Supabase Edge Function pour l'envoi SMS
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuration Supabase manquante');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: phone,
          template,
          data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'SMS sending failed',
        };
      }
    } catch (error: any) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message || 'SMS sending failed',
      };
    }
  }

  /**
   * Enregistre une notification dans la base de données
   */
  private async recordNotification(userId: string, template: string, data: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: this.getNotificationType(template),
        title: this.getNotificationTitle(template, data),
        body: this.getNotificationBody(template, data),
        link: this.getNotificationLink(template, data),
        is_read: false,
      });

      if (error) {
        console.error('Error recording notification:', error);
      }
    } catch (error) {
      console.error('Error recording notification:', error);
    }
  }

  /**
   * Notifie le client qu'un paiement a été reçu
   */
  async notifyPaymentReceived(userId: string, amount: number, currency: string, bookingId: string): Promise<NotificationResult> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { success: false, error: 'User not found' };
    }

    return this.sendNotification({
      type: 'both',
      recipient: {
        email: profile.email,
        phone: profile.phone,
        userId,
      },
      template: 'payment_received',
      data: {
        amount,
        currency,
        bookingId,
      },
      priority: 'high',
    });
  }

  /**
   * Notifie le prestataire qu'un milestone a été approuvé
   */
  async notifyMilestoneApproved(providerId: string, milestoneTitle: string, amount: number): Promise<NotificationResult> {
    const { data: providerProfile } = await supabase
      .from('provider_profiles')
      .select(`
        user_id,
        profiles (
          email,
          phone
        )
      `)
      .eq('id', providerId)
      .single();

    if (!providerProfile) {
      return { success: false, error: 'Provider not found' };
    }

    return this.sendNotification({
      type: 'both',
      recipient: {
        email: providerProfile.profiles?.[0]?.email,
        phone: providerProfile.profiles?.[0]?.phone,
        userId: providerProfile.user_id,
      },
      template: 'milestone_approved',
      data: {
        milestoneTitle,
        amount,
      },
      priority: 'high',
    });
  }

  /**
   * Notifie le prestataire qu'un transfert a été effectué
   */
  async notifyTransferCompleted(providerId: string, amount: number, reference: string): Promise<NotificationResult> {
    const { data: providerProfile } = await supabase
      .from('provider_profiles')
      .select(`
        user_id,
        profiles (
          email,
          phone
        )
      `)
      .eq('id', providerId)
      .single();

    if (!providerProfile) {
      return { success: false, error: 'Provider not found' };
    }

    return this.sendNotification({
      type: 'both',
      recipient: {
        email: providerProfile.profiles?.[0]?.email,
        phone: providerProfile.profiles?.[0]?.phone,
        userId: providerProfile.user_id,
      },
      template: 'transfer_completed',
      data: {
        amount,
        reference,
      },
      priority: 'high',
    });
  }

  /**
   * Notifie l'utilisateur qu'une certification a été approuvée
   */
  async notifyCertificationApproved(userId: string, certificationType: string): Promise<NotificationResult> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { success: false, error: 'User not found' };
    }

    return this.sendNotification({
      type: 'both',
      recipient: {
        email: profile.email,
        phone: profile.phone,
        userId,
      },
      template: 'certification_approved',
      data: {
        certificationType,
      },
      priority: 'normal',
    });
  }

  /**
   * Notifie l'admin qu'un paiement nécessite une validation
   */
  async notifyAdminPaymentValidation(paymentId: string, amount: number, customerName: string): Promise<NotificationResult> {
    // Récupérer tous les admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, email, phone')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return { success: false, error: 'No admins found' };
    }

    // Envoyer à tous les admins
    const results = await Promise.all(
      admins.map(admin =>
        this.sendNotification({
          type: 'email',
          recipient: {
            email: admin.email,
            phone: admin.phone,
            userId: admin.id,
          },
          template: 'admin_payment_validation',
          data: {
            paymentId,
            amount,
            customerName,
          },
          priority: 'high',
        })
      )
    );

    return {
      success: results.some(r => r.success),
      emailSent: results.some(r => r.emailSent),
    };
  }

  /**
   * Notifie l'admin qu'un milestone nécessite une validation
   */
  async notifyAdminMilestoneValidation(milestoneId: string, providerName: string, amount: number): Promise<NotificationResult> {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, email, phone')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return { success: false, error: 'No admins found' };
    }

    const results = await Promise.all(
      admins.map(admin =>
        this.sendNotification({
          type: 'email',
          recipient: {
            email: admin.email,
            phone: admin.phone,
            userId: admin.id,
          },
          template: 'admin_milestone_validation',
          data: {
            milestoneId,
            providerName,
            amount,
          },
          priority: 'high',
        })
      )
    );

    return {
      success: results.some(r => r.success),
      emailSent: results.some(r => r.emailSent),
    };
  }

  /**
   * Obtient le type de notification basé sur le template
   */
  private getNotificationType(template: string): string {
    const typeMap: Record<string, string> = {
      payment_received: 'booking',
      milestone_approved: 'booking',
      transfer_completed: 'booking',
      certification_approved: 'validation',
      admin_payment_validation: 'system',
      admin_milestone_validation: 'system',
    };
    return typeMap[template] || 'system';
  }

  /**
   * Obtient le titre de notification basé sur le template
   */
  private getNotificationTitle(template: string, data: Record<string, any>): string {
    const titleMap: Record<string, (data: any) => string> = {
      payment_received: () => 'Paiement reçu',
      milestone_approved: () => 'Jalon approuvé',
      transfer_completed: () => 'Transfert effectué',
      certification_approved: () => 'Certification approuvée',
      admin_payment_validation: () => 'Paiement à valider',
      admin_milestone_validation: () => 'Jalon à valider',
    };

    const titleFn = titleMap[template];
    return titleFn ? titleFn(data) : 'Notification';
  }

  /**
   * Obtient le corps de notification basé sur le template
   */
  private getNotificationBody(template: string, data: Record<string, any>): string {
    const bodyMap: Record<string, (data: any) => string> = {
      payment_received: (data) => `Votre paiement de ${data.amount} ${data.currency} a été reçu.`,
      milestone_approved: (data) => `Le jalon "${data.milestoneTitle}" a été approuvé. Montant: ${data.amount} XAF`,
      transfer_completed: (data) => `Un transfert de ${data.amount} XAF a été effectué vers votre compte. Réf: ${data.reference}`,
      certification_approved: (data) => `Votre certification "${data.certificationType}" a été approuvée.`,
      admin_payment_validation: (data) => `Paiement de ${data.amount} XAF de ${data.customerName} à valider.`,
      admin_milestone_validation: (data) => `Jalon de ${data.amount} XAF de ${data.providerName} à valider.`,
    };

    const bodyFn = bodyMap[template];
    return bodyFn ? bodyFn(data) : 'Nouvelle notification';
  }

  /**
   * Obtient le lien de notification basé sur le template
   */
  private getNotificationLink(template: string, data: Record<string, any>): string | null {
    const linkMap: Record<string, (data: any) => string | null> = {
      payment_received: (data) => `/bookings/${data.bookingId}`,
      milestone_approved: () => '/provider/dashboard',
      transfer_completed: () => '/provider/wallet',
      certification_approved: () => '/settings/certifications',
      admin_payment_validation: (data) => `/admin/payments/${data.paymentId}`,
      admin_milestone_validation: (data) => `/admin/milestones/${data.milestoneId}`,
    };

    const linkFn = linkMap[template];
    return linkFn ? linkFn(data) : null;
  }
}

// Instance singleton
export const notificationService = new NotificationService();