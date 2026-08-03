import { supabase } from '@/lib/supabase';

export async function sendEmail(to: string, subject: string, html?: string, text?: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html, text },
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendBookingConfirmationEmail(
  userEmail: string,
  userName: string,
  providerName: string,
  bookingDate: string,
  bookingTime: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Réservation Confirmée</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Bonjour ${userName},</p>
        <p style="font-size: 16px; color: #333;">Votre réservation avec <strong>${providerName}</strong> a été confirmée avec succès.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 10px 0; color: #555;"><strong>Date:</strong> ${bookingDate}</p>
          <p style="margin: 10px 0; color: #555;"><strong>Heure:</strong> ${bookingTime}</p>
        </div>
        
        <p style="font-size: 14px; color: #666;">Vous pouvez consulter tous vos rendez-vous dans votre espace personnel.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://archyveservizio.vercel.app/bookings" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir mes rendez-vous</a>
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  `;

  const text = `
    Bonjour ${userName},
    
    Votre réservation avec ${providerName} a été confirmée avec succès.
    
    Date: ${bookingDate}
    Heure: ${bookingTime}
    
    Vous pouvez consulter tous vos rendez-vous dans votre espace personnel: https://archyveservizio.vercel.app/bookings
  `;

  return sendEmail(userEmail, 'Réservation Confirmée - SERVIO', html, text);
}

export async function sendNewBookingEmail(
  providerEmail: string,
  providerName: string,
  clientName: string,
  bookingDate: string,
  bookingTime: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Nouvelle Réservation</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Bonjour ${providerName},</p>
        <p style="font-size: 16px; color: #333;">Vous avez une nouvelle réservation de <strong>${clientName}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 10px 0; color: #555;"><strong>Client:</strong> ${clientName}</p>
          <p style="margin: 10px 0; color: #555;"><strong>Date:</strong> ${bookingDate}</p>
          <p style="margin: 10px 0; color: #555;"><strong>Heure:</strong> ${bookingTime}</p>
        </div>
        
        <p style="font-size: 14px; color: #666;">Vous pouvez gérer cette réservation dans votre tableau de bord.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://archyveservizio.vercel.app/provider/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Gérer mes réservations</a>
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  `;

  const text = `
    Bonjour ${providerName},
    
    Vous avez une nouvelle réservation de ${clientName}.
    
    Client: ${clientName}
    Date: ${bookingDate}
    Heure: ${bookingTime}
    
    Vous pouvez gérer cette réservation dans votre tableau de bord: https://archyveservizio.vercel.app/provider/dashboard
  `;

  return sendEmail(providerEmail, 'Nouvelle Réservation - SERVIO', html, text);
}
