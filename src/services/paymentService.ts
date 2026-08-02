import { supabase } from '@/lib/supabase';

export interface CreatePaymentIntentParams {
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: string;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: params,
    });

    if (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }

    return data as PaymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
}

export async function createPaymentRecord(params: {
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  provider_payment_id?: string;
}) {
  try {
    const { data, error } = await supabase.from('payments').insert({
      booking_id: params.booking_id,
      user_id: params.user_id,
      amount: params.amount,
      currency: params.currency,
      payment_method: params.payment_method,
      payment_provider: 'stripe',
      provider_payment_id: params.provider_payment_id,
      status: 'processing',
    }).select().single();

    if (error) {
      console.error('Error creating payment record:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating payment record:', error);
    return null;
  }
}

export async function updatePaymentStatus(paymentId: string, status: string) {
  try {
    const { error } = await supabase.from('payments').update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      failed_at: status === 'failed' ? new Date().toISOString() : null,
    }).eq('id', paymentId);

    if (error) {
      console.error('Error updating payment status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    return false;
  }
}

export async function getPaymentByBookingId(bookingId: string) {
  try {
    const { data, error } = await supabase.from('payments').select('*').eq('booking_id', bookingId).maybeSingle();

    if (error) {
      console.error('Error fetching payment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching payment:', error);
    return null;
  }
}
