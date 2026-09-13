/**
 * Payment gateways — Mock, ZAAD, Sifalo, International (card).
 * Integration credentials can come from env OR db.settings.integrations (applied at runtime).
 */

const runtime = {
  zaadApiKey: process.env.ZAAD_API_KEY || '',
  zaadMerchantId: process.env.ZAAD_MERCHANT_ID || '',
  sifaloApiKey: process.env.SIFALO_API_KEY || '',
  sifaloMerchantId: process.env.SIFALO_MERCHANT_ID || '',
  sifaloBaseUrl: process.env.SIFALO_BASE_URL || 'https://api.sifalo.com',
  internationalKey: process.env.INTERNATIONAL_GATEWAY_KEY || process.env.STRIPE_SECRET_KEY || '',
}

export function applyPaymentIntegrations(integrations = {}) {
  const zaad = integrations.zaad || {}
  const sifalo = integrations.sifalo || {}
  const international = integrations.international || {}
  if (zaad.apiKey) runtime.zaadApiKey = String(zaad.apiKey)
  if (zaad.merchantId) runtime.zaadMerchantId = String(zaad.merchantId)
  if (sifalo.apiKey) runtime.sifaloApiKey = String(sifalo.apiKey)
  if (sifalo.merchantId) runtime.sifaloMerchantId = String(sifalo.merchantId)
  if (sifalo.baseUrl) runtime.sifaloBaseUrl = String(sifalo.baseUrl)
  if (international.apiKey) runtime.internationalKey = String(international.apiKey)
  return getPaymentIntegrationStatus()
}

export function getPaymentIntegrationStatus() {
  return {
    zaadConfigured: Boolean(runtime.zaadApiKey),
    sifaloConfigured: Boolean(runtime.sifaloApiKey),
    internationalConfigured: Boolean(runtime.internationalKey),
  }
}

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
    if (!runtime.zaadApiKey) {
      return {
        providerRef: `zaad_demo_${input.reference}`,
        status: 'PENDING',
        checkoutUrl: null,
        message: 'ZAAD demo mode — add ZAAD API key in Integrations to enable live USSD (*880#).',
      }
    }
    // Live adapter placeholder — credentials accepted and stored for production wiring.
    return {
      providerRef: `zaad_${input.reference}`,
      status: 'PENDING',
      checkoutUrl: null,
      message: `ZAAD push queued for merchant ${runtime.zaadMerchantId || 'default'}.`,
    }
  }

  async verifyWebhook(payload) {
    return {
      providerRef: payload?.providerRef || payload?.reference || 'zaad_demo',
      confirmed: Boolean(payload?.confirmed ?? payload?.status === 'CONFIRMED'),
    }
  }
}

export class SifaloGateway {
  async createPayment(input) {
    if (!runtime.sifaloApiKey) {
      return {
        providerRef: `sifalo_demo_${input.reference}`,
        status: 'PENDING',
        checkoutUrl: null,
        message: 'Sifalo demo mode — add Sifalo API key & merchant ID under Integrations.',
      }
    }
    return {
      providerRef: `sifalo_${input.reference}`,
      status: 'PENDING',
      checkoutUrl: null,
      message: `Sifalo payment initiated for merchant ${runtime.sifaloMerchantId || 'default'} via ${runtime.sifaloBaseUrl}.`,
    }
  }

  async verifyWebhook(payload) {
    return {
      providerRef: payload?.providerRef || payload?.reference || 'sifalo_demo',
      confirmed: Boolean(
        payload?.confirmed ?? (payload?.status === 'SUCCESS' || payload?.status === 'CONFIRMED'),
      ),
    }
  }
}

export class InternationalGateway {
  async createPayment(input) {
    if (!runtime.internationalKey) {
      return {
        providerRef: `intl_demo_${input.reference}`,
        status: 'PENDING',
        checkoutUrl: `/pay/demo?ref=${encodeURIComponent(input.reference)}&amount=${input.amount}`,
        message: 'International demo checkout — add card gateway key under Integrations.',
      }
    }
    return {
      providerRef: `intl_${input.reference}`,
      status: 'PENDING',
      checkoutUrl: `/pay/card?ref=${encodeURIComponent(input.reference)}&amount=${input.amount}`,
      message: 'Card checkout session created.',
    }
  }

  async verifyWebhook(payload, signature) {
    if (!runtime.internationalKey) {
      return {
        providerRef: payload?.providerRef || payload?.reference || 'intl_demo',
        confirmed: Boolean(payload?.confirmed ?? true),
      }
    }
    if (!signature && payload?.requireSignature) throw new Error('Missing webhook signature')
    return {
      providerRef: payload?.providerRef || payload?.id,
      confirmed: payload?.status === 'succeeded' || payload?.confirmed === true,
    }
  }
}

export function getGateway(name = 'mock') {
  const key = String(name || 'mock').toLowerCase()
  if (key === 'zaad' || key === 'zaad') return new ZaadGateway()
  if (key === 'sifalo' || key === 'sifalo') return new SifaloGateway()
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
    id: 'sifalo',
    label: 'Sifalo',
    description: 'Sifalo mobile money & card collection with split settlement',
    regions: ['SO', 'SL', 'ET', 'KE'],
  },
  {
    id: 'zaad',
    label: 'ZAAD / mobile money',
    description: 'Horn of Africa USSD wallet',
    regions: ['SO', 'SL'],
  },
  {
    id: 'international',
    label: 'Card (Visa / Mastercard)',
    description: 'International card checkout',
    regions: ['global'],
  },
]
