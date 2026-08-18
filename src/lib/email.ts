export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Network error' };
  }
}

export function generateBookingConfirmationEmail(
  providerName: string,
  clientName: string,
  date: string,
  time: string,
  serviceType: string
): EmailOptions {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Réservation confirmée</h2>
      <p>Bonjour ${clientName},</p>
      <p>Votre réservation avec <strong>${providerName}</strong> a été confirmée.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Heure:</strong> ${time}</p>
        <p><strong>Service:</strong> ${serviceType}</p>
      </div>
      <p>Vous pouvez contacter le prestataire via votre espace messagerie.</p>
      <p style="color: #666; font-size: 12px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
    </div>
  `;

  return {
    to: '', // Will be set by caller
    subject: `Réservation confirmée avec ${providerName}`,
    html,
    text: `Votre réservation avec ${providerName} a été confirmée pour le ${date} à ${time}.`,
  };
}

export function generateBookingRequestEmail(
  providerName: string,
  clientName: string,
  date: string,
  time: string,
  serviceType: string
): EmailOptions {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Nouvelle demande de réservation</h2>
      <p>Bonjour ${providerName},</p>
      <p>Vous avez reçu une nouvelle demande de réservation de <strong>${clientName}</strong>.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Heure:</strong> ${time}</p>
        <p><strong>Service:</strong> ${serviceType}</p>
      </div>
      <p>Connectez-vous à votre dashboard pour accepter ou refuser cette demande.</p>
      <p style="color: #666; font-size: 12px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
    </div>
  `;

  return {
    to: '', // Will be set by caller
    subject: `Nouvelle demande de réservation de ${clientName}`,
    html,
    text: `Vous avez une nouvelle demande de réservation de ${clientName} pour le ${date} à ${time}.`,
  };
}

export function generateInvoiceEmail(
  invoiceNumber: string,
  amount: number,
  currency: string,
  dueDate: string,
  providerName: string
): EmailOptions {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Facture générée</h2>
      <p>Bonjour,</p>
      <p>Une nouvelle facture a été générée par <strong>${providerName}</strong>.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Numéro de facture:</strong> ${invoiceNumber}</p>
        <p><strong>Montant:</strong> ${amount} ${currency}</p>
        <p><strong>Date d'échéance:</strong> ${dueDate}</p>
      </div>
      <p>Connectez-vous à votre espace pour voir les détails de la facture.</p>
      <p style="color: #666; font-size: 12px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
    </div>
  `;

  return {
    to: '', // Will be set by caller
    subject: `Facture ${invoiceNumber} - ${amount} ${currency}`,
    html,
    text: `Facture ${invoiceNumber} de ${amount} ${currency} générée par ${providerName}. Échéance: ${dueDate}`,
  };
}

export function generateWelcomeEmail(userName: string): EmailOptions {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Bienvenue sur SERVIO !</h2>
      <p>Bonjour ${userName},</p>
      <p>Merci de vous être inscrit sur SERVIO. Nous sommes ravis de vous accueillir !</p>
      <p>Vous pouvez maintenant:</p>
      <ul style="margin: 20px 0; padding-left: 20px;">
        <li>Rechercher des prestataires de services</li>
        <li>Créer votre profil prestataire</li>
        <li>Gérer vos réservations</li>
        <li>Communiquer avec d'autres utilisateurs</li>
      </ul>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      <p style="color: #666; font-size: 12px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
    </div>
  `;

  return {
    to: '', // Will be set by caller
    subject: 'Bienvenue sur SERVIO !',
    html,
    text: `Bienvenue sur SERVIO, ${userName} ! Découvrez toutes nos fonctionnalités.`,
  };
}
