import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { to, subject, html, text } = await req.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Using Resend API for email sending
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SERVIO <noreply@servio.com>',
        to,
        subject,
        html: html || text,
        text: text || html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error sending email:', data);
      return NextResponse.json({ error: data.message || 'Failed to send email' }, { status: response.status });
    }

    return NextResponse.json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
