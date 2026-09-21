declare module 'flutterwave-node-v3' {
  export interface FlutterwaveConfig {
    public_key: string;
    secret_key: string;
    encryption_key: string;
  }

  export interface ChargeResponse {
    status: string;
    message: string;
    data?: {
      id: string;
      tx_ref: string;
      flw_ref: string;
      amount: string;
      currency: string;
      customer: {
        email: string;
        name: string;
        phone: string;
      };
      payment_method: string;
      payment_type: string;
      created_at: string;
      meta?: any;
      authorization?: {
        redirect_url: string;
        mode: string;
      };
    };
    meta?: any;
  }

  export interface PaymentRequest {
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
    payment_options?: string;
  }

  export interface TransactionVerifyResponse {
    status: string;
    message: string;
    data: {
      id: string;
      tx_ref: string;
      flw_ref: string;
      amount: string;
      currency: string;
      status: string;
      payment_type: string;
      created_at: string;
      customer: {
        email: string;
        name: string;
        phone: string;
      };
      meta?: any;
    };
  }

  export interface RefundResponse {
    status: string;
    message: string;
    data: {
      id: string;
      amount: string;
      currency: string;
      tx_ref: string;
      flw_ref: string;
    };
  }

  export class Flutterwave {
    constructor(publicKey: string, secretKey: string, encryptionKey: string);

    Charge: {
      card(paymentRequest: PaymentRequest): Promise<ChargeResponse>;
      bank_transfer(paymentRequest: PaymentRequest): Promise<ChargeResponse>;
      mobile_money(paymentRequest: PaymentRequest): Promise<ChargeResponse>;
      ussd(paymentRequest: PaymentRequest): Promise<ChargeResponse>;
    };

    Transaction: {
      verify(params: { id: string }): Promise<TransactionVerifyResponse>;
      refund(params: { id: string; amount?: number }): Promise<RefundResponse>;
      get(params: { id: string }): Promise<TransactionVerifyResponse>;
      getAll(params?: any): Promise<any>;
    };

    Subaccount: {
      create(params: any): Promise<any>;
      get(params: any): Promise<any>;
      getAll(params?: any): Promise<any>;
      update(params: any): Promise<any>;
    };

    Transfer: {
      initiate(params: any): Promise<any>;
      get(params: any): Promise<any>;
      getAll(params?: any): Promise<any>;
    };

    Beneficiary: {
      create(params: any): Promise<any>;
      get(params: any): Promise<any>;
      getAll(params?: any): Promise<any>;
      update(params: any): Promise<any>;
      delete(params: any): Promise<any>;
    };

    VirtualAccount: {
      create(params: any): Promise<any>;
      get(params: any): Promise<any>;
      getAll(params?: any): Promise<any>;
    };

    Invoice: {
      create(params: any): Promise<any>;
      get(params: any): Promise<any>;
      getAll(params?: any): Promise<any>;
      update(params: any): Promise<any>;
      cancel(params: any): Promise<any>;
    };

    PaymentPlan: {
      create(params: any): Promise<any>;
      get(params: any): Promise<any>;
      getAll(params?: any): Promise<any>;
      update(params: any): Promise<any>;
      cancel(params: any): Promise<any>;
    };

    Subscription: {
      create(params: any): Promise<any>;
      get(params: any): Promise<any>;
      getAll(params?: any): Promise<any>;
      cancel(params: any): Promise<any>;
      activate(params: any): Promise<any>;
    };
  }

  export default Flutterwave;
}
