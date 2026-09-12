export type PaymentIntentResult = {
  provider: string;
  providerRef: string;
  status: 'AUTHORIZED' | 'CAPTURED' | 'PENDING' | 'FAILED';
  raw: Record<string, unknown>;
};

export interface PaymentGateway {
  createIntent(input: {
    amount: number;
    currency: string;
    reservationId: string;
    idempotencyKey?: string;
  }): Promise<PaymentIntentResult>;
  capture(providerRef: string): Promise<PaymentIntentResult>;
  refund(input: {
    providerRef: string;
    amount: number;
    idempotencyKey?: string;
  }): Promise<{ providerRef: string; raw: Record<string, unknown> }>;
  verifyWebhookSignature(payload: string, signature?: string): boolean;
}

/** Sandbox adapter — no external credentials required. */
export class SandboxPaymentGateway implements PaymentGateway {
  async createIntent(input: {
    amount: number;
    currency: string;
    reservationId: string;
    idempotencyKey?: string;
  }): Promise<PaymentIntentResult> {
    const providerRef = `sandbox_${input.reservationId.slice(0, 8)}_${Date.now()}`;
    return {
      provider: 'sandbox',
      providerRef,
      status: 'AUTHORIZED',
      raw: { ...input, providerRef, mode: 'sandbox' },
    };
  }

  async capture(providerRef: string): Promise<PaymentIntentResult> {
    return {
      provider: 'sandbox',
      providerRef,
      status: 'CAPTURED',
      raw: { providerRef, captured: true },
    };
  }

  async refund(input: {
    providerRef: string;
    amount: number;
    idempotencyKey?: string;
  }) {
    return {
      providerRef: `refund_${input.providerRef}_${Date.now()}`,
      raw: { ...input, refunded: true },
    };
  }

  verifyWebhookSignature(_payload: string, signature?: string): boolean {
    // Sandbox accepts missing signature or "sandbox"
    return !signature || signature === 'sandbox';
  }
}
