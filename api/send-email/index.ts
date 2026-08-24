// This file is not compatible with Vite. 
// Email sending should be handled via Supabase Edge Functions or a proper backend server.
// For now, this file is disabled to fix TypeScript errors.

export default async function handler(req: any) {
  return new Response('Email API not configured for Vite', { status: 501 });
}
