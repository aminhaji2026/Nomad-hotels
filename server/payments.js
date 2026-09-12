/**
 * Payment gateways — same pattern as Creams:
 * Mock (dev), ZAAD (Horn of Africa mobile money), International (card).
 */

export class MockGateway {
  async createPayment(input) {
    return {
      providerRef: `mock_${input.reference}`,
      status: 'CONFIRMED',
      checkoutUrl: null,
      message: 'Mock payment confirmed instantly',
    }
  }

  async verifyWebhook(payload) {
    return {
      providerRef: payload?.providerRef || payload?.reference || 'mock_unknown',
      confirmed: true,
    }
  }
}

export class ZaadGateway {
  async createPayment(input) {
    if (!process.env.ZAAD_API_KEY) {
      return {
        providerRef: `zaad_demo_${input.reference}`,
        status: 'PENDING',
        checkoutUrl: null,
        message:
          'ZAAD demo mode — set ZAAD_API_KEY / ZAAD_MERCHANT_ID for live USSD push (*880#).',
      }
    }
    throw new Error('Configure ZAAD merchant endpoint and signing before production use.')
  }

  async verifyWebhook(payload, _signature) {
    if (!process.env.ZAAD_API_KEY) {
      return { providerRef: payload?.providerRef || 'zaad_demo', confirmed: true }
    }
    throw new Error('Implement ZAAD signature verification using provider documentation.')
  }
}

export class InternationalGateway {
  async createPayment(input) {
    const key = process.env.INTERNATIONAL_GATEWAY_KEY || process.env.STRIPE_SECRET_KEY
    if (!key) {
      return {
        providerRef: `intl_demo_${input.reference}`,
        status: 'PENDING',
        checkoutUrl: `/pay/demo?ref=${encodeURIComponent(input.reference)}&amount=${input.amount}`,
        message: 'International demo checkout — set INTERNATIONAL_GATEWAY_KEY for live cards.',
      }
    }
    throw new Error('Wire INTERNATIONAL_GATEWAY_KEY to your card processor before production.')
  }

  async verifyWebhook(payload, signature) {
    if (!process.env.INTERNATIONAL_GATEWAY_KEY && !process.env.STRIPE_SECRET_KEY) {
      return {
        providerRef: payload?.providerRef || payload?.reference || 'intl_demo',
        confirmed: Boolean(payload?.confirmed ?? true),
      }
    }
    if (!signature) throw new Error('Missing webhook signature')
    return {
      providerRef: payload?.providerRef || payload?.id,
      confirmed: payload?.status === 'succeeded' || payload?.confirmed === true,
    }
  }
}

export function getGateway(name = 'mock') {
  const key = String(name || 'mock').toLowerCase()
  if (key === 'zaad' || key === 'zaad') return new ZaadGateway()
  if (key === 'international' || key === 'stripe' || key === 'card') {
    return new InternationalGateway()
  }
  return new MockGateway()
}

export const PAYMENT_METHODS = [
  {
    id: 'mock',
    label: 'Demo pay (instant)',
    description: 'Development gateway — confirms immediately',
    regions: ['global'],
  },
  {
    id: 'zaad',
    label: 'ZAAD / mobile money',
    description: 'Horn of Africa USSD wallet (same stack as Creams)',
    regions: ['SO', 'SL'],
  },
  {
    id: 'international',
    label: 'Card (Visa / Mastercard)',
    description: 'International card checkout',
    regions: ['global'],
  },
]
